/* ============================================================
   sprites2.js  —  CHAPTER II sprites.
   - new henchcat + kitten palettes (recolor the shared template)
   - Madame Vesper boss (composite: cat + crown + ruff + gown)
   - gear icons (claws / collar / bell) + chi orb
   Builds on Sprites from sprites.js.
   ============================================================ */
(function () {
  const S = window.Sprites;

  // ---- extra cat palettes (used with the shared 12x12 template) ----
  Object.assign(S.CAT_PALETTES, {
    shade:  { O:"#100d18", B:"#3a3550", S:"#262236", E:"#7fd0ff", W:"#eaffff", I:"#9a6f9c", C:"#3a3550" },
    brute:  { O:"#241a14", B:"#7a4a2c", S:"#542f1a", E:"#ffcf3a", W:"#fff", I:"#e0908f", C:"#9a6a3c" },
    hex:    { O:"#122014", B:"#5a8f4a", S:"#3c6630", E:"#caa23a", W:"#eaffd0", I:"#bfe07a", C:"#6fae57" },
    vesper: { O:"#170c20", B:"#d9cbe0", S:"#b09cc0", E:"#8fe04a", W:"#eaffd0", I:"#e07ab0", C:"#cdbcd9" },
    // kittens
    kCalico:{ O:"#5a3318", B:"#f1e7d7", S:"#d8b48a", E:"#5b9e57", W:"#fff", I:"#e0908f", C:"#f5b86a" },
    kGrey:  { O:"#2f2f3a", B:"#b8bcc6", S:"#8a8f9c", E:"#6f9e57", W:"#fff", I:"#d39bb0", C:"#cfd3da" },
    kCream: { O:"#6a4a2c", B:"#f3e2c0", S:"#d8bd90", E:"#7a9ed6", W:"#fff", I:"#e0908f", C:"#fff0d6" },
    kBlack: { O:"#141019", B:"#2e2e3a", S:"#1d1d27", E:"#ffcf3a", W:"#fff", I:"#d39bb0", C:"#3a3a48" },
    kBlue:  { O:"#1f2b3a", B:"#7f93b0", S:"#566a86", E:"#ffcf3a", W:"#fff", I:"#d39bb0", C:"#9fb2cc" },
  });

  const KITTEN_KINDS = ["kCalico", "kGrey", "kCream", "kBlack", "kBlue"];

  /* ---------------- Madame Vesper ---------------- */
  // Composite villain: the recolored cat body, plus a tall mourning-veil mane,
  // a high lace ruff, a sweeping gown, and a thorned gold crown.
  function drawVesper(ctx, x, y, scale, opts) {
    opts = opts || {};
    const sc = scale || 4;
    const t = (opts.t || 0);
    const r = (gx, gy, gw, gh, col) => { ctx.fillStyle = col; ctx.fillRect(x + gx * sc, y + gy * sc, gw * sc, gh * sc); };

    const GOWN = "#3f1f50", GOWN_D = "#2a1338", GOWN_HI = "#5a2d6e";
    const VEIL = "#231235", VEIL_HI = "#3a2150";
    const GOLD = "#e8c34a", GOLD_D = "#b9892f";

    // ---- sweeping gown (behind / under the body) ----
    r(2, 12, 12, 4, GOWN_D);
    r(3, 11, 10, 5, GOWN);
    r(4, 10, 8, 6, GOWN);
    r(4, 11, 1, 5, GOWN_HI);
    r(1, 15, 14, 1, GOWN_D);
    r(2, 15, 12, 1, GOLD_D);          // gold hem
    r(6, 12, 1, 4, GOWN_D); r(9, 12, 1, 4, GOWN_D);  // gown folds
    // collar jewel dangling
    r(8, 11, 1, 1, GOLD);

    // ---- tall mourning veil / mane behind the head ----
    r(4, 0, 8, 2, VEIL);
    r(3, 1, 10, 3, VEIL);
    r(2, 3, 12, 3, VEIL);
    r(2, 5, 2, 4, VEIL); r(12, 5, 2, 4, VEIL);   // veil falls past the cheeks
    r(4, 0, 2, 1, VEIL_HI); r(7, 0, 2, 1, VEIL_HI);

    // ---- the cat herself (pale, green-eyed) ----
    S.drawCat(ctx, "vesper", "down", x, y, { scale: sc, flash: opts.flash });

    // ---- high lace ruff under the chin ----
    r(3, 9, 10, 1, "#efe6f2");
    r(4, 9, 8, 1, "#cdbcd9");
    r(3, 9, 1, 1, GOLD); r(12, 9, 1, 1, GOLD);

    // ---- thorned gold crown ----
    if (!opts.flash) {
      r(4, 1, 8, 1, GOLD_D);
      r(4, 1, 8, 1, GOLD);
      // spikes
      r(4, 0, 1, 1, GOLD); r(7, -1 + 1, 1, 0, GOLD);
      r(4, 0, 1, 1, GOLD); r(6, 0, 1, 1, GOLD); r(8, 0, 1, 1, GOLD); r(11, 0, 1, 1, GOLD);
      r(7, -1, 2, 1, GOLD);            // tall center spike
      r(7, -2, 1, 1, "#fff0b4");       // jewel glint
      // green crown gem
      r(7, 1, 2, 1, "#8fe04a");
    }
  }

  /* ---------------- kitten (smaller, cuter cat) ---------------- */
  function drawKitten(ctx, kind, dir, x, y, opts) {
    // kittens are just the template at a slightly smaller body — draw normally
    S.drawCat(ctx, kind, dir, x, y, opts);
  }

  /* ---------------- gear icons (16x16 grids) ---------------- */
  const GEAR_ICONS = {
    claws: {
      pal: { O:"#23222a", S:"#b9c0cc", H:"#eef2f7", D:"#7d8492", g:"#5a3a22" },
      rows: [
        "................",
        ".O....O....O....",
        "OHO..OHO..OHO...",
        "OHO..OHO..OHO...",
        "OSO..OSO..OSO...",
        "OSO..OSO..OSO...",
        "OSO..OSO..OSO...",
        ".DO..ODO..OD....",
        "..ggggggggg.....",
        ".gggggggggg.....",
        ".gggggggggg.....",
        "..gggggggg......",
        "................",
        "................",
        "................",
        "................",
      ],
    },
    collar: {
      pal: { O:"#1c1826", L:"#7a3b58", D:"#4a1f33", S:"#9aa0ad", H:"#eef2f7" },
      rows: [
        "................",
        "................",
        "................",
        "...OOOOOOOO.....",
        "..OLLLLLLLLO....",
        ".OLDLDLDLDLLO...",
        ".OLLLLLLLLLLO...",
        ".OLDLDLDLDLLO...",
        "..OLLLLLLLLO....",
        "...OOSSSSOO.....",
        "....OSHHSO......",
        ".....OSSO.......",
        "......OO........",
        "................",
        "................",
        "................",
      ],
    },
    bell: {
      pal: { O:"#5a3a14", G:"#e8c34a", H:"#fff0b4", D:"#b9892f", r:"#c23a4a" },
      rows: [
        "................",
        "......OO........",
        ".....OrrO.......",
        "......OO........",
        ".....OGGO.......",
        "....OGHGGO......",
        "...OGGGGGGO.....",
        "..OGHGGGGGGO....",
        "..OGGGGGGGGO....",
        "..OGGGGGGGDO....",
        ".OGGGGGGGGGDO...",
        ".ODDDDDDDDDDO...",
        "...OO.OO.OO.....",
        "....OGGGGO......",
        ".....ODDO.......",
        "................",
      ],
    },
  };

  function drawGearIcon(ctx, gid, x, y, scale) {
    const g = GEAR_ICONS[gid]; if (!g) return;
    S.drawPixels(ctx, g.rows, g.pal, x || 0, y || 0, scale || 1, false);
  }

  /* ---------------- chi orb (energy pip) ---------------- */
  function drawChiOrb(ctx, x, y, scale, full) {
    const p = full
      ? { o:"#1c4a5a", a:"#2bbfd6", b:"#9af0ff", c:"#e8ffff" }
      : { o:"#2a2536", a:"#1d1830", b:"#332c44", c:"#3c3550" };
    const rows = [
      "..oo..",
      ".oaao.",
      "oabcao",
      "oabbao",
      ".oaao.",
      "..oo..",
    ];
    S.drawPixels(ctx, rows, p, x, y, scale || 1, false);
  }

  window.Sprites2 = { drawVesper, drawKitten, drawGearIcon, drawChiOrb, GEAR_ICONS, KITTEN_KINDS };
})();
