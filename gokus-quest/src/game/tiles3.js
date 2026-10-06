/* ============================================================
   tiles3.js  —  FOREST tiles (dusky woodland) + SHOP interior
   tiles. Adds onto the shared Tiles.TILES registry.
   ============================================================ */
(function () {
  const TS = 16;
  const TILES = window.Tiles.TILES;

  function make(solid) {
    const c = document.createElement("canvas");
    c.width = TS; c.height = TS;
    return { c, ctx: c.getContext("2d"), solid: !!solid };
  }
  function px(ctx, color, x, y, w, h) { ctx.fillStyle = color; ctx.fillRect(x, y, w || 1, h || 1); }
  function reg(id, solid, drawFn) { const t = make(solid); drawFn(t.ctx); TILES[id] = { canvas: t.c, solid: t.solid }; }
  function rnd(x, y, s) { const v = Math.sin((x * 12.9898 + y * 78.233 + s * 3.77)) * 43758.5453; return v - Math.floor(v); }

  /* ================= FOREST ================= */
  reg("fgrass", false, (ctx) => {
    px(ctx, "#3f6b39", 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const r = rnd(x, y, 21);
      if (r > 0.9) px(ctx, "#4c7d42", x, y);
      else if (r < 0.08) px(ctx, "#355f30", x, y);
    }
    // blades
    px(ctx, "#588a4a", 3, 10); px(ctx, "#588a4a", 3, 9);
    px(ctx, "#588a4a", 11, 5); px(ctx, "#588a4a", 11, 4);
  });
  reg("fgrass2", false, (ctx) => {
    px(ctx, "#3a6535", 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const r = rnd(x, y, 33);
      if (r > 0.92) px(ctx, "#4c7d42", x, y);
      else if (r < 0.1) px(ctx, "#30562b", x, y);
    }
    // little mushroom
    px(ctx, "#b9533f", 7, 9, 3, 1); px(ctx, "#cf6a55", 7, 8, 3, 1); px(ctx, "#f0e6d0", 8, 10, 1, 2);
  });
  reg("fdirt", false, (ctx) => {
    px(ctx, "#6b4f2c", 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const r = rnd(x, y, 41);
      if (r > 0.9) px(ctx, "#7a5c36", x, y);
      else if (r < 0.12) px(ctx, "#5a4124", x, y);
    }
    px(ctx, "#4f3a20", 2, 5, 3, 1); px(ctx, "#4f3a20", 10, 11, 3, 1);
  });
  // tall pine tree (solid)
  reg("ftree", true, (ctx) => {
    px(ctx, "#3f6b39", 0, 0, 16, 16);
    px(ctx, "#4a3320", 7, 12, 3, 4);            // trunk
    px(ctx, "#5a3f28", 7, 12, 1, 4);
    // layered canopy
    px(ctx, "#1f3d1f", 3, 8, 10, 5);
    px(ctx, "#27502a", 4, 8, 8, 4);
    px(ctx, "#1f3d1f", 4, 4, 8, 5);
    px(ctx, "#2c5a30", 5, 4, 6, 4);
    px(ctx, "#1f3d1f", 6, 1, 4, 4);
    px(ctx, "#356a38", 6, 2, 3, 2);
    px(ctx, "#173016", 3, 12, 10, 1);
  });
  reg("fbush", true, (ctx) => {
    px(ctx, "#3f6b39", 0, 0, 16, 16);
    px(ctx, "#1f3d1f", 2, 6, 12, 8);
    px(ctx, "#2c5a30", 3, 6, 10, 6);
    px(ctx, "#356a38", 4, 6, 6, 3);
    px(ctx, "#173016", 2, 13, 12, 1);
    // berries
    px(ctx, "#c0432f", 5, 9); px(ctx, "#c0432f", 9, 11); px(ctx, "#c0432f", 11, 8);
  });
  reg("stump", true, (ctx) => {
    px(ctx, "#3f6b39", 0, 0, 16, 16);
    px(ctx, "#5a3f28", 4, 8, 8, 6);
    px(ctx, "#6e4f33", 4, 8, 8, 2);
    px(ctx, "#7d5b3c", 5, 8, 6, 1);
    // rings
    px(ctx, "#4a3320", 7, 9, 2, 1); px(ctx, "#8a6743", 6, 9, 1, 1);
    px(ctx, "#3a2716", 4, 13, 8, 1);
  });
  reg("fflower", false, (ctx) => {
    px(ctx, "#3f6b39", 0, 0, 16, 16);
    px(ctx, "#e8d24a", 7, 8); px(ctx, "#f6e89a", 6, 7); px(ctx, "#f6e89a", 8, 7);
    px(ctx, "#f6e89a", 6, 9); px(ctx, "#f6e89a", 8, 9); px(ctx, "#caa23a", 7, 7, 1, 3);
    px(ctx, "#4c7d42", 7, 10, 1, 3);
  });
  // a fallen log that gates the forest entrance (solid until quest opens it)
  reg("flog", true, (ctx) => {
    px(ctx, "#3f6b39", 0, 0, 16, 16);
    px(ctx, "#5a3f28", 0, 4, 16, 9);
    px(ctx, "#6e4f33", 0, 4, 16, 2);
    px(ctx, "#7d5b3c", 0, 5, 16, 1);
    px(ctx, "#3a2716", 0, 11, 16, 2);
    // bark lines + rings on the ends
    px(ctx, "#4a3320", 0, 8, 16, 1);
    px(ctx, "#3a2716", 1, 5, 4, 7); px(ctx, "#6e4f33", 2, 7, 2, 3); px(ctx, "#8a6743", 2, 8, 1, 1);
    px(ctx, "#3a2716", 11, 5, 4, 7); px(ctx, "#6e4f33", 12, 7, 2, 3); px(ctx, "#8a6743", 12, 8, 1, 1);
  });
  // forest archway entrance on the town's edge (walkable warp)
  reg("farch", false, (ctx) => {
    px(ctx, "#7fb069", 0, 0, 16, 16);          // sits in town grass
    px(ctx, "#6b4f2c", 1, 0, 3, 16); px(ctx, "#6b4f2c", 12, 0, 3, 16);  // posts
    px(ctx, "#5a4124", 1, 0, 1, 16); px(ctx, "#5a4124", 12, 0, 1, 16);
    px(ctx, "#1f3d1f", 1, 0, 14, 4);           // canopy lintel
    px(ctx, "#2c5a30", 2, 0, 12, 3);
    px(ctx, "#173016", 4, 5, 8, 11);           // dark woods beyond
    px(ctx, "#0f240f", 6, 7, 4, 9);
  });

  /* ================= SHOP INTERIOR ================= */
  reg("swall", true, (ctx) => {
    px(ctx, "#5a4029", 0, 0, 16, 16);
    // horizontal planks
    for (let y = 0; y < 16; y += 4) { px(ctx, "#6e4f33", 0, y, 16, 3); px(ctx, "#4a3320", 0, y + 3, 16, 1); }
    px(ctx, "#7d5b3c", 0, 0, 16, 1);
    px(ctx, "#3a2716", 5, 0, 1, 16); px(ctx, "#3a2716", 11, 0, 1, 16);
  });
  reg("sfloor", false, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#b98e55", 0, 0, 16, 1); px(ctx, "#b98e55", 0, 8, 16, 1);
    px(ctx, "#d8b27a", 0, 1, 16, 2); px(ctx, "#d8b27a", 0, 9, 16, 2);
    px(ctx, "#a87f49", 0, 7, 16, 1); px(ctx, "#a87f49", 8, 8, 1, 8);
  });
  reg("scounter", true, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#7a4f28", 0, 3, 16, 11);          // counter body
    px(ctx, "#8a5c34", 0, 3, 16, 2);
    px(ctx, "#5a3a1e", 0, 12, 16, 2);
    px(ctx, "#9c6a3c", 0, 5, 16, 1);
    // top surface
    px(ctx, "#a87844", 0, 1, 16, 2); px(ctx, "#c08a52", 0, 1, 16, 1);
  });
  reg("swares", true, (ctx) => {
    px(ctx, "#5a4029", 0, 0, 16, 16);
    px(ctx, "#6e4f33", 0, 1, 16, 14);          // shelf box
    px(ctx, "#4a3320", 0, 5, 16, 1); px(ctx, "#4a3320", 0, 10, 16, 1);
    // colorful goods
    px(ctx, "#c0432f", 2, 2, 3, 3); px(ctx, "#e8c34a", 6, 2, 2, 3); px(ctx, "#5b9ed6", 10, 2, 3, 3);
    px(ctx, "#7fb069", 2, 6, 2, 3); px(ctx, "#d67ad0", 6, 6, 3, 3); px(ctx, "#e8a23a", 11, 6, 2, 3);
    px(ctx, "#9aa0ad", 3, 11, 3, 3); px(ctx, "#caa23a", 9, 11, 3, 3);
  });
  reg("crate", true, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#8a5c34", 2, 4, 12, 11);
    px(ctx, "#a8753f", 3, 5, 10, 9);
    px(ctx, "#5a3a1e", 2, 4, 12, 1); px(ctx, "#5a3a1e", 2, 14, 12, 1);
    px(ctx, "#5a3a1e", 7, 5, 2, 9);            // plank seam
    px(ctx, "#5a3a1e", 3, 9, 10, 1);
  });
  reg("barrel", true, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#7a4f28", 4, 2, 8, 13);
    px(ctx, "#9c6a3c", 5, 2, 6, 13);
    px(ctx, "#5a3a1e", 4, 4, 8, 1); px(ctx, "#5a3a1e", 4, 11, 8, 1);
    px(ctx, "#caa23a", 5, 1, 6, 2);            // fish poking out
    px(ctx, "#e8c869", 6, 1, 1, 1); px(ctx, "#e8c869", 9, 1, 1, 1);
  });
  reg("srug", false, (ctx) => {
    px(ctx, "#7a3b58", 0, 0, 16, 16);
    px(ctx, "#9a4f72", 2, 2, 12, 12);
    px(ctx, "#7a3b58", 4, 4, 8, 8);
    px(ctx, "#e0b54a", 0, 0, 16, 1); px(ctx, "#e0b54a", 0, 15, 16, 1);
    px(ctx, "#e0b54a", 0, 0, 1, 16); px(ctx, "#e0b54a", 15, 0, 1, 16);
    px(ctx, "#caa23a", 7, 7, 2, 2);
  });
  reg("sexit", false, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#6b4f2c", 2, 9, 12, 6);           // doormat
    px(ctx, "#8a6743", 3, 10, 10, 4);
    px(ctx, "#5a4124", 2, 9, 12, 1);
    // down-arrow hint
    px(ctx, "#3b2f25", 7, 2, 2, 3); px(ctx, "#3b2f25", 6, 4, 4, 1); px(ctx, "#3b2f25", 7, 5, 2, 1);
  });
  reg("slamp", true, (ctx) => {
    px(ctx, "#5a4029", 0, 0, 16, 16);
    const g = ctx.createRadialGradient(8, 6, 1, 8, 6, 9);
    g.addColorStop(0, "rgba(255,200,90,0.5)"); g.addColorStop(1, "rgba(255,200,90,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 16);
    px(ctx, "#3a2716", 7, 1, 2, 2);            // hook
    px(ctx, "#caa23a", 5, 3, 6, 6);            // lantern body
    px(ctx, "#f0d878", 6, 4, 4, 4);
    px(ctx, "#fff0b4", 7, 5, 2, 2);
    px(ctx, "#3a2716", 5, 9, 6, 1);
  });

  window.Tiles3 = { ready: true };
})();
