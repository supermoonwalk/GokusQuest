/* ============================================================
   render.js  —  Draws the world each frame. Assigned to
   Engine.render. Reads G, Tiles, Sprites, Sprites2, Combat.
   ============================================================ */
(function () {
  const TS = 16, VPW = 256, VPH = 192;

  function walkBob(ent, moving) {
    if (moving) return (Math.floor(G.frame / 6) % 2) ? -1 : 0;
    return (Math.floor(G.frame / 32) % 8 === 0) ? -1 : 0;
  }

  // simple coin sprite
  function drawCoin(ctx, x, y, t) {
    const f = Math.floor((G.frame + t) / 8) % 4;
    const w = [6, 4, 2, 4][f];
    const ox = (8 - w) / 2;
    ctx.fillStyle = "#9a6b18"; ctx.fillRect(x + ox - 0.5, y + 1, w + 1, 7);
    ctx.fillStyle = "#f4d24a"; ctx.fillRect(x + ox, y + 1, w, 6);
    ctx.fillStyle = "#fff0b4"; ctx.fillRect(x + ox, y + 1, Math.max(1, w / 2), 2);
  }

  function drawShop(ctx, x, y) {
    // a little market stall (2x2 footprint anchored top-left at x,y)
    ctx.fillStyle = "#6b4a2c"; ctx.fillRect(x + 1, y + 14, 30, 16);     // counter base
    ctx.fillStyle = "#825a36"; ctx.fillRect(x + 1, y + 14, 30, 3);
    // posts
    ctx.fillStyle = "#4a3320"; ctx.fillRect(x + 1, y + 4, 2, 26); ctx.fillRect(x + 29, y + 4, 2, 26);
    // striped awning
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? "#d8504f" : "#f6e7c4";
      ctx.fillRect(x + 1 + i * 3.75, y + 2, 3.75, 7);
    }
    ctx.fillStyle = "#a83736"; ctx.fillRect(x + 1, y + 9, 30, 1);
    // scalloped hem
    for (let i = 0; i < 4; i++) { ctx.fillStyle = "#d8504f"; ctx.fillRect(x + 2 + i * 8, y + 10, 4, 2); }
    // a fish sign
    ctx.fillStyle = "#e8c34a"; ctx.fillRect(x + 12, y + 18, 8, 6);
    ctx.fillStyle = "#3b2f25"; ctx.fillRect(x + 13, y + 20, 2, 1); ctx.fillRect(x + 17, y + 20, 2, 1);
  }

  function drawGearChest(ctx, x, y, gid) {
    const f = Math.floor(G.frame / 22) % 2;
    ctx.fillStyle = "rgba(40,30,30,0.22)"; ctx.fillRect(x + 3, y + 14, 10, 2);
    ctx.fillStyle = "#2a1e15"; ctx.fillRect(x + 2, y + 5, 12, 3);
    ctx.fillStyle = "#5a4632"; ctx.fillRect(x + 3, y + 5, 10, 1);
    ctx.fillStyle = "#3a2a1e"; ctx.fillRect(x + 2, y + 8, 12, 6);
    ctx.fillStyle = "#503a28"; ctx.fillRect(x + 3, y + 9, 10, 4);
    ctx.fillStyle = "#b9892f"; ctx.fillRect(x + 2, y + 8, 12, 1);
    ctx.fillStyle = "#e8c34a"; ctx.fillRect(x + 7, y + 8, 2, 3);
    ctx.fillStyle = f ? "#fff0b4" : "#ffffff";
    ctx.fillRect(x + 11, y + 3 + (f ? 0 : 1), 1, 1); ctx.fillRect(x + 4, y + 2, 1, 1);
  }
  function drawCoinChest(ctx, x, y) {
    ctx.fillStyle = "rgba(40,30,30,0.22)"; ctx.fillRect(x + 3, y + 14, 10, 2);
    ctx.fillStyle = "#5a3a1e"; ctx.fillRect(x + 2, y + 6, 12, 8);
    ctx.fillStyle = "#7a4f28"; ctx.fillRect(x + 3, y + 7, 10, 3);
    ctx.fillStyle = "#3a2614"; ctx.fillRect(x + 2, y + 5, 12, 2);
    ctx.fillStyle = "#e8c34a"; ctx.fillRect(x + 7, y + 8, 2, 4);
    ctx.fillStyle = "#caa23a"; ctx.fillRect(x + 2, y + 10, 12, 1);
  }

  // player attack swipe arc
  function drawSwipe(ctx, p, sx, sy) {
    const prog = 1 - p.atkTimer / p.atkDur;      // 0..1
    const cx = sx + 8, cy = sy + 9;
    let base;
    if (p.dir === "up") base = -Math.PI / 2;
    else if (p.dir === "down") base = Math.PI / 2;
    else if (p.dir === "left") base = Math.PI;
    else base = 0;
    const spread = 1.5;
    const a0 = base - spread / 2, a1 = base + spread / 2;
    const a = a0 + (a1 - a0) * prog;
    const r = 13;
    ctx.save();
    ctx.globalAlpha = 0.85 * (1 - prog);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a - 0.5, a + 0.5);
    ctx.stroke();
    ctx.strokeStyle = "#bfeaff"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r + 2, a - 0.35, a + 0.35); ctx.stroke();
    ctx.restore();
  }

  function render(ctx) {
    const map = G.maps[G.cur];
    const cam = G.camera;
    ctx.fillStyle = (G.cur === "interior" || G.cur === "home") ? "#2a2331" : (G.cur === "manor") ? "#140f1d"
      : (G.cur === "forest") ? "#2c4d2a" : (G.cur === "shop") ? "#3a2a1c" : "#3a5a40";
    ctx.fillRect(0, 0, VPW, VPH);

    const x0 = Math.floor(cam.x / TS), y0 = Math.floor(cam.y / TS);
    const x1 = Math.ceil((cam.x + VPW) / TS), y1 = Math.ceil((cam.y + VPH) / TS);

    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
      const t = Tiles.TILES[map.ground[y][x]];
      if (t) ctx.drawImage(t.canvas, Math.round(x * TS - cam.x), Math.round(y * TS - cam.y));
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
      const oid = map.object[y][x]; if (!oid) continue;
      const t = Tiles.TILES[oid];
      if (t) ctx.drawImage(t.canvas, Math.round(x * TS - cam.x), Math.round(y * TS - cam.y));
    }

    // coin drops (under entities)
    for (const c of G.coinDrops) drawCoin(ctx, Math.round(c.px - cam.x), Math.round(c.py - cam.y), c.t || 0);

    // build y-sorted drawables
    const drawables = [];
    for (const e of (G.entities[G.cur] || [])) {
      if (e.gone) continue;
      if (e.type === "monster" && !e.alive) continue;
      if ((e.type === "item" || e.type === "gear" || e.type === "chest") && e.taken) continue;
      if (e.type === "sign" || e.type === "clue" || e.type === "furniture") continue;
      drawables.push(e);
    }
    drawables.push(G.player);
    drawables.sort((a, b) => (a === G.player ? a.py : a.py) - (b === G.player ? b.py : b.py));

    for (const d of drawables) {
      // cutscene animation offsets: a little hop, or a rattle (cages)
      const hop = d.hop > 0 ? Math.round(Math.sin(d.hop / 14 * Math.PI) * 4) : 0;
      const shake = d.shake > 0 ? (Math.floor(G.frame / 2) % 2 ? 1 : -1) : 0;
      const sx = Math.round(d.px - cam.x) + shake, sy = Math.round(d.py - cam.y) - hop;
      if (d === G.player) { drawPlayer(ctx, d, sx, sy); continue; }
      if (d.type === "monster") {
        const flash = d.hurtFlash > 0;
        if (d.vesper) Sprites2.drawVesper(ctx, sx, sy + 1, 1, { t: G.frame, flash });
        else {
          Sprites.drawCat(ctx, World.MONSTERS[d.mon].kind, d.dir, sx, sy, { bob: walkBob(d, d.moving), flash });
          if (d.boss) { ctx.fillStyle = "#ecc73b"; ctx.fillRect(sx + 6, sy + 1, 4, 1); ctx.fillRect(sx + 7, sy, 2, 1); }
        }
        drawEnemyHp(ctx, d, sx, sy);
      } else if (d.type === "item") {
        ctx.drawImage(Combat.propCanvas("ribbon"), sx, sy);
      } else if (d.type === "gear") {
        drawGearChest(ctx, sx, sy, d.gid);
      } else if (d.type === "chest") {
        drawCoinChest(ctx, sx, sy);
      } else if (d.type === "shop") {
        drawShop(ctx, sx - 8, sy - 14);
      } else if (d.type === "actor") {
        // scripted-only characters (Vesper appearing in the forest)
        ctx.save(); ctx.globalAlpha = d.alpha == null ? 1 : d.alpha;
        if (d.kind === "vesper") Sprites2.drawVesper(ctx, sx, sy + 1, 1, { t: G.frame });
        else Sprites.drawCat(ctx, d.kind, d.dir, sx, sy, {});
        ctx.restore();
      } else if (d.type === "captive") {
        Sprites.drawCat(ctx, d.kind, d.dir, sx, sy, { bob: walkBob(d, false) });
        if (d.caged) Sprites.drawCage(ctx, sx, sy, 1);
      } else if (d.type === "npc") {
        Sprites.drawCat(ctx, d.kind, d.dir, sx, sy, { bob: walkBob(d, d.scripted) });
      }
    }

    // combat FX (slashes / shockwaves / floating text)
    Combat.renderFX(ctx, cam);

    // interaction hint
    if (G.state === "play") {
      const t = (window.__interactHint && window.__interactHint());
      if (t) {
        const bx = Math.round(t.px + 8 - cam.x) - 1, by = Math.round(t.py - cam.y - 4) + (Math.floor(G.frame / 20) % 2 ? -1 : 0);
        ctx.fillStyle = "#fff7df"; ctx.fillRect(bx, by, 3, 3); ctx.fillRect(bx, by + 4, 3, 2);
        ctx.fillStyle = "#3b3340"; ctx.fillRect(bx + 1, by + 1, 1, 1);
      }
    }

    if (map.dark) {
      const p = G.player, f = G.camFocus;
      const lx = f ? Math.round(f.x - cam.x) : Math.round(p.px - cam.x) + 8;
      const ly = f ? Math.round(f.y - cam.y) : Math.round(p.py - cam.y) + 8;
      // G.dim (0..1) closes the light in; torches flicker while it's set
      const dim = (G.dim || 0) * (0.9 + 0.1 * Math.sin(G.frame * 0.7));
      const rad = ctx.createRadialGradient(lx, ly, 18 - dim * 10, lx, ly, 96 - dim * 50);
      rad.addColorStop(0, "rgba(8,6,12,0)");
      rad.addColorStop(0.6, "rgba(8,6,12,0.32)");
      rad.addColorStop(1, "rgba(5,4,9,0.85)");
      ctx.fillStyle = rad; ctx.fillRect(0, 0, VPW, VPH);
    }
  }

  function drawPlayer(ctx, p, sx, sy) {
    if (p.iframes > 0 && Math.floor(G.frame / 3) % 2 && !p.spin) return;  // blink while invulnerable
    if (p.spin > 0) {
      // 180 DOOR SLAM — spin the sprite
      const prog = 1 - p.spin / p.spinDur;
      const turns = 2;                       // full spins for flair
      const ang = prog * Math.PI * 2 * turns;
      ctx.save();
      ctx.translate(sx + 8, sy + 8);
      ctx.rotate(ang);
      // motion blur ring
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#bfeaff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 1.6); ctx.stroke();
      ctx.globalAlpha = 1;
      Sprites.drawCat(ctx, "goku", "side", -8, -8, { scale: 1 });
      ctx.restore();
      // shockwave
      const r = 8 + prog * 18;
      ctx.save(); ctx.globalAlpha = 0.6 * (1 - prog);
      ctx.strokeStyle = "#ffe08a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx + 8, sy + 9, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      return;
    }
    Sprites.drawCat(ctx, "goku", p.dir, sx, sy, { bob: walkBob(p, p.moving), flash: p.hurtFlash > 0 });
    if (p.atkTimer > 0) drawSwipe(ctx, p, sx, sy);
  }

  function drawEnemyHp(ctx, e, sx, sy) {
    if (e.hp >= e.maxHp || e.hp <= 0) return;
    const w = e.big ? 18 : 12, x = sx + (16 - w) / 2, y = sy - 3;
    ctx.fillStyle = "#1a1320"; ctx.fillRect(x - 1, y - 1, w + 2, 3);
    const pct = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = e.boss ? "#d65a9a" : "#d65a5a"; ctx.fillRect(x, y, Math.round(w * pct), 1.5);
  }

  window.Engine.render = render;
})();
