/* ============================================================
   sprites.js  —  Recolorable pixel-cat sprites + prop sprites
   A single 12x12 cat template is recolored per character.
   Legend (roles):
     O outline   B body   S shade   E eye   W eye-shine
     I inner-ear/nose (pink)   C chest/muzzle patch
   '.' = transparent
   ============================================================ */

// ---- Cat template, 4 facings (12x12 core, centered in a 16 cell) ----
const CAT_TEMPLATE = {
  w: 12, h: 12,
  down: [
    ".O........O.",
    "OBO......OBO",
    "OBIO....OIBO",
    "OBBBBBBBBBBO",
    "OBEEBBBBEEBO",
    "OBEWBBBBWEBO",
    "OBBBCIICBBBO",
    "OBBBBOOBBBBO",
    "OBBBCCCCBBBO",
    ".OBBCCCCBBO.",
    ".OBSBBBBSBO.",
    "..OO....OO..",
  ],
  up: [
    ".O........O.",
    "OBO......OBO",
    "OBBO....OBBO",
    "OBBBBBBBBBBO",
    "OBBBBBBBBBBO",
    "OBBBBBBBBBBO",
    "OBBBBBBBBBBO",
    "OBBBBBBBBBBO",
    "OBBBBSSBBBBO",
    ".OBBBBBBBBO.",
    ".OBSBBBBSBO.",
    "..OO....OO..",
  ],
  side: [ // faces RIGHT (mirror for left)
    ".O........O.",
    "OBO......OBO",
    "OBIO....OIBO",
    "OBBBBBBBBBBO",
    "OBBBBBEEBBBO",
    "OBBBBBEWBBBO",
    "OBBBBBBIIBBO",
    "OBBBBBBOOBBO",
    "OBBBBBBBBBBO",
    "OOBBBBBBBBO.",
    ".OBSBBBBSBO.",
    "..OO....OO..",
  ],
};

// ---- Character palettes (role -> color) ----
const CAT_PALETTES = {
  goku: { O:"#3b3340", B:"#fbf4ea", S:"#ddcab4", E:"#3f7fd6", W:"#dbeafe", I:"#eaa6b4", C:"#fbf4ea" },
  chichi: { O:"#4a2f1e", B:"#bb8350", S:"#8a5a32", E:"#d99a3a", W:"#f6e7c4", I:"#e0908f", C:"#bb8350" },
  hench: { O:"#33333d", B:"#9aa0ad", S:"#6b7280", E:"#d2a93b", W:"#fff7df", I:"#c98b95", C:"#9aa0ad" },
  hench2: { O:"#2f2a36", B:"#b9a6c4", S:"#8a7896", E:"#caa23a", W:"#fff7df", I:"#d39bb0", C:"#b9a6c4" },
  boss: { O:"#0e0e15", B:"#2a2a33", S:"#16161d", E:"#ecc73b", W:"#fff", I:"#d98a99", C:"#f2efe8" },
  elder: { O:"#3a3a44", B:"#c9c6cf", S:"#9a97a3", E:"#6f9e57", W:"#fff", I:"#d39bb0", C:"#e9e6ee" },
  villager: { O:"#5a3318", B:"#e2913f", S:"#b3641f", E:"#5b9e57", W:"#fff", I:"#e0908f", C:"#f2d8b0" },
};

// ---- Generic pixel draw ----
function drawPixels(ctx, rows, palette, px, py, scale, flipX) {
  const h = rows.length;
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === "." || ch === " ") continue;
      const col = palette[ch];
      if (!col) continue;
      const dx = flipX ? (row.length - 1 - x) : x;
      ctx.fillStyle = col;
      ctx.fillRect(px + dx * scale, py + y * scale, scale, scale);
    }
  }
}

// Draw a cat. dir: 'down'|'up'|'left'|'right'. (x,y) = top-left of 16px tile.
function drawCat(ctx, kind, dir, x, y, opts) {
  opts = opts || {};
  const pal = CAT_PALETTES[kind] || CAT_PALETTES.goku;
  let rows, flip = false;
  if (dir === "up") rows = CAT_TEMPLATE.up;
  else if (dir === "left") { rows = CAT_TEMPLATE.side; flip = true; }
  else if (dir === "right") { rows = CAT_TEMPLATE.side; flip = false; }
  else rows = CAT_TEMPLATE.down;

  const scale = opts.scale || 1;
  const cw = CAT_TEMPLATE.w * scale;
  // center the 12px core in a 16px tile, with a tiny bob
  const ox = (16 * scale - cw) / 2;
  const oy = (16 * scale - CAT_TEMPLATE.h * scale) / 2 + (opts.bob || 0);

  // soft shadow
  ctx.fillStyle = "rgba(40,30,30,0.18)";
  ctx.fillRect(x + ox + 1 * scale, y + (16 * scale - 2 * scale), (CAT_TEMPLATE.w - 2) * scale, 1.5 * scale);

  if (opts.flash) {
    // white hit-flash silhouette
    const flat = {}; for (const k in pal) flat[k] = "#ffffff";
    drawPixels(ctx, rows, flat, x + ox, y + oy, scale, flip);
    return;
  }
  drawPixels(ctx, rows, pal, x + ox, y + oy, scale, flip);
}

// ---- Prop sprites (16x16, own palettes) ----
const RIBBON = {
  pal: { r:"#d8504f", d:"#a83736", h:"#f3938f" },
  rows: [
    "................",
    "................",
    "................",
    "....rr....rr....",
    "...rddr..rddr...",
    "...rdhr..rhdr...",
    "....rdrrrrdr....",
    ".....rdhhdr.....",
    "......rhhr......",
    ".....rdhhdr.....",
    "....rd.rr.dr....",
    "...rd..dd..dr...",
    "..rd...rr...dr..",
    "..r....dd....r..",
    "................",
    "................",
  ],
};

// Cage bars (drawn over a captured cat)
function drawCage(ctx, x, y, scale) {
  scale = scale || 1;
  ctx.fillStyle = "rgba(20,18,26,0.0)";
  const bar = "#6a6270", hi = "#938a9b";
  // verticals
  for (let bx = 1; bx <= 13; bx += 4) {
    ctx.fillStyle = bar;
    ctx.fillRect(x + bx * scale, y + 1 * scale, 1 * scale, 15 * scale);
    ctx.fillStyle = hi;
    ctx.fillRect(x + bx * scale, y + 1 * scale, 1 * scale, 2 * scale);
  }
  // top & bottom rails
  ctx.fillStyle = bar;
  ctx.fillRect(x + 1 * scale, y + 1 * scale, 14 * scale, 1 * scale);
  ctx.fillRect(x + 1 * scale, y + 15 * scale, 14 * scale, 1 * scale);
}

// Small heart (HP) — used by HUD canvas if needed
function drawHeart(ctx, x, y, scale, full) {
  const p = full ? { o:"#7a1f2b", a:"#e8556b", b:"#ff8aa0" } : { o:"#5a5560", a:"#3a3640", b:"#4a4550" };
  const rows = [
    ".oo..oo.",
    "obbbbbbo",
    "obbbbbbo",
    "obbbbbbo",
    ".obbbbo.",
    "..obbo..",
    "...oo...",
    "........",
  ];
  drawPixels(ctx, rows, p, x, y, scale, false);
}

window.Sprites = { drawCat, drawPixels, drawCage, drawHeart, RIBBON, CAT_PALETTES, CAT_TEMPLATE };
