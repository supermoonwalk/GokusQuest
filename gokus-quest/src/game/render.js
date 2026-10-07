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

  // stall colours per shop: awning stripe, hem, and the emblem on the counter
  const STALLS = {
    whiskers:  { a: "#d8504f", b: "#f6e7c4", hem: "#a83736" },
    smith:     { a: "#5a5f6e", b: "#e08a3a", hem: "#3e424d" },
    carpenter: { a: "#5fa85f", b: "#f6e7c4", hem: "#3f7a3f" },
    dojo:      { a: "#3aa0a8", b: "#f4eee6", hem: "#2a6e74" },
    baker:     { a: "#e0b54a", b: "#fbf2da", hem: "#a8802a" },
  };
  function drawShop(ctx, x, y, style) {
    const c = STALLS[style] || STALLS.whiskers;
    // a little market stall (2x2 footprint anchored top-left at x,y)
    ctx.fillStyle = "#6b4a2c"; ctx.fillRect(x + 1, y + 14, 30, 16);     // counter base
    ctx.fillStyle = "#825a36"; ctx.fillRect(x + 1, y + 14, 30, 3);
    // posts
    ctx.fillStyle = "#4a3320"; ctx.fillRect(x + 1, y + 4, 2, 26); ctx.fillRect(x + 29, y + 4, 2, 26);
    // striped awning
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? c.a : c.b;
      ctx.fillRect(x + 1 + i * 3.75, y + 2, 3.75, 7);
    }
    ctx.fillStyle = c.hem; ctx.fillRect(x + 1, y + 9, 30, 1);
    // scalloped hem
    for (let i = 0; i < 4; i++) { ctx.fillStyle = c.a; ctx.fillRect(x + 2 + i * 8, y + 10, 4, 2); }
    if (style === "smith") {                 // an anvil
      ctx.fillStyle = "#3e424d"; ctx.fillRect(x + 11, y + 18, 10, 3); ctx.fillRect(x + 14, y + 21, 4, 3);
      ctx.fillStyle = "#8a8f9c"; ctx.fillRect(x + 11, y + 18, 10, 1);
    } else if (style === "baker") {          // a loaf of bread
      ctx.fillStyle = "#c98a3a"; ctx.fillRect(x + 11, y + 18, 10, 5);
      ctx.fillStyle = "#e8b060"; ctx.fillRect(x + 12, y + 18, 8, 2);
      ctx.fillStyle = "#8a5a24"; ctx.fillRect(x + 13, y + 19, 1, 3); ctx.fillRect(x + 16, y + 19, 1, 3);
    } else if (style === "dojo") {           // a rolled scroll
      ctx.fillStyle = "#f4eee6"; ctx.fillRect(x + 11, y + 18, 10, 5);
      ctx.fillStyle = "#c96d6d"; ctx.fillRect(x + 10, y + 18, 2, 5); ctx.fillRect(x + 20, y + 18, 2, 5);
    } else if (style === "carpenter") {      // a hammer
      ctx.fillStyle = "#c9a46a"; ctx.fillRect(x + 15, y + 18, 2, 7);
      ctx.fillStyle = "#5a5f6e"; ctx.fillRect(x + 12, y + 17, 8, 3);
    } else {                                  // a fish sign
      ctx.fillStyle = "#e8c34a"; ctx.fillRect(x + 12, y + 18, 8, 6);
      ctx.fillStyle = "#3b2f25"; ctx.fillRect(x + 13, y + 20, 2, 1); ctx.fillRect(x + 17, y + 20, 2, 1);
    }
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
    ctx.fillStyle = (G.cur === "interior" || G.cur === "home") ? "#2a2331" : (G.cur === "manor" || G.cur === "grounds") ? "#140f1d"
      : (G.cur === "forest" || G.cur === "hollow") ? "#2c4d2a" : (G.cur === "shop") ? "#3a2a1c" : "#3a5a40";
    ctx.fillRect(0, 0, VPW, VPH);

    const x0 = Math.floor(cam.x / TS), y0 = Math.floor(cam.y / TS);
    const x1 = Math.ceil((cam.x + VPW) / TS), y1 = Math.ceil((cam.y + VPH) / TS);

    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
      const gid = map.ground[y][x];
      const t = Tiles.TILES[gid === "tideflat" && G.tideHigh ? "water" : gid];
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
      if (e.type === "sign" || e.type === "clue" || e.type === "furniture" || e.type === "obstacle") continue;
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
          if (d.huge) Sprites.drawCat(ctx, World.MONSTERS[d.mon].kind, d.dir, sx - 8, sy - 16, { bob: walkBob(d, d.moving), flash, scale: 2 });
          else Sprites.drawCat(ctx, World.MONSTERS[d.mon].kind, d.dir, sx, sy, { bob: walkBob(d, d.moving), flash });
          if (d.boss && !d.huge) { ctx.fillStyle = "#ecc73b"; ctx.fillRect(sx + 6, sy + 1, 4, 1); ctx.fillRect(sx + 7, sy, 2, 1); }
        }
        drawEnemyHp(ctx, d, sx, sy);
      } else if (d.type === "item") {
        ctx.drawImage(Combat.propCanvas("ribbon"), sx, sy);
      } else if (d.type === "gear") {
        drawGearChest(ctx, sx, sy, d.gid);
      } else if (d.type === "chest") {
        drawCoinChest(ctx, sx, sy);
      } else if (d.type === "shop") {
        // the rescued villager minds their own stall, behind the counter
        if (d.owner) Sprites.drawCat(ctx, World.VILLAGERS[d.owner].kind, "down", sx, sy - 13, { bob: walkBob(d, false) });
        drawShop(ctx, sx - 8, sy - 14, d.style);
      } else if (d.type === "switch" && d.look === "bell") {
        // a brass bell on a beam; size by pitch (1 small .. 3 big); swings when rung
        const r = 2 + d.pitch, sw = d.lit ? Math.round(Math.sin(G.frame / 3)) : 0, h = r * 2 + 2;
        ctx.fillStyle = "#5f3f24"; ctx.fillRect(sx + 2, sy + 1, 12, 2);
        ctx.fillStyle = d.lit ? "#ffe08a" : "#c9a23a";
        // bell shape: narrow crown flaring out to a wide rim
        for (let i = 0; i < h; i++) {
          const half = Math.round(r * 0.5 + (r * 0.5) * (i / (h - 1)) * (i / (h - 1)) + (i === h - 1 ? 1 : 0));
          ctx.fillRect(sx + 8 - half + sw, sy + 3 + i, half * 2, 1);
        }
        ctx.fillStyle = "#8a6a24"; ctx.fillRect(sx + 7 + sw, sy + 3 + h, 2, 2);          // clapper
      } else if (d.type === "switch" && d.look === "shell") {
        // a big scallop shell; glows while it's "open" (timed)
        const on = d.lit > 0 && !(d.lit < 60 && Math.floor(G.frame / 4) % 2);
        ctx.fillStyle = on ? "#ffd0e0" : "#d8b0b8"; ctx.fillRect(sx + 3, sy + 5, 10, 8);
        ctx.fillStyle = on ? "#fff0f6" : "#e8c8d0"; for (let i = 0; i < 5; i++) ctx.fillRect(sx + 4 + i * 2, sy + 5, 1, 7);
        ctx.fillStyle = "#a07880"; ctx.fillRect(sx + 6, sy + 13, 4, 2);
        if (on) { ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = "#ffd0e0"; ctx.beginPath(); ctx.arc(sx + 8, sy + 9, 11, 0, 6.28); ctx.fill(); ctx.restore(); }
      } else if (d.type === "switch" && d.look === "rune") {
        // a standing stone with a sun glyph; glows teal once struck in the right order
        ctx.fillStyle = "#5a5f6e"; ctx.fillRect(sx + 3, sy + 1, 10, 14);
        ctx.fillStyle = "#7a8090"; ctx.fillRect(sx + 4, sy + 2, 8, 12);
        ctx.fillStyle = d.lit ? "#7ff0e8" : "#3e424d";
        ctx.fillRect(sx + 7, sy + 5, 2, 6); ctx.fillRect(sx + 5, sy + 7, 6, 2);
        if (d.lit) { ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = "#7ff0e8"; ctx.beginPath(); ctx.arc(sx + 8, sy + 8, 12, 0, 6.28); ctx.fill(); ctx.restore(); }
      } else if (d.type === "switch") {
        // an old lantern on a post; glows (and flickers) while lit
        ctx.fillStyle = "#4a3320"; ctx.fillRect(sx + 7, sy + 6, 2, 10);
        ctx.fillStyle = "#3b3340"; ctx.fillRect(sx + 4, sy, 8, 8);
        const on = d.lit > 0, f = on && d.lit < 60 && Math.floor(G.frame / 4) % 2;   // sputters before going out
        ctx.fillStyle = on && !f ? "#ffd36a" : "#2a2331"; ctx.fillRect(sx + 5, sy + 1, 6, 6);
        if (on && !f) {
          ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = "#ffd36a";
          ctx.beginPath(); ctx.arc(sx + 8, sy + 4, 14, 0, 6.28); ctx.fill(); ctx.restore();
        }
      } else if (d.type === "actor") {
        // scripted-only characters (Vesper appearing in the forest)
        ctx.save(); ctx.globalAlpha = d.alpha == null ? 1 : d.alpha;
        if (d.kind === "vesper") Sprites2.drawVesper(ctx, sx, sy + 1, 1, { t: G.frame });
        else if (d.scale === 2) Sprites.drawCat(ctx, d.kind, d.dir, sx - 8, sy - 16, { scale: 2 });
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

    // tide gauge on tidal maps: LOW/HIGH with time left
    if (map.tidal && G.state !== "title") {
      const ti = Engine.tideInfo(), w = 52, frac = ti.left / 450;
      const x = (VPW - w) / 2, y = 4;
      ctx.fillStyle = "rgba(20,30,40,0.7)"; ctx.fillRect(x - 2, y - 2, w + 4, 13);
      ctx.fillStyle = ti.high ? "#5ab0c8" : "#d8c48a"; ctx.fillRect(x, y + 8, Math.round(w * frac), 2);
      ctx.font = "6px 'Press Start 2P', monospace"; ctx.fillStyle = "#fff7df";
      ctx.fillText(ti.high ? "HIGH TIDE" : "LOW TIDE", x + 2, y + 6);
    }

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
      // lit lanterns shine through the dark
      for (const e of (G.entities[G.cur] || [])) {
        if (e.type !== "switch" || !(e.lit > 0) || (e.lit < 60 && Math.floor(G.frame / 4) % 2)) continue;
        const gx = Math.round(e.px - cam.x) + 8, gy = Math.round(e.py - cam.y) + 4;
        const glow = ctx.createRadialGradient(gx, gy, 2, gx, gy, 34);
        glow.addColorStop(0, "rgba(255,211,106,0.55)"); glow.addColorStop(1, "rgba(255,211,106,0)");
        ctx.fillStyle = glow; ctx.fillRect(gx - 34, gy - 34, 68, 68);
      }
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
    const w = e.huge ? 26 : e.big ? 18 : 12, x = sx + (16 - w) / 2, y = e.huge ? sy - 19 : sy - 3;
    ctx.fillStyle = "#1a1320"; ctx.fillRect(x - 1, y - 1, w + 2, 3);
    const pct = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = e.boss ? "#d65a9a" : "#d65a5a"; ctx.fillRect(x, y, Math.round(w * pct), 1.5);
  }

  window.Engine.render = render;
})();
