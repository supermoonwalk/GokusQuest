/* ============================================================
   tiles2.js  —  CHAPTER II manor / dungeon tiles (night palette).
   Adds onto the shared Tiles.TILES registry from tiles.js.
   ============================================================ */
(function () {
  const TS = 16;
  const TILES = window.Tiles.TILES;

  function make(solid) {
    const c = document.createElement("canvas");
    c.width = TS; c.height = TS;
    const ctx = c.getContext("2d");
    return { c, ctx, solid: !!solid };
  }
  function px(ctx, color, x, y, w, h) { ctx.fillStyle = color; ctx.fillRect(x, y, w || 1, h || 1); }
  function paint(ctx, rows, pal) {
    for (let y = 0; y < rows.length; y++)
      for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === "." || ch === " ") continue;
        if (pal[ch]) px(ctx, pal[ch], x, y);
      }
  }
  function reg(id, solid, drawFn) {
    const t = make(solid); drawFn(t.ctx);
    TILES[id] = { canvas: t.c, solid: t.solid };
  }
  function rnd(x, y, s) { const v = Math.sin((x * 12.9898 + y * 78.233 + s * 3.77)) * 43758.5453; return v - Math.floor(v); }

  /* ---------------- FLOORS ---------------- */
  reg("dstone", false, (ctx) => {
    px(ctx, "#2b2536", 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const r = rnd(x, y, 11);
      if (r > 0.92) px(ctx, "#352d44", x, y);
      else if (r < 0.07) px(ctx, "#221c2e", x, y);
    }
    // flagstone seams
    px(ctx, "#1c1727", 0, 0, 16, 1); px(ctx, "#1c1727", 0, 8, 16, 1);
    px(ctx, "#1c1727", 0, 0, 1, 16); px(ctx, "#1c1727", 8, 8, 1, 8);
    px(ctx, "#34304a", 1, 1, 6, 1); px(ctx, "#34304a", 9, 9, 6, 1);
  });
  reg("dstone2", false, (ctx) => {
    px(ctx, "#2b2536", 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const r = rnd(x, y, 17);
      if (r > 0.93) px(ctx, "#322a40", x, y);
      else if (r < 0.06) px(ctx, "#20192c", x, y);
    }
    px(ctx, "#1c1727", 0, 4, 16, 1); px(ctx, "#1c1727", 0, 12, 16, 1);
    px(ctx, "#1c1727", 4, 0, 1, 16);
    // crack
    px(ctx, "#16121f", 9, 2); px(ctx, "#16121f", 10, 3); px(ctx, "#16121f", 10, 4); px(ctx, "#16121f", 11, 5);
  });
  // regal carpet runner (down the spine of the manor)
  reg("dcarpet", false, (ctx) => {
    px(ctx, "#6e2546", 0, 0, 16, 16);
    px(ctx, "#5a1d39", 0, 0, 16, 1); px(ctx, "#5a1d39", 0, 15, 16, 1);
    px(ctx, "#8a3258", 2, 2, 12, 12);
    px(ctx, "#6e2546", 4, 4, 8, 8);
    // gold trim edges
    px(ctx, "#b9892f", 0, 0, 1, 16); px(ctx, "#b9892f", 15, 0, 1, 16);
    px(ctx, "#e8c34a", 0, 0, 1, 4); px(ctx, "#e8c34a", 15, 6, 1, 4);
    // diamond motif
    px(ctx, "#c79a3a", 8, 4); px(ctx, "#c79a3a", 7, 5, 3, 1); px(ctx, "#c79a3a", 6, 6, 5, 1);
    px(ctx, "#c79a3a", 7, 7, 3, 1); px(ctx, "#c79a3a", 8, 8);
    px(ctx, "#e8c34a", 8, 6);
  });

  /* ---------------- WALLS ---------------- */
  reg("dwall", true, (ctx) => {
    px(ctx, "#1c1826", 0, 0, 16, 16);
    // brick courses
    const brick = "#2a2335", mortar = "#120f1b", hi = "#352c45";
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      const off = row % 2 ? 4 : 0;
      px(ctx, mortar, 0, y + 3, 16, 1);
      for (let bx = -off; bx < 16; bx += 8) {
        px(ctx, brick, bx + 1, y, 6, 3);
        px(ctx, hi, bx + 1, y, 6, 1);
        px(ctx, mortar, bx + 7, y, 1, 3);
      }
    }
  });
  reg("dwallTop", true, (ctx) => {
    px(ctx, "#1c1826", 0, 0, 16, 16);
    px(ctx, "#3a3050", 0, 0, 16, 3);     // lit crown of the wall
    px(ctx, "#4a3d63", 0, 0, 16, 1);
    const brick = "#2a2335", mortar = "#120f1b", hi = "#352c45";
    for (let row = 1; row < 4; row++) {
      const y = row * 4;
      const off = row % 2 ? 4 : 0;
      px(ctx, mortar, 0, y + 3, 16, 1);
      for (let bx = -off; bx < 16; bx += 8) {
        px(ctx, brick, bx + 1, y, 6, 3); px(ctx, hi, bx + 1, y, 6, 1);
        px(ctx, mortar, bx + 7, y, 1, 3);
      }
    }
  });
  reg("pillar", true, (ctx) => {
    px(ctx, "#0f0c17", 0, 0, 16, 16);
    px(ctx, "#3a3450", 4, 0, 8, 16);     // column shaft
    px(ctx, "#4c456a", 5, 0, 2, 16);     // highlight
    px(ctx, "#221d33", 9, 0, 2, 16);     // shade
    // capital + base
    px(ctx, "#54496e", 2, 0, 12, 2); px(ctx, "#2a2440", 2, 2, 12, 1);
    px(ctx, "#54496e", 2, 13, 12, 3); px(ctx, "#2a2440", 2, 13, 12, 1);
    px(ctx, "#1a1626", 3, 6, 10, 1); px(ctx, "#1a1626", 3, 10, 10, 1);
  });

  /* ---------------- LIGHT & DECOR ---------------- */
  reg("torch", true, (ctx) => {
    // mounted on/against a wall — keep wall feel behind
    px(ctx, "#1c1826", 0, 0, 16, 16);
    const brick = "#2a2335";
    px(ctx, brick, 1, 1, 6, 3); px(ctx, brick, 9, 1, 6, 3);
    px(ctx, brick, 1, 9, 6, 3); px(ctx, brick, 9, 9, 6, 3);
    px(ctx, "#120f1b", 0, 7, 16, 1);
    // glow halo
    const g = ctx.createRadialGradient(8, 8, 1, 8, 8, 9);
    g.addColorStop(0, "rgba(255,180,70,0.55)"); g.addColorStop(1, "rgba(255,180,70,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 16);
    // bracket
    px(ctx, "#4a3a2a", 7, 9, 2, 5); px(ctx, "#5a4632", 7, 9, 1, 5);
    px(ctx, "#2c2018", 6, 13, 4, 1);
    // flame
    px(ctx, "#d24a2a", 6, 5, 4, 4);
    px(ctx, "#f0892a", 6, 4, 3, 4);
    px(ctx, "#ffd24a", 7, 3, 2, 4);
    px(ctx, "#fff0b4", 7, 4, 1, 2);
  });
  reg("brazier", true, (ctx) => {
    px(ctx, "#2b2536", 0, 0, 16, 16);
    const g = ctx.createRadialGradient(8, 7, 1, 8, 7, 10);
    g.addColorStop(0, "rgba(255,170,60,0.5)"); g.addColorStop(1, "rgba(255,170,60,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 16);
    px(ctx, "#3a3450", 4, 9, 8, 2);       // bowl
    px(ctx, "#54496e", 4, 9, 8, 1);
    px(ctx, "#241f33", 6, 11, 4, 4);      // stem
    px(ctx, "#3a3450", 3, 14, 10, 2);     // foot
    px(ctx, "#d24a2a", 5, 5, 6, 4);
    px(ctx, "#f0892a", 6, 4, 4, 4);
    px(ctx, "#ffd24a", 7, 3, 2, 4);
    px(ctx, "#fff0b4", 7, 4, 1, 2);
  });
  reg("banner", true, (ctx) => {
    px(ctx, "#1c1826", 0, 0, 16, 16);
    px(ctx, "#4a1730", 3, 0, 10, 14);     // cloth
    px(ctx, "#5e1f3e", 4, 0, 8, 13);
    px(ctx, "#3a1226", 4, 0, 1, 13);
    // forked hem
    px(ctx, "#1c1826", 3, 13, 2, 3); px(ctx, "#1c1826", 7, 14, 2, 2); px(ctx, "#1c1826", 11, 13, 2, 3);
    px(ctx, "#b9892f", 3, 0, 10, 1);      // gold rod
    // crest: a crowned paw
    px(ctx, "#e8c34a", 7, 3, 2, 1); px(ctx, "#e8c34a", 6, 4); px(ctx, "#e8c34a", 9, 4);
    px(ctx, "#cdbcd9", 6, 6, 4, 3);       // paw pad
    px(ctx, "#cdbcd9", 6, 5); px(ctx, "#cdbcd9", 9, 5);
  });
  reg("web", false, (ctx) => {
    const w = "#5a5468";
    px(ctx, w, 0, 0, 6, 1); px(ctx, w, 0, 0, 1, 6);
    px(ctx, w, 0, 0); px(ctx, w, 1, 1); px(ctx, w, 2, 2); px(ctx, w, 3, 3); px(ctx, w, 4, 4); px(ctx, w, 5, 5);
    px(ctx, w, 4, 0); px(ctx, w, 0, 4); px(ctx, w, 6, 2); px(ctx, w, 2, 6);
    px(ctx, "#777088", 2, 0); px(ctx, "#777088", 0, 2);
  });
  reg("rubble", false, (ctx) => {
    px(ctx, "#2b2536", 0, 0, 16, 16);
    const s = "#3a3450", d = "#1d1830";
    px(ctx, s, 3, 10, 3, 2); px(ctx, d, 3, 11, 3, 1);
    px(ctx, s, 8, 12, 4, 2); px(ctx, d, 8, 13, 4, 1);
    px(ctx, s, 11, 9, 2, 2); px(ctx, s, 6, 13, 2, 1);
    // a stray bone
    px(ctx, "#cabf9e", 5, 7, 4, 1); px(ctx, "#cabf9e", 5, 6); px(ctx, "#cabf9e", 8, 6);
    px(ctx, "#cabf9e", 5, 8); px(ctx, "#cabf9e", 8, 8);
  });

  /* ---------------- THRONE (2 tiles wide) ---------------- */
  reg("throneL", true, (ctx) => {
    px(ctx, "#2b2536", 0, 0, 16, 16);
    px(ctx, "#3a1226", 6, 1, 10, 14);     // back
    px(ctx, "#5e1f3e", 8, 2, 8, 11);
    px(ctx, "#b9892f", 6, 1, 2, 14);      // gold edge
    px(ctx, "#e8c34a", 6, 1, 1, 14);
    px(ctx, "#241f33", 10, 11, 6, 5);     // seat
    px(ctx, "#3a3450", 10, 11, 6, 1);
    px(ctx, "#b9892f", 6, 0, 4, 1);
  });
  reg("throneR", true, (ctx) => {
    px(ctx, "#2b2536", 0, 0, 16, 16);
    px(ctx, "#3a1226", 0, 1, 10, 14);
    px(ctx, "#5e1f3e", 0, 2, 8, 11);
    px(ctx, "#b9892f", 8, 1, 2, 14);
    px(ctx, "#e8c34a", 9, 1, 1, 14);
    px(ctx, "#241f33", 0, 11, 6, 5);
    px(ctx, "#3a3450", 0, 11, 6, 1);
    // crown finial
    px(ctx, "#e8c34a", 6, 0, 4, 1); px(ctx, "#e8c34a", 5, -0 + 0, 0, 0);
    px(ctx, "#e8c34a", 4, 0); px(ctx, "#e8c34a", 7, 0); px(ctx, "#e8c34a", 10, 0);
  });

  /* ---------------- DOORS / GATES ---------------- */
  // big manor gate that appears on the overworld (warp INTO the manor)
  reg("dgate", false, (ctx) => {
    px(ctx, "#7fb069", 0, 0, 16, 16);             // sits on grass
    px(ctx, "#1a1320", 2, 0, 12, 16);             // dark archway
    px(ctx, "#0c0a12", 4, 2, 8, 14);
    // iron arch
    px(ctx, "#3a3450", 2, 0, 12, 2); px(ctx, "#54496e", 2, 0, 12, 1);
    px(ctx, "#3a3450", 2, 0, 2, 16); px(ctx, "#3a3450", 12, 0, 2, 16);
    // glowing eyes within the dark
    px(ctx, "#8fe04a", 6, 7); px(ctx, "#8fe04a", 9, 7);
    px(ctx, "#b9892f", 7, 13, 2, 1);              // gate ring
  });
  // heavy interior door (decorative / flavour for the 180 Door Slam)
  reg("ddoor", true, (ctx) => {
    px(ctx, "#1c1826", 0, 0, 16, 16);
    px(ctx, "#3a2a1e", 2, 1, 12, 14);             // wood
    px(ctx, "#503a28", 3, 2, 10, 12);
    px(ctx, "#2a1e15", 8, 2, 1, 12);              // plank seam
    px(ctx, "#2a1e15", 5, 2, 1, 12); px(ctx, "#2a1e15", 11, 2, 1, 12);
    // iron bands + ring
    px(ctx, "#1a1626", 3, 4, 10, 1); px(ctx, "#1a1626", 3, 10, 10, 1);
    px(ctx, "#54496e", 3, 4, 10, 1);
    px(ctx, "#b9892f", 10, 7, 2, 2); px(ctx, "#e8c34a", 10, 7, 1, 1);
  });
  // stairs / threshold back out of the manor
  reg("dexit", false, (ctx) => {
    px(ctx, "#2b2536", 0, 0, 16, 16);
    px(ctx, "#3a3450", 1, 2, 14, 3); px(ctx, "#241f33", 1, 4, 14, 1);
    px(ctx, "#46406090", 1, 6, 14, 3); px(ctx, "#241f33", 1, 8, 14, 1);
    px(ctx, "#3a3450", 1, 10, 14, 3); px(ctx, "#241f33", 1, 12, 14, 1);
    // up-arrow hint
    px(ctx, "#e8c34a", 8, 2); px(ctx, "#e8c34a", 7, 3, 3, 1); px(ctx, "#e8c34a", 6, 4, 5, 1);
  });

  // a single empty cell frame (so freed cages still read as cells)
  reg("cellframe", false, (ctx) => {
    const bar = "#6a6270", hi = "#938a9b";
    for (let bx = 1; bx <= 13; bx += 4) {
      px(ctx, bar, bx, 1, 1, 14); px(ctx, hi, bx, 1, 1, 2);
    }
    px(ctx, bar, 1, 1, 14, 1); px(ctx, bar, 1, 14, 14, 1);
  });

  window.Tiles2 = { ready: true };
})();
