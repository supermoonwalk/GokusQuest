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
             metShop: false, tomBeaten: false, intro: false, bossMet: {}, bowlReady: false,
             puzzles: {}, kitties: {} },
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
    home: {},                        // furniture owned for Goku's hut: { bed: true, ... }
    villagers: {},                   // rescued villagers (they run shops in town): { smith: true, ... }
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
    G.maps.home = World.buildHome();
    G.maps.hollow = World.buildHollow();
    G.maps.grounds = World.buildGrounds();
    G.maps.ew_gate = World.buildEwGate();
    G.maps.ew_crossing = World.buildEwCrossing();
    G.maps.ew_shrine = World.buildEwShrine();
    G.maps.oak_roots = World.buildOakRoots();
    G.maps.oak_heart = World.buildOakHeart();
    G.maps.ew_glade = World.buildEwGlade();
    G.maps.ew_thorn = World.buildEwThorn();
    G.maps.ew_overlook = World.buildEwOverlook();
    G.maps.den_a = World.buildDenA();
    G.maps.den_b = World.buildDenB();
    const ent = World.makeEntities();
    G.entities.overworld = ent.overworld;
    G.entities.forest = ent.forest;
    G.entities.shop = ent.shop;
    G.entities.interior = ent.interior;
    G.entities.home = ent.home;
    G.entities.hollow = World.hollowEntities();
    G.entities.grounds = World.groundsEntities();
    Object.assign(G.entities, World.elderwoodEntities());
    G.entities.manor = World.manorEntities();
    // give every entity pixel coords; init monster combat state
    for (const m in G.entities) for (const e of G.entities[m]) {
      e.px = e.x * TS; e.py = e.y * TS;
      if (e.type === "monster") Combat.initMonster(e);
    }
    G.cur = "home";
    const pb = World.PLAYER_BASE;
    G.player = {
      px: 2 * TS, py: 2 * TS, dir: "down", vx: 0, vy: 0, moving: false,
      name: pb.name, baseMaxHp: pb.maxHp, baseAtk: pb.atk, baseDef: pb.def,
      maxHp: pb.maxHp, hp: pb.maxHp, atk: pb.atk, def: pb.def, spd: pb.spd,
      iframes: 0, atkCD: 0, atkTimer: 0, hurtFlash: 0, spin: 0, dead: false,
    };
    G.spawn = { map: "home", x: 2, y: 2 };        // respawn point: Goku's hut, by the mat
    applyHome();
    applyVillagers();
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
    // furniture perks (Goku's hut)
    if (G.home.bed) maxHp += 6;
    if (G.home.post) atk += 1;
    if (G.home.cushion) maxChi += 2;
    if (G.home.dummy) def += 1;
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
    if (G.cur !== "overworld" && G.cur !== "home" && G.cur !== "shop" && G.cur !== "interior") G.flags.bowlReady = true;   // a trip out
    respawnStale(G.cur);
    if (G.cur === "forest" && G.quest === "deduced") setQuest("fighting");
    const firstGrounds = G.cur === "grounds" && !G.flags.enteredGrounds;
    const firstManor = G.cur === "manor" && !G.flags.enteredManor;
    if (firstGrounds) { G.flags.enteredGrounds = true; setQuest("grounds"); }
    const firstInterior = G.cur === "interior" && !G.flags.searched;
    if (firstManor) { G.flags.enteredManor = true; setQuest("manor"); }
    if (firstInterior) { G.flags.searched = true; if (G.quest === "start") setQuest("searched"); }
    Save.checkpoint();
    if (firstGrounds) {
      setTimeout(() => UI.showChapterCard(), 260);
      return;
    }
    if (firstManor) {
      UI.showDialogue(null, ["The castle doors boom shut behind you.", "Somewhere above, kittens are crying. And that smell... lavender."]);
      return;
    }
    if (firstInterior) {
      UI.showDialogue("Goku", [
        "Chi Chi? ...Chi Chi, are you home?",
        "The cottage is ransacked. Something's wrong. Look for clues \u2014 walk up to things and press E."
      ]);
    }
  }
  // fallen (non-boss) enemies return once they've been gone a while
  const RESPAWN_FRAMES = 60 * 60 * 3;           // 3 minutes of play
  function respawnStale(map) {
    for (const e of (G.entities[map] || [])) {
      if (e.type !== "monster" || e.alive || e.boss) continue;
      if (e.deadAt == null) e.deadAt = G.frame;  // e.g. restored from a save: start the clock now
      if (G.frame - e.deadAt < RESPAWN_FRAMES) continue;
      e.alive = true; e.dead = false; e.hp = e.maxHp; e.state = "roam"; e.stateT = 0; e.atkCD = 90;
      e.px = e.x * TS; e.py = e.y * TS; e.deadAt = null;
      delete G.flags.defeated[e.id];
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
      if (!["sign", "clue", "item", "gear", "chest", "npc", "captive", "shop", "furniture", "obstacle"].includes(e.type)) continue;
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
          G.villagers.smith ? "(Swap or sell gear at Bramble's Forge in town.)" : "(Check it in your BAG. Better gear is equipped automatically.)"
        ]);
      } else {
        const amt = e.coins || 10;
        G.coins += amt;
        UI.showDialogue("Goku", ["You crack open the chest \u2014 " + amt + " coins clatter out! \u2728"]);
        UI.updateHud();
      }
      return;
    }
    if (e.type === "shop") { if (e.shopId) Shop.open(e.shopId); else warpTo("shop", 5, 6, "up"); return; }
    if (e.type === "npc") { talkNPC(e); return; }
    if (e.type === "captive") { freeCaptive(e); return; }
    if (e.type === "furniture") { useFurniture(e.fid); return; }
    if (e.type === "obstacle") { World.useObstacle(G, e); return; }
  }

  /* -------------------- GOKU'S HUT -------------------- */
  // put owned furniture into the hut map
  function applyHome() {
    if (!G.maps.home) return;
    if (G.home.room && G.maps.home.w < 15) G.maps.home = World.buildHome(true);   // Hazel built the extra room
    const map = G.maps.home;
    for (const fid in World.FURNITURE) {
      if (!G.home[fid]) continue;
      const f = World.FURNITURE[fid];
      const cells = f.cells || [[f.x, f.y]];
      for (const [x, y] of cells) {
        if (f.ground) map.ground[y][x] = f.ground;
        else map.object[y][x] = f.tile;
      }
    }
  }
  // rescued villagers leave their cage and run a stall in town
  function applyVillagers() {
    for (const m in G.entities) for (const e of G.entities[m]) {
      if (e.requires) e.gone = !G.villagers[e.requires];
      if (e.requiresFlag) e.gone = !G.flags[e.requiresFlag];
      if (e.villager && G.villagers[e.villager]) { e.gone = true; e.caged = false; }
      if (e.lostKitty && G.flags.kitties[e.id]) e.gone = true;
    }
    if (World.applyRegion) World.applyRegion(G);
  }

  function buyFurniture(fid) {
    const f = World.FURNITURE[fid];
    if (!f || G.home[fid] || G.coins < f.cost) return false;
    G.coins -= f.cost; G.home[fid] = true;
    applyHome();
    applyVillagers(); recalcPlayer(true); UI.updateHud();
    return true;
  }
  function rest() {
    const p = G.player;
    p.hp = p.maxHp;
    if (G.home.bed) G.chi = G.maxChi;
    UI.updateHud();
    Save.checkpoint();
  }
  function useFurniture(fid) {
    const F = World.FURNITURE;
    if (fid === "mat") {
      if (G.home.bed) {
        rest();
        UI.showDialogue("Goku", ["*Goku curls up in his cosy bed for a proper nap.*", "Fully rested! HP and CHI restored."]);
      } else {
        rest();
        UI.showDialogue("Goku", ["*Goku naps on his scratchy straw mat.*", "HP restored. (A real bed would help me focus, too. Whiskers sells one.)"]);
      }
      return;
    }
    const f = F[fid];
    if (!G.home[fid]) {
      UI.showDialogue("Goku", ["An empty corner. A " + f.name + " would fit nicely here.", "(Whiskers sells one for " + f.cost + " coins: " + f.desc + ")"]);
      return;
    }
    if (fid === "bowl") {
      if (G.flags.bowlReady) {
        G.flags.bowlReady = false; G.treats++; UI.updateHud();
        UI.showDialogue("Goku", ["*Something glints beside the fish bowl.* A Fish Treat! (+1)", "(Another one will be waiting after your next trip out.)"]);
      } else UI.showDialogue("Goku", ["The goldfish blows a bubble at you.", "(Head out on an adventure. There'll be a treat waiting when you're back.)"]);
      return;
    }
    if (fid === "trophies") {
      const lines = ["Goku's trophy shelf."];
      if (G.flags.tomBeaten) lines.push("Tuxedo Tom's crooked bowtie. A reminder: never back down.");
      if (G.flags.defeated && G.flags.defeated.vesper) lines.push("Madame Vesper's jewelled collar. The dominion is undone.");
      if (lines.length === 1) lines.push("...It's empty. For now.");
      UI.showDialogue("Goku", lines);
      return;
    }
    UI.showDialogue("Goku", [f.name + ". " + f.desc]);
  }

  function freeCaptive(e) {
    if (e.lostKitty) {
      G.flags.kitties[e.id] = true; e.caged = false;
      const n = Object.keys(G.flags.kitties).length;
      UI.showDialogue(e.kname, ["*a tiny, shivering kitten peeks out from the leaves*",
        "\"I got lost... are you taking me HOME?\"",
        e.kname + " scampers off toward town. (Lost kitties found: " + n + ")"], () => {
        G.fx.push({ kind: "poof", x: e.px + 8, y: e.py + 8, t: 0, life: 14 });
        applyVillagers();
      });
      return;
    }
    if (e.villager) {
      const v = World.VILLAGERS[e.villager];
      e.caged = false;
      UI.showDialogue(v.name, v.lines, () => {
        G.villagers[e.villager] = true;
        Combat.popText(e.px, e.py - 6, "\u2665", "#ff8aa0");
        G.fx.push({ kind: "poof", x: e.px + 8, y: e.py + 8, t: 0, life: 14 });
        applyVillagers();
        UI.showDialogue(null, [v.name + " heads for town. NEW SHOP: " + v.title + " (near the town square)."]);
      });
      return;
    }
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
    if (e.id === "mochi") {
      if (G.flags.scroll) {
        UI.showDialogue("Master Mochi", [
          "\"My scroll! The Seven Paws technique, safe again.\"",
          "\"You fight with heart, little one, but your form is... enthusiastic. Come to my DOJO.\"",
          "\"I will open it in your town. Special techniques are my business \u2014 not a market cat's.\""], () => {
          G.villagers.dojo = true; setQuest("dojo");
          G.fx.push({ kind: "poof", x: e.px + 8, y: e.py + 8, t: 0, life: 14 });
          applyVillagers();
          UI.showDialogue(null, ["NEW SHOP: Mochi's Dojo (east of the pond). Special moves are taught there now."]);
        });
      } else {
        if (G.quest === "ch3") setQuest("scroll");
        UI.showDialogue("Master Mochi", [
          "\"Hm. A cat who walks the Elderwood without fear. Rare, these days.\"",
          "\"I am Mochi, keeper of this shrine. A brute called OLD FANG stole my scroll and crawled into the HOLLOW OAK.\"",
          "\"The roots inside answer only to light. Bring my scroll back, and I will teach you properly.\""]);
      }
      return;
    }
    if (e.id === "chichi_home") {
      const lines = G.quest === "ch3"
        ? ["\"Home, sweet hut! Though... you really need more furniture, brother.\"",
           "\"The thorns north of town withered the moment Vesper fell. Grandpa said the ELDERWOOD lies beyond.\"",
           "\"There are more lost kitties out there. Go on \u2014 I'll keep the fish warm.\""]
        : ["\"Welcome back! Did you find any lost kitties out there?\"",
           "(Lost kitties found: " + Object.keys(G.flags.kitties).length + ")"];
      UI.showDialogue("Chi Chi", lines);
      return;
    }
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
    if (e.id === "shopkeep") { Shop.open("whiskers"); return; }
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
      for (const m in G.entities) Combat.resetMap(m);
      updateCamera(); UI.updateHud();
      UI.showDialogue("", [
        "Everything goes dark... then Goku shakes it off. (A cat always lands on its feet.)",
        "You wake up at home in your hut, coins still in your pocket. But every stray and thug you beat has crept back.",
        "Spend your coins, get stronger, and try again."]);
    }, 480);
  }

  // called by combat.js when a monster's hp hits 0
  function onMonsterDefeated(e) {
    e.alive = false; e.dead = true; e.deadAt = G.frame;
    G.flags.defeated[e.id] = true;
    if (e.coins) spawnCoins(e.px, e.py, e.coins);

    if (e.vesper) { setQuest("done"); Cutscene.finale(); return; }
    if (e.wildking) {
      G.flags.ewKing = true;
      for (const m of G.entities[G.cur]) if (m.summoned && m.alive) { m.alive = false; G.fx.push({ kind: "poof", x: m.px + 8, y: m.py + 8, t: 0, life: 14 }); }
      Cutscene.wildKingDefeat(e);
      return;
    }
    if (e.drop === "scroll") {
      G.flags.scroll = true;
      setTimeout(() => UI.showDialogue(null, ["Old Fang slumps. The scroll rolls across the floor.",
        "You got MASTER MOCHI'S SCROLL! Bring it back to her at the shrine."]), 500);
      return;
    }
    if (e.id === "boss") {
      G.flags.tomBeaten = true;      // Chi Chi's cage is carried off during the reveal scene
      setQuest("tomBeaten");
      Cutscene.vesperReveal(e);     // opens the manor gate on screen
      return;
    }
  }

  /* -------------------- CAMERA -------------------- */
  function updateCamera() {
    const map = G.maps[G.cur];
    const mapPxW = map.w * TS, mapPxH = map.h * TS;
    const p = G.player;
    // cutscenes can point the camera somewhere else (G.camFocus, pixel centre);
    // the camera then eases there, and eases back to Goku once it's cleared
    const f = G.camFocus;
    let cx = (f ? f.x : p.px + TS / 2) - VPW / 2;
    let cy = (f ? f.y : p.py + TS / 2) - VPH / 2;
    if (mapPxW <= VPW) cx = -(VPW - mapPxW) / 2;
    else cx = Math.max(0, Math.min(cx, mapPxW - VPW));
    if (mapPxH <= VPH) cy = -(VPH - mapPxH) / 2;
    else cy = Math.max(0, Math.min(cy, mapPxH - VPH));
    if (f || G.camEase) {
      const k = 0.08;
      G.camera.x += (cx - G.camera.x) * k; G.camera.y += (cy - G.camera.y) * k;
      if (!f && Math.abs(cx - G.camera.x) < 0.5 && Math.abs(cy - G.camera.y) < 0.5) G.camEase = false;
      else return;
    }
    G.camera.x = cx; G.camera.y = cy;
  }

  window.Engine = {
    init, update, render: null, interact, setQuest, warpTo,
    onMonsterDefeated, onPlayerDeath, recalcPlayer,
    equipGear, unequipSlot, sellGear, autoEquipIfBetter, freedCount,
    spawnCoins, updateScriptedNpcs, centerOf, moveEntity, updateCamera, useTreat,
    applyHome, buyFurniture, applyVillagers, respawnStale,
    VPW, VPH, TS, PBOX, tileSolid, boxHitsSolid,
  };
})();
