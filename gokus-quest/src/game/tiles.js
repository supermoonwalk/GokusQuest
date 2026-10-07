/* ============================================================
   tiles.js  —  16x16 tile art baked to offscreen canvases.
   TILES[id] = { canvas, solid }
   Ground tiles fill fully; object/overlay tiles use '.' transparent
   and are drawn on top of ground in the engine.
   ============================================================ */
(function () {
  const TS = 16;
  const TILES = {};

  function make(solid) {
    const c = document.createElement("canvas");
    c.width = TS; c.height = TS;
    const ctx = c.getContext("2d");
    return { c, ctx, solid: !!solid };
  }
  function px(ctx, color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w || 1, h || 1);
  }
  function paint(ctx, rows, pal) {
    for (let y = 0; y < rows.length; y++)
      for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === "." || ch === " ") continue;
        if (pal[ch]) px(ctx, pal[ch], x, y);
      }
  }
  function reg(id, solid, drawFn) {
    const t = make(solid);
    drawFn(t.ctx);
    TILES[id] = { canvas: t.c, solid: t.solid };
  }

  // deterministic pseudo-random for speckles
  function rnd(x, y, s) { const v = Math.sin((x * 12.9898 + y * 78.233 + s * 3.77)) * 43758.5453; return v - Math.floor(v); }

  /* ---------------- GROUND ---------------- */
  reg("grass", false, (ctx) => {
    px(ctx, "#7fb069", 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const r = rnd(x, y, 1);
      if (r > 0.93) px(ctx, "#8fc079", x, y);
      else if (r < 0.06) px(ctx, "#6f9d5a", x, y);
    }
    // a few grass blades
    px(ctx, "#5f8d4d", 3, 11); px(ctx, "#5f8d4d", 3, 10);
    px(ctx, "#5f8d4d", 11, 5); px(ctx, "#5f8d4d", 11, 4);
  });
  reg("grass2", false, (ctx) => {
    px(ctx, "#79a862", 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const r = rnd(x, y, 2);
      if (r > 0.9) px(ctx, "#88b870", x, y);
      else if (r < 0.08) px(ctx, "#688f53", x, y);
    }
    px(ctx, "#5f8d4d", 7, 9); px(ctx, "#5f8d4d", 7, 8);
  });
  reg("path", false, (ctx) => {
    px(ctx, "#d8b88c", 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const r = rnd(x, y, 3);
      if (r > 0.9) px(ctx, "#e6caa3", x, y);
      else if (r < 0.1) px(ctx, "#c5a276", x, y);
    }
    // small pebbles
    px(ctx, "#b7946a", 4, 5, 2, 1); px(ctx, "#b7946a", 11, 10, 2, 1);
  });
  reg("water", true, (ctx) => {
    px(ctx, "#6bb6d6", 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const r = rnd(x, y, 4);
      if (r > 0.92) px(ctx, "#8fcfe8", x, y);
      else if (r < 0.08) px(ctx, "#56a0c2", x, y);
    }
    px(ctx, "#cdeefb", 3, 4, 4, 1); px(ctx, "#cdeefb", 9, 9, 3, 1);
    px(ctx, "#cdeefb", 6, 12, 3, 1);
  });
  reg("floor", false, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    // wood plank lines
    for (let x = 0; x < 16; x++) px(ctx, "#b98c56", x, 0);
    for (let x = 0; x < 16; x++) px(ctx, "#b98c56", x, 8);
    px(ctx, "#d8b489", 0, 1, 16, 3); px(ctx, "#d8b489", 0, 9, 16, 3);
    px(ctx, "#b98c56", 5, 4); px(ctx, "#b98c56", 12, 12);
  });
  reg("rug", false, (ctx) => {
    px(ctx, "#c96d6d", 0, 0, 16, 16);
    px(ctx, "#e89a9a", 1, 1, 14, 14);
    px(ctx, "#c96d6d", 3, 3, 10, 10);
    px(ctx, "#f3c0c0", 6, 6, 4, 4);
  });
  reg("matground", false, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#9c7b4d", 2, 4, 12, 8);
    px(ctx, "#b88f5b", 3, 5, 10, 6);
    px(ctx, "#7d6240", 3, 7, 10, 1);
  });

  /* ---------------- OVERWORLD OBJECTS ---------------- */
  reg("tree", true, (ctx) => {
    // trunk
    px(ctx, "#7a5230", 7, 11, 3, 4);
    px(ctx, "#5f3f24", 7, 11, 1, 4);
    // canopy
    const cp = { a:"#4e8c4a", b:"#3d7340", c:"#62a85a", o:"#2f5a33" };
    const canopy = [
      "....oooo....",
      "..oobbbboo..",
      ".obbccccbbo.",
      "obbccccccbbo",
      "obcccccccbbo",
      "obbcccccccbo",
      ".obbccccbbo.",
      "..obbbbbbo..",
      "...oooooo...",
    ];
    for (let y = 0; y < canopy.length; y++)
      for (let x = 0; x < canopy[y].length; x++) {
        const ch = canopy[y][x]; if (ch === "." ) continue;
        if (cp[ch]) px(ctx, cp[ch], x + 2, y);
      }
  });
  reg("bush", true, (ctx) => {
    const cp = { o:"#2f5a33", b:"#3d7340", c:"#5a9a52" };
    const rows = [
      "................",
      "................",
      "................",
      "....oo....oo....",
      "...obboooobbo...",
      "..obbccccccbbo..",
      "..obccccccccbo..",
      "..obbcccccccbo..",
      "...obbccccbbo...",
      "....oobbbboo....",
      ".....oooooo.....",
      "................",
      "................",
      "................",
      "................",
      "................",
    ];
    paint(ctx, rows, cp);
  });
  reg("flowerP", false, (ctx) => {
    px(ctx, "#5f8d4d", 7, 11); px(ctx, "#5f8d4d", 7, 12); // stem
    const head = ["..p..", ".ppp.", "ppypp", ".ppp.", "..p.."];
    for (let y=0;y<head.length;y++) for(let x=0;x<head[y].length;x++){
      const ch=head[y][x]; if(ch===".")continue;
      px(ctx, ch==="y"?"#f4d65a":"#e87fae", x+5, y+5);
    }
  });
  reg("flowerY", false, (ctx) => {
    px(ctx, "#5f8d4d", 8, 11); px(ctx, "#5f8d4d", 8, 12);
    const head = ["..y..", ".yry.", "yrrry", ".yry.", "..y.."];
    for (let y=0;y<head.length;y++) for(let x=0;x<head[y].length;x++){
      const ch=head[y][x]; if(ch===".")continue;
      px(ctx, ch==="r"?"#e88a3c":"#f4d65a", x+6, y+5);
    }
  });
  reg("fence", true, (ctx) => {
    const w="#caa06a", d="#9c7b4d";
    px(ctx, d, 2, 4, 2, 11); px(ctx, w, 2, 4, 1, 11);
    px(ctx, d, 11, 4, 2, 11); px(ctx, w, 11, 4, 1, 11);
    px(ctx, d, 0, 6, 16, 2); px(ctx, w, 0, 6, 16, 1);
    px(ctx, d, 0, 10, 16, 2); px(ctx, w, 0, 10, 16, 1);
  });
  reg("sign", true, (ctx) => {
    px(ctx, "#7a5230", 7, 9, 2, 6);
    px(ctx, "#9c7b4d", 2, 3, 12, 7);
    px(ctx, "#c2a06f", 3, 4, 10, 5);
    px(ctx, "#6b4a2c", 4, 6, 8, 1);
    px(ctx, "#6b4a2c", 4, 8, 6, 1);
    // border
    px(ctx, "#5f3f24", 2, 3, 12, 1); px(ctx, "#5f3f24", 2, 9, 12, 1);
  });

  /* ---------- HOUSE EXTERIOR (3 wide x 3 tall) ---------- */
  const ROOF = { o:"#7a3b3b", a:"#b35a4f", b:"#c97a6a", h:"#e0a193" };
  // lower half of a roof tile: the top of the wall under the eave, so the
  // roof row meets the wall row below without a strip of grass between them
  function eave(ctx, side) {
    px(ctx, "#d8b489", 0, 9, 16, 7);          // wall plaster
    px(ctx, "#9c7b4d", 0, 9, 16, 2);          // shadow cast by the roof
    px(ctx, "#b08a55", 0, 11, 16, 1);
    if (side === "L") px(ctx, "#6b4a2c", 0, 9, 1, 7);
    if (side === "R") px(ctx, "#6b4a2c", 15, 9, 1, 7);
  }
  reg("roofL", true, (ctx) => {
    eave(ctx, "L");
    const rows = [
      "............oooo",
      ".........oooaaaa",
      "......ooooaaaabb",
      "...oooaaaabbbbhb",
      "oooaaaabbbbbbhbb",
      "oaaabbbbbbhhbbbb",
      "oaabbbbbbbbbbbbb",
      "obbbbbbbbbbbbbbb",
      "oooooooooooooooo",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
    ];
    paint(ctx, rows, ROOF);
  });
  reg("roofM", true, (ctx) => {
    eave(ctx, "M");
    const rows = [
      "................",
      "................",
      "................",
      "................",
      "hbbbbbbbbbbbbbbh",
      "bbbbbbbbbbbbbbbb",
      "bbbbbbbbbbbbbbbb",
      "bbbbbbbbbbbbbbbb",
      "oooooooooooooooo",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
    ];
    paint(ctx, rows, ROOF);
  });
  reg("roofR", true, (ctx) => {
    eave(ctx, "R");
    const rows = [
      "oooo............",
      "aaaaooo.........",
      "bbaaaaoooo......",
      "bhbbbbaaaooo....",
      "bbhbbbbbbaaaooo.",
      "bbbbhhbbbbbbaaao",
      "bbbbbbbbbbbbbaao",
      "bbbbbbbbbbbbbbbo",
      "oooooooooooooooo",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
    ];
    paint(ctx, rows, ROOF);
  });
  const WALL = { o:"#6b4a2c", w:"#d8b489", s:"#c2a06f", d:"#9c7b4d" };
  reg("wallL", true, (ctx) => {
    px(ctx, "#d8b489", 0, 0, 16, 16);
    px(ctx, "#c2a06f", 0, 0, 16, 16);
    px(ctx, "#d8b489", 1, 1, 15, 14);
    px(ctx, "#6b4a2c", 0, 0, 1, 16);
    px(ctx, "#b08a55", 0, 14, 16, 2);
    px(ctx, "#c2a06f", 3, 3, 4, 1); px(ctx, "#c2a06f", 9, 8, 4, 1);
  });
  reg("wallR", true, (ctx) => {
    px(ctx, "#d8b489", 0, 0, 16, 16);
    px(ctx, "#6b4a2c", 15, 0, 1, 16);
    px(ctx, "#b08a55", 0, 14, 16, 2);
    px(ctx, "#c2a06f", 3, 5, 4, 1); px(ctx, "#c2a06f", 8, 10, 4, 1);
  });
  reg("window", true, (ctx) => {
    px(ctx, "#d8b489", 0, 0, 16, 16);
    px(ctx, "#b08a55", 0, 14, 16, 2);
    // window frame
    px(ctx, "#6b4a2c", 3, 2, 10, 9);
    px(ctx, "#bfe6f2", 4, 3, 8, 7);
    px(ctx, "#9cd3e6", 4, 6, 8, 1);
    px(ctx, "#6b4a2c", 7, 3, 1, 7);
    px(ctx, "#9c7b4d", 2, 10, 12, 1);
  });
  reg("door", false, (ctx) => { // warp; not solid (entered from south)
    px(ctx, "#d8b489", 0, 0, 16, 16);
    px(ctx, "#b08a55", 0, 14, 16, 2);
    px(ctx, "#5f3f24", 3, 2, 10, 14);
    px(ctx, "#7a5230", 4, 3, 8, 13);
    px(ctx, "#5f3f24", 8, 3, 1, 13); // plank line
    px(ctx, "#e0c060", 10, 9); px(ctx, "#e0c060", 10, 10); // knob
    px(ctx, "#9c7b4d", 2, 2, 12, 1);
  });

  /* ---------------- INTERIOR ---------------- */
  reg("wallInt", true, (ctx) => {
    px(ctx, "#b88f5b", 0, 0, 16, 16);
    px(ctx, "#caa06a", 0, 0, 16, 12);
    for (let x = 0; x < 16; x += 4) px(ctx, "#a07a48", x, 0, 1, 12);
    px(ctx, "#a07a48", 0, 5, 16, 1);
    px(ctx, "#7d6240", 0, 12, 16, 4); // baseboard
    px(ctx, "#9c7b4d", 0, 12, 16, 1);
  });
  reg("wallWindow", true, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 12);
    px(ctx, "#7d6240", 0, 12, 16, 4);
    px(ctx, "#6b4a2c", 2, 1, 12, 9);
    px(ctx, "#bfe6f2", 3, 2, 10, 7);
    px(ctx, "#8fc0d6", 3, 5, 10, 1);
    px(ctx, "#6b4a2c", 8, 2, 1, 7);
  });
  // broken window (CLUE): smashed glass, fur on the sill
  reg("wallBroken", true, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 12);
    px(ctx, "#7d6240", 0, 12, 16, 4);
    px(ctx, "#6b4a2c", 2, 1, 12, 9);
    px(ctx, "#2a3b44", 3, 2, 10, 7); // dark open window (night/outside)
    // broken glass shards
    px(ctx, "#bfe6f2", 3, 2, 3, 1); px(ctx, "#bfe6f2", 11, 2, 2, 1);
    px(ctx, "#bfe6f2", 3, 3); px(ctx, "#bfe6f2", 12, 4);
    px(ctx, "#bfe6f2", 4, 8, 2, 1); px(ctx, "#bfe6f2", 10, 8);
    // tuxedo fur caught on frame (black + white tufts)
    px(ctx, "#23232b", 12, 9, 2, 1); px(ctx, "#23232b", 13, 8);
    px(ctx, "#f2efe8", 11, 10); px(ctx, "#f2efe8", 13, 10);
  });
  // claw marks on wall (CLUE)
  reg("wallClaw", true, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 12);
    px(ctx, "#7d6240", 0, 12, 16, 4);
    const sc = "#7a3b3b";
    for (let i = 0; i < 3; i++) {
      const x0 = 3 + i * 3;
      for (let k = 0; k < 9; k++) px(ctx, sc, x0 + Math.floor(k/3), 1 + k);
    }
    px(ctx, "#a85a52", 4, 4); px(ctx, "#a85a52", 7, 6); px(ctx, "#a85a52", 10, 5);
  });
  reg("exitInt", false, (ctx) => { // rug/mat doorway back outside
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#3a3a44", 3, 0, 10, 13); // open doorway dark
    px(ctx, "#2a2a33", 4, 0, 8, 12);
    px(ctx, "#9c7b4d", 2, 0, 12, 1);
    px(ctx, "#e0c060", 6, 6, 4, 1); // light hint
    px(ctx, "#caa06a", 0, 13, 16, 3); // threshold
  });
  reg("bed", true, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#7a5230", 1, 1, 14, 14); // frame
    px(ctx, "#9c6a3c", 2, 2, 12, 13);
    px(ctx, "#f0eae0", 3, 8, 10, 6); // pillow/sheet
    px(ctx, "#dcd2c4", 3, 11, 10, 1);
    px(ctx, "#c96d6d", 3, 3, 10, 5); // blanket
    px(ctx, "#e89a9a", 3, 3, 10, 1);
  });
  reg("table", true, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#7a5230", 2, 4, 12, 8);
    px(ctx, "#9c6a3c", 3, 5, 10, 5);
    px(ctx, "#5f3f24", 3, 12, 2, 3); px(ctx, "#5f3f24", 11, 12, 2, 3);
    // a teacup on top
    px(ctx, "#f0eae0", 6, 6, 3, 2); px(ctx, "#c96d6d", 6, 6, 3, 1);
  });
  reg("chairOk", true, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#7a5230", 5, 2, 6, 10);
    px(ctx, "#9c6a3c", 6, 3, 4, 5);
    px(ctx, "#5f3f24", 5, 12, 2, 3); px(ctx, "#5f3f24", 9, 12, 2, 3);
  });
  // knocked-over chair (CLUE)
  reg("chairTip", false, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#7a5230", 2, 8, 12, 4);
    px(ctx, "#9c6a3c", 3, 9, 8, 2);
    px(ctx, "#5f3f24", 2, 5, 2, 3); px(ctx, "#5f3f24", 2, 12, 2, 3);
    px(ctx, "#5f3f24", 12, 6, 2, 6);
  });
  // broken vase (CLUE)
  reg("vase", false, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    // shards scattered
    const b = "#4f86b6", d = "#356a96";
    px(ctx, b, 4, 9, 3, 2); px(ctx, d, 4, 10, 3, 1);
    px(ctx, b, 9, 11, 2, 1); px(ctx, b, 7, 12); px(ctx, b, 11, 9);
    px(ctx, d, 5, 7); px(ctx, b, 6, 6, 2, 1);
    // water spill
    px(ctx, "#9cc4dd", 6, 13, 5, 1);
  });
  reg("plant", true, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#9c6a3c", 5, 10, 6, 5); // pot
    px(ctx, "#7a5230", 5, 10, 6, 1);
    px(ctx, "#3d7340", 4, 3, 8, 7); // foliage
    px(ctx, "#5a9a52", 5, 4, 6, 4);
    px(ctx, "#2f5a33", 6, 8, 1, 3);
  });
  reg("shelf", true, (ctx) => {
    px(ctx, "#caa06a", 0, 0, 16, 16);
    px(ctx, "#7a5230", 1, 1, 14, 14);
    px(ctx, "#9c6a3c", 2, 2, 12, 12);
    px(ctx, "#5f3f24", 2, 6, 12, 1); px(ctx, "#5f3f24", 2, 10, 12, 1);
    // books
    px(ctx, "#c96d6d", 3, 3, 1, 3); px(ctx, "#5b9e57", 5, 3, 1, 3);
    px(ctx, "#4f86b6", 7, 3, 1, 3); px(ctx, "#e2913f", 9, 3, 1, 3);
    px(ctx, "#5b9e57", 3, 7, 1, 3); px(ctx, "#c96d6d", 10, 7, 1, 3);
  });

  /* ---------------- GOKU'S HUT (exterior: thatched roof) ---------------- */
  const THATCH = { o:"#6b4a1e", a:"#b0843c", b:"#d2a552", h:"#ecc775" };
  const THATCH_ROWS = {
    L: ["............oooo", ".........oooaaaa", "......ooooaabbab", "...oooaabbbabbhb",
        "oooaabbabbbhbbab", "oaabbhbbabbbbabb", "oabbbbabbhbbabbb", "obababbbbbabbbab", "oooooooooooooooo"],
    M: ["................", "................", "................", "................",
        "hbabbbhbbabbbabh", "bbbabbbbabbhbbab", "babbbhbbbabbbbab", "bbabbbabbbbabbbb", "oooooooooooooooo"],
    R: ["oooo............", "aaaaooo.........", "babaaaoooo......", "bhbbabbaaooo....",
        "babbhbbbabaaooo.", "bbabbbbhbbabaaao", "bbbabbhbbbbbbabo", "babbbabbbbabbabo", "oooooooooooooooo"],
  };
  ["L", "M", "R"].forEach(side => reg("hutRoof" + side, true, (ctx) => {
    eave(ctx, side);
    paint(ctx, THATCH_ROWS[side].concat(new Array(7).fill("................")), THATCH);
  }));

  // plank walls: humbler than Chi Chi's plastered cottage
  function planks(ctx, side) {
    px(ctx, "#9c7448", 0, 0, 16, 16);
    for (let y = 3; y < 16; y += 4) px(ctx, "#7a5530", 0, y, 16, 1);       // board seams
    px(ctx, "#b08856", 0, 0, 16, 1);
    px(ctx, "#6b4a2c", 5, 1, 1, 2); px(ctx, "#6b4a2c", 11, 9, 1, 2);       // knots
    px(ctx, "#5f3f24", 0, 14, 16, 2);                                      // footing
    if (side === "L") px(ctx, "#5f3f24", 0, 0, 2, 16);
    if (side === "R") px(ctx, "#5f3f24", 14, 0, 2, 16);
  }
  reg("hutWallL", true, (ctx) => planks(ctx, "L"));
  reg("hutWallR", true, (ctx) => planks(ctx, "R"));
  reg("hutWindow", true, (ctx) => {
    planks(ctx, "M");
    px(ctx, "#5f3f24", 4, 3, 8, 7); px(ctx, "#bfe6f2", 5, 4, 6, 5); px(ctx, "#5f3f24", 7, 4, 1, 5);
    px(ctx, "#c96d6d", 4, 3, 2, 3); px(ctx, "#c96d6d", 10, 3, 2, 3);       // little curtains
  });
  reg("hutDoor", false, (ctx) => {                                         // warp; not solid
    planks(ctx, "M");
    px(ctx, "#4a3320", 4, 4, 8, 12); px(ctx, "#6b4a2c", 5, 5, 6, 11);
    px(ctx, "#4a3320", 5, 9, 6, 1); px(ctx, "#e0c060", 9, 10, 1, 1);
  });

  /* ---------------- GOKU'S HUT (interior furniture) ---------------- */
  // straw sleeping mat: what Goku starts with
  reg("strawmat", false, (ctx) => {
    px(ctx, "#a07a48", 0, 0, 16, 16);
    px(ctx, "#d8b45a", 2, 4, 12, 9); px(ctx, "#b8913e", 2, 4, 12, 1); px(ctx, "#b8913e", 2, 12, 12, 1);
    for (let x = 3; x < 14; x += 2) px(ctx, "#c9a24a", x, 5, 1, 7);
    px(ctx, "#e8cf86", 4, 6, 3, 2);
  });
  // scratching post: +attack
  reg("scratchpost", true, (ctx) => {
    px(ctx, "#6b4a2c", 3, 13, 10, 3);                       // base
    px(ctx, "#c9a46a", 6, 2, 4, 11);                        // sisal column
    for (let y = 3; y < 13; y += 2) px(ctx, "#a8824a", 6, y, 4, 1);
    px(ctx, "#e05a5a", 5, 1, 6, 2);                         // red cap
    px(ctx, "#ffd36a", 11, 4, 2, 2); px(ctx, "#7a5230", 11, 3, 1, 1);  // dangling toy
  });
  // fish bowl: a free treat after every trip out
  reg("fishbowl", true, (ctx) => {
    px(ctx, "#7a5230", 2, 12, 12, 4);                       // little table
    px(ctx, "#9c7b4d", 2, 12, 12, 1);
    px(ctx, "#bfe6f2", 4, 4, 8, 8); px(ctx, "#9cd3e6", 4, 7, 8, 5);
    px(ctx, "#e6f6fb", 5, 4, 2, 2);
    px(ctx, "#f08a3a", 7, 8, 3, 2); px(ctx, "#f08a3a", 10, 9, 1, 1); // goldfish
  });
  // window cushion: +max chi
  reg("cushion", true, (ctx) => {
    px(ctx, "#6b4a2c", 1, 11, 14, 2);
    px(ctx, "#c96d6d", 2, 6, 12, 6); px(ctx, "#e08a8a", 3, 7, 10, 2);
    px(ctx, "#a85050", 2, 11, 12, 1);
    px(ctx, "#f6e7c4", 7, 8, 2, 2);                          // button
  });
  // trophy shelf: shows the bosses you've beaten
  reg("trophies", true, (ctx) => {
    px(ctx, "#5f3f24", 1, 2, 14, 12);
    px(ctx, "#7a5230", 2, 3, 12, 10);
    px(ctx, "#5f3f24", 2, 8, 12, 1);                         // middle plank
    px(ctx, "#e8c34a", 4, 5, 3, 3); px(ctx, "#b9892f", 5, 7, 1, 1);  // small cup
    px(ctx, "#3b3340", 9, 10, 5, 2); px(ctx, "#f6f6f6", 11, 10, 1, 2); // bowtie
  });

  window.Tiles = { TILES, TS };
})();
