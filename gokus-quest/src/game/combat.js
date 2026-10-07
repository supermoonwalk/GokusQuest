/* ============================================================
   combat.js  —  Real-time action combat: player swipe, enemy
   AI (roam/chase/telegraph/lunge), specials, hit FX, coins.
   ============================================================ */
(function () {
  const TS = 16;
  const ATK_DUR = 12, ATK_CD = 8, ATK_RANGE = 16;

  /* -------------------- monster setup -------------------- */
  function initMonster(e) {
    const m = World.MONSTERS[e.mon];
    e.maxHp = m.hp; e.hp = m.hp;
    e.atk = m.atk; e.touch = m.touch || m.atk;
    e.speed = m.speed || 0.6; e.aggro = m.aggro || 70;
    e.coins = m.coins || 0; e.big = !!m.big;
    e.boss = !!e.boss || !!m.boss; e.vesper = !!e.vesper || !!m.vesper;
    e.state = "roam"; e.stateT = 0; e.dir = e.dir || "down";
    e.hurtFlash = 0; e.moving = false; e.alive = (e.alive !== false);
    e.atkCD = 60; e.homeX = e.px; e.homeY = e.py; e.wanderA = Math.random() * 6.28;
    e.enraged = false; e.healed = false;
    e.dormant = !!e.wake;            // bosses idle until the player enters their zone
  }
  function resetMap(map) {
    for (const e of (G.entities[map] || [])) {
      if (e.type !== "monster") continue;
      // revive fallen non-boss enemies; bosses, once beaten, stay beaten
      if (e.boss && G.flags.defeated[e.id]) continue;
      e.alive = true; e.dead = false;
      e.hp = e.maxHp; e.state = "roam"; e.stateT = 0; e.atkCD = 90;
      e.px = e.x * TS; e.py = e.y * TS;
      e.dormant = !!e.wake; e.enraged = false;
      delete G.flags.defeated[e.id];
    }
  }

  /* -------------------- per-frame update -------------------- */
  function update() {
    const p = G.player;
    if (p.iframes > 0) p.iframes--;
    if (p.hurtFlash > 0) p.hurtFlash--;
    if (p.atkCD > 0) p.atkCD--;
    if (p.atkTimer > 0) {
      p.atkTimer--;
      if (p.atkTimer === p.atkHit) resolveSwipe();      // active frame
    }
    if (p.spin > 0) {
      p.spin--;
      if (p.spin % 3 === 0) resolveSpin();
      if (p.spin === 0) p.iframes = Math.max(p.iframes, 6);
    }
    // chi passive regen from charm handled on hit; small trickle:
    if (G.frame % 30 === 0 && G.chi < G.maxChi && (G.equipped.charm)) gainChi(1);

    Engine.updateScriptedNpcs();

    const pc = Engine.centerOf(p);
    for (const e of (G.entities[G.cur] || [])) {
      if (e.type !== "monster" || !e.alive) continue;
      if (e.hurtFlash > 0) e.hurtFlash--;
      updateMonster(e, pc);
    }
    separateBodies();
    updateHexes();
    // coin drop physics
    for (const c of G.coinDrops) {
      c.t = (c.t || 0) + 1;
      if (c.t < 16) { c.px += c.vx; c.py += c.vy; c.vy += 0.18; }
    }
    tickFX();
  }
  function tickFX() {
    for (const f of G.fx) { f.t++; }
    G.fx = G.fx.filter(f => f.t < f.life);
  }

  function updateMonster(e, pc) {
    const ec = { x: e.px + 8, y: e.py + 8 };
    const dx = pc.x - ec.x, dy = pc.y - ec.y;
    const dist = Math.hypot(dx, dy);
    if (e.atkCD > 0) e.atkCD--;
    e.stateT++;
    e.moving = false;

    // dormant boss: sit still until the player steps into the arena
    if (e.dormant) {
      faceVel(e, dx, dy);   // watches you approach
      const tx = Math.floor(pc.x / TS), ty = Math.floor(pc.y / TS), z = e.wake;
      if (tx >= z.x0 && tx <= z.x1 && ty >= z.y0 && ty <= z.y1) wakeBoss(e);
      return;
    }

    // boss phase tweaks
    if (e.vesper && !e.enraged && e.hp <= e.maxHp * 0.5) {
      e.enraged = true; e.atk += 3; e.speed += 0.25;
      popText(e.px, e.py - 6, "ENRAGED!", "#ff7ad0");
    }

    if (e.state === "roam") {
      // gentle wander near home
      if (e.stateT % 90 === 0) e.wanderA = Math.random() * 6.28;
      const wx = Math.cos(e.wanderA) * 0.25, wy = Math.sin(e.wanderA) * 0.25;
      Engine.moveEntity(e, wx, wy, mbox(e));
      faceVel(e, wx, wy); e.moving = true;
      // tether
      if (Math.hypot(e.px - e.homeX, e.py - e.homeY) > 48) e.wanderA = Math.atan2(e.homeY - e.py, e.homeX - e.px);
      if (dist < e.aggro) { e.state = "chase"; e.stateT = 0; }
    } else if (e.state === "chase") {
      faceVel(e, dx, dy);
      if (dist > 14) {
        const sp = e.speed;
        Engine.moveEntity(e, dx / dist * sp, dy / dist * sp, mbox(e));
        e.moving = true;
      }
      if (dist < (e.big ? 26 : 20) && e.atkCD <= 0) { e.state = "windup"; e.stateT = 0; }
      if (dist > e.aggro * 1.7) { e.state = "roam"; e.stateT = 0; }
      // Vesper ranged hex
      if (e.vesper && e.atkCD <= 0 && dist > 30 && dist < 130 && Math.random() < 0.04) {
        spawnHex(e, dx / dist, dy / dist); e.atkCD = 90;
      }
    } else if (e.state === "windup") {
      e.hurtFlash = e.hurtFlash;  // keep
      // telegraph: brief pause + a flash tint via wind flag
      e.windup = true;
      if (e.stateT > (e.big ? 26 : 18)) {
        e.state = "lunge"; e.stateT = 0; e.windup = false;
        const a = Math.atan2(dy, dx); e.lx = Math.cos(a); e.ly = Math.sin(a);
        faceVel(e, e.lx, e.ly);
      }
    } else if (e.state === "lunge") {
      const sp = (e.big ? 2.0 : 2.6);
      Engine.moveEntity(e, e.lx * sp, e.ly * sp, mbox(e));
      e.moving = true;
      // a lunge ends on contact instead of carrying through the player
      const touching = Math.hypot(pc.x - (e.px + 8), pc.y - (e.py + 8)) <= bodyGap(e) + 1;
      if (touching || e.stateT > 10) { e.state = "recover"; e.stateT = 0; e.atkCD = e.big ? 55 : 42; }
    } else if (e.state === "recover") {
      if (e.stateT > (e.big ? 30 : 20)) { e.state = dist < e.aggro ? "chase" : "roam"; e.stateT = 0; }
    }

    // contact damage to player (bodies never overlap, so test against the touching distance)
    const cd = Math.hypot(pc.x - (e.px + 8), pc.y - (e.py + 8));
    if (cd <= bodyGap(e) + 1 && G.player.iframes <= 0 && !G.player.dead) {
      hurtPlayer(e.touch);
    }
  }

  function wakeBoss(e) {
    e.dormant = false; e.state = "chase"; e.stateT = 0; e.atkCD = 70;
    const met = G.flags.bossMet || (G.flags.bossMet = {});
    const again = met[e.id]; met[e.id] = true;
    if (!e.vesper && G.quest === "fighting") Engine.setQuest("boss");
    // first meeting: a full scene; a rematch after dying: one line and straight to it
    if (!again) { if (e.vesper) Cutscene.vesperIntro(e); else Cutscene.tomIntro(e); return; }
    if (e.vesper) UI.showDialogue("Madame Vesper", ["\"Persistent little stray. I do admire persistence... in a trophy.\""]);
    else UI.showDialogue("Tuxedo Tom", ["\"Back for another scratch, kid?\""]);
  }

  function mbox(e) { return { ox: 3, oy: 6, w: 10, h: 9 }; }

  /* -------------------- body separation -------------------- */
  // closest the centres of a monster and the player may get
  function bodyGap(e) { return e.big ? 15 : 12; }
  // push overlapping bodies apart: monsters vs player, and monsters vs each other.
  // moves go through moveEntity, so nobody is shoved into a wall; if a monster is
  // pinned, the player takes the remaining push instead.
  function separateBodies() {
    const p = G.player;
    const mons = (G.entities[G.cur] || []).filter(e => e.type === "monster" && e.alive);
    for (const e of mons) {
      if (p.dead) break;
      const pc = Engine.centerOf(p);
      let dx = (e.px + 8) - pc.x, dy = (e.py + 8) - pc.y;
      let d = Math.hypot(dx, dy);
      const gap = bodyGap(e);
      if (d >= gap) continue;
      if (d < 0.01) { dx = p.dir === "left" ? -1 : 1; dy = 0; d = 1; }   // exactly stacked
      const push = gap - d, nx = dx / d, ny = dy / d;
      const ox = e.px, oy = e.py;
      Engine.moveEntity(e, nx * push, ny * push, mbox(e));
      const moved = (e.px - ox) * nx + (e.py - oy) * ny;
      const rest = push - moved;
      if (rest > 0.05) Engine.moveEntity(p, -nx * rest, -ny * rest, Engine.PBOX);
    }
    for (let i = 0; i < mons.length; i++) for (let j = i + 1; j < mons.length; j++) {
      const a = mons[i], b = mons[j];
      let dx = b.px - a.px, dy = b.py - a.py, d = Math.hypot(dx, dy);
      const gap = (a.big || b.big) ? 14 : 11;
      if (d >= gap) continue;
      if (d < 0.01) { dx = 1; dy = 0; d = 1; }
      const half = (gap - d) / 2, nx = dx / d, ny = dy / d;
      Engine.moveEntity(a, -nx * half, -ny * half, mbox(a));
      Engine.moveEntity(b, nx * half, ny * half, mbox(b));
    }
  }

  /* -------------------- Vesper's hex bolts -------------------- */
  // simulated here (not in renderFX) so they freeze with the game and stop at walls
  function updateHexes() {
    const p = G.player, map = G.maps[G.cur];
    for (const f of G.fx) {
      if (f.kind !== "hex") continue;
      f.x += f.vx; f.y += f.vy;
      if (Engine.tileSolid(map, Math.floor(f.x / TS), Math.floor(f.y / TS))) { f.t = f.life; continue; }
      if (!p.dead && p.iframes <= 0 && Math.hypot(f.x - (p.px + 8), f.y - (p.py + 8)) < 8) {
        hurtPlayer(f.dmg); f.t = f.life;
      }
    }
  }
  function faceVel(e, vx, vy) {
    if (!vx && !vy) return;
    if (Math.abs(vx) > Math.abs(vy)) e.dir = vx < 0 ? "left" : "right";
    else e.dir = vy < 0 ? "up" : "down";
  }

  /* -------------------- player offense -------------------- */
  function playerAttack() {
    const p = G.player;
    if (p.dead || p.spin > 0 || p.atkTimer > 0 || p.atkCD > 0) return;
    // the Speed upgrade also quickens the swipe: +10% attack rate per level
    const f = 1 + G.upgrades.spd * 0.1;
    const dur = Math.round(ATK_DUR / f), cd = Math.round(ATK_CD / f);
    p.atkTimer = dur; p.atkDur = dur; p.atkHit = dur - 3; p.atkCD = dur + cd;
    G.fx.push({ kind: "swoosh", t: 0, life: 6 });
  }
  function resolveSwipe() {
    const p = G.player, c = Engine.centerOf(p);
    let fx = c.x, fy = c.y;
    if (p.dir === "up") fy -= 13; else if (p.dir === "down") fy += 13;
    else if (p.dir === "left") fx -= 13; else fx += 13;
    let hitAny = false;
    for (const e of (G.entities[G.cur] || [])) {
      if (e.type !== "monster" || !e.alive) continue;
      const ec = { x: e.px + 8, y: e.py + 8 };
      if (Math.hypot(ec.x - fx, ec.y - fy) < (e.big ? 16 : 13)) {
        const dmg = Math.max(1, p.atk + rnd(2) - Math.floor((e.def || 0)));
        damageMonster(e, dmg, p.dir);
        hitAny = true;
      }
    }
    if (hitAny) { gainChi(2); }
  }

  function damageMonster(e, dmg, fromDir) {
    e.hp -= dmg; e.hurtFlash = 6;
    popText(e.px + 4, e.py - 2, "" + dmg, "#fff");
    // knockback
    const kb = e.big ? 3 : 6;
    let kx = 0, ky = 0;
    if (fromDir === "up") ky = -kb; else if (fromDir === "down") ky = kb;
    else if (fromDir === "left") kx = -kb; else kx = kb;
    Engine.moveEntity(e, kx, ky, mbox(e));
    if (e.state === "roam") { e.state = "chase"; e.stateT = 0; }
    if (e.hp <= 0) { Engine.onMonsterDefeated(e); G.fx.push({ kind: "poof", x: e.px + 8, y: e.py + 8, t: 0, life: 14 }); }
  }

  /* -------------------- specials -------------------- */
  function useSpecial(slot) {
    const id = G.specials[slot];
    if (!id) return;
    const sp = World.SPECIALS[id];
    if (G.chi < sp.cost) { popText(G.player.px + 4, G.player.py - 4, "no CHI", "#9ad6ff"); return; }
    if (G.player.spin > 0 || G.player.dead) return;
    G.chi -= sp.cost; UI.updateHud();
    if (id === "slam") {
      G.player.spin = 30; G.player.spinDur = 30; G.player.iframes = 30;
      G.fx.push({ kind: "slamtext", x: G.player.px + 8, y: G.player.py - 8, t: 0, life: 28 });
    } else if (id === "dash") {
      doDash();
    } else if (id === "roar") {
      doRoar();
    }
  }
  function resolveSpin() {
    const p = G.player, c = Engine.centerOf(p);
    for (const e of (G.entities[G.cur] || [])) {
      if (e.type !== "monster" || !e.alive) continue;
      const ec = { x: e.px + 8, y: e.py + 8 };
      const d = Math.hypot(ec.x - c.x, ec.y - c.y);
      if (d < 26 && !(e._spinHitUntil > G.frame)) {
        e._spinHitUntil = G.frame + 12;      // one hit per ~200ms of the spin
        const dmg = Math.max(1, Math.round(p.atk * 2.2) + rnd(4) - (e.def || 0));
        const a = Math.atan2(ec.y - c.y, ec.x - c.x);
        e.hp -= dmg; e.hurtFlash = 6; popText(e.px + 4, e.py - 2, "" + dmg, "#ffe08a");
        Engine.moveEntity(e, Math.cos(a) * 9, Math.sin(a) * 9, mbox(e));
        if (e.hp <= 0) { Engine.onMonsterDefeated(e); G.fx.push({ kind: "poof", x: e.px + 8, y: e.py + 8, t: 0, life: 14 }); }
      }
    }
  }
  function doDash() {
    const p = G.player; let dx = 0, dy = 0;
    if (p.dir === "up") dy = -1; else if (p.dir === "down") dy = 1; else if (p.dir === "left") dx = -1; else dx = 1;
    Engine.moveEntity(p, dx * 26, dy * 26, Engine.PBOX);
    p.iframes = 18; G.fx.push({ kind: "dash", x: p.px + 8, y: p.py + 9, t: 0, life: 10, dir: p.dir });
  }
  function doRoar() {
    const p = G.player, c = Engine.centerOf(p);
    G.fx.push({ kind: "ring", x: c.x, y: c.y, t: 0, life: 18 });
    for (const e of (G.entities[G.cur] || [])) {
      if (e.type !== "monster" || !e.alive) continue;
      const ec = { x: e.px + 8, y: e.py + 8 }, d = Math.hypot(ec.x - c.x, ec.y - c.y);
      if (d < 48) {
        const dmg = Math.max(1, Math.round(p.atk * 1.4) - (e.def || 0));
        e.hp -= dmg; e.hurtFlash = 6; popText(e.px + 4, e.py - 2, "" + dmg, "#ffb0b0");
        const a = Math.atan2(ec.y - c.y, ec.x - c.x);
        Engine.moveEntity(e, Math.cos(a) * 12, Math.sin(a) * 12, mbox(e));
        e.state = "recover"; e.stateT = 0; e.atkCD = 40;
        if (e.hp <= 0) { Engine.onMonsterDefeated(e); G.fx.push({ kind: "poof", x: e.px + 8, y: e.py + 8, t: 0, life: 14 }); }
      }
    }
  }

  /* -------------------- enemy projectiles (Vesper) -------------------- */
  function spawnHex(e, nx, ny) {
    G.fx.push({ kind: "hex", x: e.px + 8, y: e.py + 8, vx: nx * 1.8, vy: ny * 1.8, t: 0, life: 90, dmg: e.atk });
  }

  /* -------------------- damage to player -------------------- */
  function hurtPlayer(dmg) {
    const p = G.player;
    const real = Math.max(1, dmg - Math.floor(p.def / 2));
    p.hp -= real; p.iframes = 40; p.hurtFlash = 10;
    popText(p.px + 4, p.py - 2, "-" + real, "#ff8a8a");
    UI.updateHud();
    if (p.hp <= 0 && !p.dead) Engine.onPlayerDeath();
  }

  function gainChi(n) { G.chi = Math.min(G.maxChi, G.chi + n); UI.updateHud(); }
  function rnd(n) { return Math.floor(Math.random() * (n + 1)); }
  function popText(x, y, text, color) { G.fx.push({ kind: "text", x, y, text, color, t: 0, life: 36, vy: -0.5 }); }

  /* -------------------- FX render -------------------- */
  function renderFX(ctx, cam) {
    for (const f of G.fx) {
      if (f.kind === "text") {
        const a = 1 - f.t / f.life;
        ctx.save(); ctx.globalAlpha = Math.max(0, a);
        ctx.font = "bold 9px 'Press Start 2P', monospace";
        ctx.fillStyle = "rgba(0,0,0,.5)";
        ctx.fillText(f.text, Math.round(f.x - cam.x + 1), Math.round(f.y - cam.y + f.t * f.vy + 1));
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, Math.round(f.x - cam.x), Math.round(f.y - cam.y + f.t * f.vy));
        ctx.restore();
      } else if (f.kind === "poof") {
        const a = 1 - f.t / f.life, r = 4 + f.t * 1.3;
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(f.x - cam.x, f.y - cam.y, r, 0, 6.28); ctx.stroke(); ctx.restore();
      } else if (f.kind === "ring") {
        const a = 1 - f.t / f.life, r = 6 + f.t * 2.4;
        ctx.save(); ctx.globalAlpha = a * 0.8; ctx.strokeStyle = "#ffd27a"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(f.x - cam.x, f.y - cam.y, r, 0, 6.28); ctx.stroke(); ctx.restore();
      } else if (f.kind === "dash") {
        ctx.save(); ctx.globalAlpha = 0.5 * (1 - f.t / f.life); ctx.strokeStyle = "#cfeaff"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(f.x - cam.x, f.y - cam.y); ctx.lineTo(f.x - cam.x - 14, f.y - cam.y); ctx.stroke(); ctx.restore();
      } else if (f.kind === "hex") {
        const px = f.x - cam.x, py = f.y - cam.y;
        ctx.save(); ctx.fillStyle = "#8fe04a"; ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 6.28); ctx.fill();
        ctx.fillStyle = "#cffaa0"; ctx.beginPath(); ctx.arc(px, py, 1.5, 0, 6.28); ctx.fill(); ctx.restore();
      } else if (f.kind === "flash") {
        ctx.save(); ctx.globalAlpha = 0.7 * (1 - f.t / f.life); ctx.fillStyle = f.color || "#fff";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
      } else if (f.kind === "smoke") {
        if (f.t < 0) continue;                 // staggered puffs wait their turn
        const a = 1 - f.t / f.life, r = 3 + f.t * 0.6;
        ctx.save(); ctx.globalAlpha = a * 0.8; ctx.fillStyle = f.color || "#5a2d6e";
        ctx.beginPath(); ctx.arc(f.x - cam.x + Math.sin(f.t * 0.3 + f.x) * 2, f.y - cam.y - f.t * 0.4, r, 0, 6.28); ctx.fill();
        ctx.restore();
      } else if (f.kind === "heart") {
        // rises and fades; a small pixel heart
        const a = 1 - f.t / f.life;
        ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, a * 1.6));
        Sprites.drawHeart(ctx, Math.round(f.x - cam.x), Math.round(f.y - cam.y - f.t * 0.35), 1, true);
        ctx.restore();
      } else if (f.kind === "slamtext") {
        const a = 1 - f.t / f.life;
        ctx.save(); ctx.globalAlpha = Math.max(0, a);
        ctx.font = "bold 10px 'Press Start 2P', monospace"; ctx.textAlign = "center";
        ctx.fillStyle = "#1a0f24"; ctx.fillText("180 SLAM!", f.x - cam.x + 1, f.y - cam.y - f.t * 0.4 + 1);
        ctx.fillStyle = "#ffe08a"; ctx.fillText("180 SLAM!", f.x - cam.x, f.y - cam.y - f.t * 0.4);
        ctx.restore(); ctx.textAlign = "start";
      }
    }
  }

  /* -------------------- prop canvases -------------------- */
  const _props = {};
  function propCanvas(id) {
    if (_props[id]) return _props[id];
    const c = document.createElement("canvas"); c.width = 16; c.height = 16;
    const cx = c.getContext("2d");
    if (id === "ribbon") Sprites.drawPixels(cx, Sprites.RIBBON.rows, Sprites.RIBBON.pal, 0, 0, 1, false);
    _props[id] = c; return c;
  }

  window.Combat = {
    initMonster, resetMap, update, tickFX, playerAttack, useSpecial, renderFX, popText, propCanvas, gainChi,
  };
})();
