/* ============================================================
   engine.js  —  World state, CONTINUOUS movement + AABB tile
   collision, camera, rendering, interaction, warps, coins,
   death/respawn. Owns global G. Combat lives in combat.js.
   ============================================================ */
(function () {
  const TS = 16;
  const VPW = 256, VPH = 192;       // 16 x 12 tiles

  // player collision box (feet), relative to the 16px sprite cell
  const PBOX = { ox: 3, oy: 7, w: 10, h: 8 };

  const G = {
    state: "title",                  // title | play | dialogue | menu | map | shop | cutscene | ending
    cur: "overworld",
    maps: {}, entities: {},
    player: null,
    camera: { x: 0, y: 0 },
    frame: 0,
    inventory: [],
    treats: 3,
    coins: 0,
    flags: { searched: false, deduced: false, defeated: {}, cluesSeen: {}, ribbon: false,
             kittens: {}, enteredManor: false, learnedSlam: false, shopMoved: false,
             metShop: false, tomBeaten: false, intro: false, bossMet: {} },
    quest: "start",
    keys: {},
    menu: null,                      // 'quest' | 'inventory'
    // progression via shop upgrades
    upgrades: { hp: 0, atk: 0, def: 0, spd: 0, chi: 0 },
    chi: 0, maxChi: 6,
    gearOwned: [],                   // array of gear instances {gid,tier,roll}
    equipped: { claws: null, collar: null, charm: null },
    specials: [null, null],          // two assignable slots (keys J / K)
    specialsOwned: [],               // unlocked special ids
    fx: [],                          // transient visual effects (combat.js pushes)
    coinDrops: [],                   // active coin pickups on current map
  };
  window.G = G;

  /* -------------------- COLLISION -------------------- */
  function tileSolid(map, x, y) {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return true;
    const g = Tiles.TILES[map.ground[y][x]];
    if (g && g.solid) return true;
    const oid = map.object[y][x];
    if (oid) { const o = Tiles.TILES[oid]; if (o && o.solid) return true; }
    return false;
  }
  function boxHitsSolid(map, bx, by, bw, bh) {
    const x0 = Math.floor(bx / TS), x1 = Math.floor((bx + bw - 1) / TS);
    const y0 = Math.floor(by / TS), y1 = Math.floor((by + bh - 1) / TS);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++)
        if (tileSolid(map, tx, ty)) return true;
    return false;
  }
  /* solid entities: NPCs, chests, cages and the market stall block movement.
     Returned as pixel rects (feet-level footprint, like the tile collision). */
  const SOLID_TYPES = ["npc", "chest", "gear", "captive", "shop"];
  function entityRect(e) {
    if (e.gone || e.scripted) return null;                 // walking shopkeeper doesn't block
    if ((e.type === "chest" || e.type === "gear") && e.taken) return null;
    if (e.type === "captive" && !e.caged) return null;     // freed cats can be walked past
    if (e.type === "shop") return { x: e.px - 7, y: e.py - 2, w: 30, h: 18 };   // stall counter
    return { x: e.px + 2, y: e.py + 6, w: 12, h: 9 };
  }
  function boxHitsEntity(ent, bx, by, bw, bh) {
    for (const e of (G.entities[G.cur] || [])) {
      if (e === ent || !SOLID_TYPES.includes(e.type)) continue;
      const r = entityRect(e); if (!r) continue;
      if (bx < r.x + r.w && bx + bw > r.x && by < r.y + r.h && by + bh > r.y) return e;
    }
    return null;
  }
  // move an entity along one axis, 1px at a time, stopping at walls
  function moveAxis(map, ent, dx, dy, box) {
    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)));
    const sx = dx / (steps || 1), sy = dy / (steps || 1);
    for (let i = 0; i < steps; i++) {
      const nx = ent.px + sx, ny = ent.py + sy;
      // an entity you already overlap (e.g. spawned on it) never traps you
      const inside = boxHitsEntity(ent, ent.px + box.ox, ent.py + box.oy, box.w, box.h);
      const hitE = boxHitsEntity(ent, nx + box.ox, ny + box.oy, box.w, box.h);
      if (hitE && hitE !== inside) break;
      if (!boxHitsSolid(map, nx + box.ox, ny + box.oy, box.w, box.h)) {
        ent.px = nx; ent.py = ny;
      } else break;
    }
  }
  function moveEntity(ent, dx, dy, box) {
    const map = G.maps[G.cur];
    if (dx) moveAxis(map, ent, dx, 0, box);
    if (dy) moveAxis(map, ent, 0, dy, box);
  }
  window.__moveEntity = moveEntity;   // used by combat.js for enemies

  function centerOf(ent) { return { x: ent.px + 8, y: ent.py + 8 }; }

  /* -------------------- INIT -------------------- */
  function init() {
    G.maps.overworld = World.buildOverworld();
    G.maps.forest = World.buildForest();
    G.maps.shop = World.buildShop();
    G.maps.interior = World.buildInterior();
    G.maps.manor = World.buildManor();
    const ent = World.makeEntities();
    G.entities.overworld = ent.overworld;
    G.entities.forest = ent.forest;
    G.entities.shop = ent.shop;
    G.entities.interior = ent.interior;
    G.entities.manor = World.manorEntities();
    // give every entity pixel coords; init monster combat state
    for (const m in G.entities) for (const e of G.entities[m]) {
      e.px = e.x * TS; e.py = e.y * TS;
      if (e.type === "monster") Combat.initMonster(e);
    }
    G.cur = "overworld";
    const pb = World.PLAYER_BASE;
    G.player = {
      px: 3 * TS, py: 7 * TS, dir: "down", vx: 0, vy: 0, moving: false,
      name: pb.name, baseMaxHp: pb.maxHp, baseAtk: pb.atk, baseDef: pb.def,
      maxHp: pb.maxHp, hp: pb.maxHp, atk: pb.atk, def: pb.def, spd: pb.spd,
      iframes: 0, atkCD: 0, atkTimer: 0, hurtFlash: 0, spin: 0, dead: false,
    };
    G.spawn = { map: "overworld", x: 3, y: 7 };   // respawn point (town)
    recalcPlayer(false);
    G.state = "title";
  }

  /* -------------------- STATS -------------------- */
  function recalcPlayer(keepRatio) {
    const p = G.player, U = World.UPGRADES, u = G.upgrades;
    const oldMax = p.maxHp || 1, ratio = p.hp / oldMax;
    let atk = p.baseAtk + u.atk * U.atk.step;
    let def = p.baseDef + u.def * U.def.step;
    let maxHp = p.baseMaxHp + u.hp * U.hp.step;
    let maxChi = 6 + u.chi * U.chi.step;
    let spd = World.PLAYER_BASE.spd + u.spd * U.spd.step;
    // equipped gear
    const eq = G.equipped;
    if (eq.claws) atk += eq.claws.atk;
    if (eq.collar) def += eq.collar.def;
    if (eq.charm) maxChi += eq.charm.chi;
    p.atk = atk; p.def = def; p.maxHp = maxHp; p.spd = spd;
    G.maxChi = maxChi;
    if (keepRatio) p.hp = Math.max(1, Math.round(maxHp * ratio));
    if (p.hp > p.maxHp) p.hp = p.maxHp;
    if (G.chi > G.maxChi) G.chi = G.maxChi;
    if (window.UI && UI.updateHud) UI.updateHud();
  }

  /* -------------------- MOVEMENT (continuous) -------------------- */
  function handleMovement() {
    const p = G.player, k = G.keys;
    if (p.dead || p.spin > 0) { p.moving = false; return; }
    let dx = 0, dy = 0;
    if (k.left) dx -= 1; if (k.right) dx += 1;
    if (k.up) dy -= 1; if (k.down) dy += 1;
    // don't change facing mid-swing
    const swinging = p.atkTimer > 0;
    if (dx || dy) {
      if (!swinging) {
        if (Math.abs(dx) > Math.abs(dy)) p.dir = dx < 0 ? "left" : "right";
        else p.dir = dy < 0 ? "up" : "down";
      }
      let len = Math.hypot(dx, dy) || 1;
      const sp = p.spd * (swinging ? 0.35 : 1);
      moveEntity(p, (dx / len) * sp, (dy / len) * sp, PBOX);
      p.moving = true;
    } else p.moving = false;
  }

  /* -------------------- UPDATE -------------------- */
  function update() {
    G.frame++;
    if (G.state === "cutscene" && G.scene) { Cutscene.update(); Combat.tickFX(); updateCamera(); return; }
    if (G.state !== "play") return;
    handleMovement();
    Combat.update();
    pickupCoins();
    checkWarps();
    updateCamera();
    Save.tick();
  }

  function pickupCoins() {
    const pc = centerOf(G.player);
    for (const c of G.coinDrops) {
      if (c.dead) continue;
      // gentle magnet
      const dx = pc.x - (c.px + 4), dy = pc.y - (c.py + 4);
      const d = Math.hypot(dx, dy);
      if (d < 28) { c.px += dx / d * 1.6; c.py += dy / d * 1.6; }
      if (d < 9) {
        c.dead = true; G.coins += c.value;
        Combat.popText(c.px, c.py, "+" + c.value, "#f4d24a");
        UI.updateHud();
      }
    }
    G.coinDrops = G.coinDrops.filter(c => !c.dead);
  }

  function spawnCoins(px, py, amount) {
    const n = Math.min(8, Math.max(1, Math.round(amount / 2)));
    for (let i = 0; i < n; i++) {
      G.coinDrops.push({
        px: px + (Math.random() * 16 - 8), py: py + (Math.random() * 16 - 8),
        value: Math.max(1, Math.round(amount / n)),
        vx: Math.random() * 2 - 1, vy: -Math.random() * 1.5 - 0.5, t: 0, dead: false,
      });
    }
  }

  /* -------------------- WARPS -------------------- */
  function checkWarps() {
    const p = G.player; const c = centerOf(p);
    const tx = Math.floor(c.x / TS), ty = Math.floor(c.y / TS);
    for (const w of World.WARPS) {
      if (w.map === G.cur && w.x === tx && w.y === ty) { doWarp(w); return; }
    }
  }
  function doWarp(w) {
    if (w.needForest && !G.flags.deduced) {
      UI.showDialogue(null, ["A heavy fallen log blocks the woodland path.", "No reason to head in yet. Find out what happened to Chi Chi first."]);
      return;
    }
    const p = G.player;
    G.cur = w.toMap;
    p.px = w.toX * TS; p.py = w.toY * TS; p.dir = w.toDir; p.vx = p.vy = 0;
    G.coinDrops = [];
    G.fx = [];
    UI.flashTransition();
    updateCamera();
    if (G.cur === "forest" && G.quest === "deduced") setQuest("fighting");
    const firstManor = G.cur === "manor" && !G.flags.enteredManor;
    const firstInterior = G.cur === "interior" && !G.flags.searched;
    if (firstManor) { G.flags.enteredManor = true; setQuest("manor"); }
    if (firstInterior) { G.flags.searched = true; if (G.quest === "start") setQuest("searched"); }
    Save.checkpoint();
    if (firstManor) {
      setTimeout(() => UI.showChapterCard(), 260);
      return;
    }
    if (firstInterior) {
      UI.showDialogue("Goku", [
        "Chi Chi? ...Chi Chi, are you home?",
        "The cottage is ransacked. Something's wrong. Look for clues \u2014 walk up to things and press E."
      ]);
    }
  }
  function warpTo(map, x, y, dir) {
    doWarp({ toMap: map, toX: x, toY: y, toDir: dir || "down" });
  }

  /* -------------------- INTERACTION -------------------- */
  // find the nearest interactable in front of / around the player
  function interactTarget() {
    const p = G.player, c = centerOf(p);
    let fx = c.x, fy = c.y;
    if (p.dir === "up") fy -= 14; else if (p.dir === "down") fy += 14;
    else if (p.dir === "left") fx -= 14; else fx += 14;
    let best = null, bestD = 20 * 20;
    for (const e of (G.entities[G.cur] || [])) {
      if (e.gone) continue;
      if (e.type === "monster") continue;
      if ((e.type === "item" || e.type === "gear" || e.type === "chest") && e.taken) continue;
      if (!["sign", "clue", "item", "gear", "chest", "npc", "captive", "shop"].includes(e.type)) continue;
      const ex = e.px + 8, ey = e.py + 8;
      const d = (ex - fx) * (ex - fx) + (ey - fy) * (ey - fy);
      if (d < bestD) { bestD = d; best = e; }
    }
    // warps (doors) too
    const tx = Math.floor(fx / TS), ty = Math.floor(fy / TS);
    for (const w of World.WARPS) if (w.map === G.cur && w.x === tx && w.y === ty) {
      return { warp: w };
    }
    return best ? { entity: best } : null;
  }

  function interact() {
    const t = interactTarget();
    if (!t) return;
    if (t.warp) { doWarp(t.warp); return; }
    interactEntity(t.entity);
  }
  // hint marker position for render.js
  window.__interactHint = function () {
    if (G.state !== "play") return null;
    const t = interactTarget();
    if (!t) return null;
    if (t.entity) return { px: t.entity.px, py: t.entity.py };
    if (t.warp) return { px: t.warp.x * TS, py: t.warp.y * TS };
    return null;
  };

  function interactEntity(e) {
    if (e.type === "sign") { UI.showDialogue(null, e.text); return; }
    if (e.type === "clue") {
      G.flags.cluesSeen[e.id] = true;
      UI.showDialogue("Goku", e.text, () => {
        if (e.isKey && !G.flags.deduced) {
          G.flags.deduced = true; setQuest("deduced");
          World.openForestGate(G);
          UI.showDialogue(null, ["QUEST UPDATED!",
            "Tuxedo Tom took Chi Chi! His gang hides in WHISKERWOOD, past the fallen log at the EAST edge of town.",
            "Nothing will stop Goku now. He'll shove that log aside himself.",
            "Stock up at Whiskers' shop, then head into the woods. Swipe with SPACE to fight."]);
        }
      });
      return;
    }
    if (e.type === "item") {
      if (e.taken) return; e.taken = true;
      if (e.item === "ribbon") { G.flags.ribbon = true; addItem("ribbon"); }
      UI.showDialogue("Goku", e.text);
      return;
    }
    if (e.type === "chest" || e.type === "gear") {
      if (e.taken) return; e.taken = true;
      if (e.gid || e.type === "gear") {
        const inst = World.rollGear(e.gid);
        G.gearOwned.push(inst);
        autoEquipIfBetter(inst);
        UI.showDialogue("Goku", [
          "A treasure chest! Inside: the " + World.tierName(inst.tier) + " " + World.GEAR[inst.gid].name + ".",
          World.gearLine(inst) + (inst.equipped ? " Equipped it!" : " Stowed in your bag."),
          "(Manage gear from the BAG menu. Sell spares at the shop.)"
        ]);
      } else {
        const amt = e.coins || 10;
        G.coins += amt;
        UI.showDialogue("Goku", ["You crack open the chest \u2014 " + amt + " coins clatter out! \u2728"]);
        UI.updateHud();
      }
      return;
    }
    if (e.type === "shop") { warpTo("shop", 5, 6, "up"); return; }
    if (e.type === "npc") { talkNPC(e); return; }
    if (e.type === "captive") { freeCaptive(e); return; }
  }

  function freeCaptive(e) {
    if (e.kid) {
      if (e.caged) {
        e.caged = false; G.flags.kittens[e.id] = true;
        const n = freedCount();
        const bonus = 15; G.coins += bonus;
        UI.showDialogue(e.kname, [
          "*the cage clicks open*",
          "You set " + e.kname + " free! \"Thank you! Here \u2014 take my coins, brave Goku.\" (+" + bonus + " coins)",
          n >= 5 ? "Every stolen kitten is free! Now \u2014 the throne." : "(" + n + " of 5 kittens freed.)"
        ]);
        UI.updateHud();
      } else UI.showDialogue(e.kname, ["\"Go get her, Goku! We're all rooting for you.\""]);
      return;
    }
    if (e.final) {
      if (G.flags.defeated["vesper"]) UI.showDialogue("Chi Chi", ["My hero. Let's take everyone home, brother. \u2665"]);
      else UI.showDialogue("Chi Chi", ["Goku! She's too strong \u2014 free the others, get stronger at the shop, then finish her!"]);
      return;
    }
  }

  function talkNPC(e) {
    if (e.id === "villager") {
      if (!G.flags.metShop) {
        G.flags.metShop = true;
        if (!e.gaveTreats) { e.gaveTreats = true; G.treats += 2; addItem("treat"); }
        UI.showDialogue("Whiskers", [
          "Goku! I heard an awful racket at Chi Chi's last night.",
          "Take these Fish Treats. And listen: step into my SHOP, the stall just south of here.",
          "Bring me coins from those woodland bullies and I'll toughen you up: more health, sharper claws, the works.",
          "Go on, let me get back to my counter!"
        ], () => startShopkeeperWalk(e));
        return;
      }
      UI.showDialogue("Whiskers", ["Pop into my stall any time. Just walk up and press E to step inside."]);
      return;
    }
    if (e.id === "shopkeep") { Shop.open(); return; }
  }

  // scripted walk of the shopkeeper into his shop after first chat
  function startShopkeeperWalk(e) {
    const path = World.SHOPKEEPER_PATH;       // array of {x,y} tile targets
    e.scripted = true; e.pathIdx = 0; e.path = path;
  }
  function updateScriptedNpcs() {
    for (const e of (G.entities.overworld || [])) {
      if (!e.scripted) continue;
      const tgt = e.path[e.pathIdx];
      if (!tgt) { e.scripted = false; G.flags.shopMoved = true; e.gone = true; continue; }
      const tx = tgt.x * TS, ty = tgt.y * TS;
      const dx = tx - e.px, dy = ty - e.py;
      const d = Math.hypot(dx, dy);
      if (d < 1.2) { e.px = tx; e.py = ty; e.pathIdx++; }
      else {
        const sp = 1.1;
        e.px += dx / d * sp; e.py += dy / d * sp;
        e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
      }
    }
  }

  function useTreat() {
    const p = G.player;
    if (p.dead) return false;
    if (G.treats <= 0) { Combat.popText(p.px - 4, p.py - 2, "NO TREATS", "#ffb0b0"); return false; }
    if (p.hp >= p.maxHp) { Combat.popText(p.px - 2, p.py - 2, "HP FULL", "#cfeaff"); return false; }
    G.treats--;
    const heal = Math.min(14, p.maxHp - p.hp);
    p.hp += heal;
    Combat.popText(p.px + 4, p.py - 2, "+" + heal, "#6fd06f");
    UI.updateHud();
    return true;
  }

  function addItem(id) { if (!G.inventory.includes(id)) G.inventory.push(id); }
  function setQuest(step) { G.quest = step; UI.updateHud(); }

  /* -------------------- GEAR HELPERS -------------------- */
  function autoEquipIfBetter(inst) {
    const slot = World.GEAR[inst.gid].slot;
    const cur = G.equipped[slot];
    const stat = World.GEAR[inst.gid].statKey;
    if (!cur || inst[stat] > cur[stat]) { equipGear(inst); }
  }
  function equipGear(inst) {
    const slot = World.GEAR[inst.gid].slot;
    for (const g of G.gearOwned) if (World.GEAR[g.gid].slot === slot) g.equipped = false;
    inst.equipped = true; G.equipped[slot] = inst;
    recalcPlayer(true);
  }
  function unequipSlot(slot) {
    if (G.equipped[slot]) G.equipped[slot].equipped = false;
    G.equipped[slot] = null; recalcPlayer(true);
  }
  function sellGear(inst) {
    const price = World.gearValue(inst);
    G.gearOwned = G.gearOwned.filter(g => g !== inst);
    if (inst.equipped) unequipSlot(World.GEAR[inst.gid].slot);
    G.coins += price; UI.updateHud();
    return price;
  }
  function freedCount() { return Object.keys(G.flags.kittens).filter(k => G.flags.kittens[k]).length; }

  /* -------------------- DEATH / RESPAWN -------------------- */
  function onPlayerDeath() {
    const p = G.player;
    p.dead = true;
    G.state = "cutscene";
    UI.flashTransition();
    setTimeout(() => {
      G.cur = G.spawn.map;
      p.px = G.spawn.x * TS; p.py = G.spawn.y * TS; p.dir = "down";
      p.hp = p.maxHp; G.chi = 0; p.iframes = 60; p.dead = false;
      p.vx = p.vy = 0; G.coinDrops = []; G.fx = [];
      // respawn fallen enemies (non-boss) so the woods refill
      Combat.resetMap("forest");
      Combat.resetMap("manor");
      updateCamera(); UI.updateHud();
      UI.showDialogue("", [
        "Everything goes dark... then Goku shakes it off. (A cat always lands on its feet.)",
        "You wake safe back in town, coins still in your pocket. But every stray and thug you beat has crept back.",
        "Spend your coins, get stronger, and try again."]);
    }, 480);
  }

  // called by combat.js when a monster's hp hits 0
  function onMonsterDefeated(e) {
    e.alive = false; e.dead = true;
    G.flags.defeated[e.id] = true;
    if (e.coins) spawnCoins(e.px, e.py, e.coins);

    if (e.vesper) { setQuest("done"); Cutscene.finale(); return; }
    if (e.boss) {
      G.flags.tomBeaten = true;
      const cap = (G.entities.forest).find(x => x.id === "chichi");
      if (cap) cap.gone = true;
      World.openManorGate(G);
      setQuest("tomBeaten");
      setTimeout(() => UI.vesperReveal(), 700);
      return;
    }
  }

  /* -------------------- CAMERA -------------------- */
  function updateCamera() {
    const map = G.maps[G.cur];
    const mapPxW = map.w * TS, mapPxH = map.h * TS;
    const p = G.player;
    let cx = p.px + TS / 2 - VPW / 2;
    let cy = p.py + TS / 2 - VPH / 2;
    if (mapPxW <= VPW) cx = -(VPW - mapPxW) / 2;
    else cx = Math.max(0, Math.min(cx, mapPxW - VPW));
    if (mapPxH <= VPH) cy = -(VPH - mapPxH) / 2;
    else cy = Math.max(0, Math.min(cy, mapPxH - VPH));
    G.camera.x = cx; G.camera.y = cy;
  }

  window.Engine = {
    init, update, render: null, interact, setQuest, warpTo,
    onMonsterDefeated, onPlayerDeath, recalcPlayer,
    equipGear, unequipSlot, sellGear, autoEquipIfBetter, freedCount,
    spawnCoins, updateScriptedNpcs, centerOf, moveEntity, updateCamera, useTreat,
    VPW, VPH, TS, PBOX, tileSolid, boxHitsSolid,
  };
})();
