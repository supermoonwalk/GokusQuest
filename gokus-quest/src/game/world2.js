/* ============================================================
   world2.js  —  CHAPTER II: the manor map, its entities,
   quest extension, warps, and gate opener. Builds on World.
   ============================================================ */
(function () {
  const W = window.World;

  function grid(w, h, fill) {
    const g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill(fill));
    return g;
  }

  /* ---------------- MANOR MAP ---------------- */
  function buildManor() {
    const MW = 22, MH = 20;
    const ground = grid(MW, MH, "dstone");
    const object = grid(MW, MH, null);

    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++)
      if ((x * 5 + y * 9) % 7 === 0) ground[y][x] = "dstone2";

    for (let y = 2; y <= 17; y++) { ground[y][10] = "dcarpet"; ground[y][11] = "dcarpet"; }
    ground[18][10] = "dexit"; ground[18][11] = "dexit";

    for (let x = 0; x < MW; x++) { object[0][x] = "dwallTop"; object[MH - 1][x] = "dwall"; }
    for (let y = 0; y < MH; y++) { object[y][0] = "dwall"; object[y][MW - 1] = "dwall"; }

    // interior cross-walls with a central opening (cols 10-11 stay open)
    for (let x = 1; x <= 20; x++) { if (x !== 10 && x !== 11) object[13][x] = "dwall"; }
    for (let x = 1; x <= 20; x++) { if (x !== 10 && x !== 11) object[7][x] = "dwall"; }

    object[1][10] = "throneL"; object[1][11] = "throneR";
    object[0][6] = "banner"; object[0][15] = "banner";
    [[5, 3], [16, 3], [5, 9], [16, 9]].forEach(([x, y]) => object[y][x] = "pillar");
    [[0, 4], [0, 10], [0, 16], [21, 4], [21, 10], [21, 16]].forEach(([x, y]) => object[y][x] = "torch");
    [[1, 4], [20, 4], [1, 17], [20, 17]].forEach(([x, y]) => object[y][x] = "brazier");
    object[17][3] = "rubble"; object[12][19] = "rubble";
    object[14][1] = "web"; object[8][20] = "web"; object[2][1] = "web"; object[2][20] = "web";

    return { name: "manor", w: MW, h: MH, ground, object, music: "manor", dark: true };
  }

  /* ---------------- MANOR ENTITIES ---------------- */
  W.manorEntities = function () {
    return [
      { type: "monster", id: "v_shadeA", mon: "shade", x: 8,  y: 15, dir: "down", alive: true },
      { type: "monster", id: "v_shadeB", mon: "shade", x: 13, y: 15, dir: "down", alive: true },
      { type: "monster", id: "v_brute",  mon: "brute", x: 10, y: 10, dir: "down", alive: true },
      { type: "monster", id: "v_hex",    mon: "hex",   x: 5,  y: 5,  dir: "down", alive: true },
      { type: "monster", id: "v_hexB",   mon: "hex",   x: 16, y: 5,  dir: "down", alive: true },
      { type: "monster", id: "vesper", mon: "vesper", x: 10, y: 3, dir: "down", alive: true, boss: true, vesper: true,
        wake: { x0: 1, y0: 1, x1: 20, y1: 6 } },      // stays on her throne until you enter the throne hall

      // caged kittens — free them all (each gives bonus coins)
      { type: "captive", id: "k_boots",   kind: "kBlue",   kname: "Boots",   kid: true, caged: true, x: 3,  y: 16, dir: "down" },
      { type: "captive", id: "k_patch",   kind: "kCalico", kname: "Patches", kid: true, caged: true, x: 18, y: 16, dir: "down" },
      { type: "captive", id: "k_mittens", kind: "kGrey",   kname: "Mittens", kid: true, caged: true, x: 6,  y: 11, dir: "down" },
      { type: "captive", id: "k_smol",    kind: "kCream",  kname: "Smol",    kid: true, caged: true, x: 15, y: 11, dir: "down" },
      { type: "captive", id: "k_pip",     kind: "kBlack",  kname: "Pip",     kid: true, caged: true, x: 3,  y: 4,  dir: "down" },
      { type: "captive", id: "chichi2", kind: "chichi", caged: true, final: true, x: 13, y: 2, dir: "down" },

      // gear + coin chests
      { type: "gear",  id: "g_claws",  gid: "claws",  x: 2,  y: 9 },
      { type: "gear",  id: "g_collar", gid: "collar", x: 19, y: 9 },
      { type: "gear",  id: "g_charm",  gid: "charm",  x: 19, y: 4 },
      { type: "chest", id: "c_m1", x: 2, y: 17, coins: 20 },
      { type: "chest", id: "c_m2", x: 19, y: 17, coins: 20 },

      { type: "sign", id: "v_plaque", x: 15, y: 15, text: [
        "A brass plaque, polished to a shine:",
        "\"MADAME VESPER \u2014 PATRONESS OF ALL KITTENS.",
        " Every stray belongs to the collection.\"",
        "...These poor cats are her TROPHIES." ] },
    ];
  };

  /* ---------------- EXTEND QUEST ---------------- */
  Object.assign(W.QUEST.steps, {
    tomBeaten:"Tom served a darker mistress. Madame Vesper stole Chi Chi away \u2014 enter the MANOR GATE to the east.",
    manor:    "Climb Vesper's manor. Free every caged kitten and reach her throne.",
    done:     "The Cat Lady is undone. Lead the kittens home. \u2665",
  });
  W.QUEST.order = ["start", "searched", "deduced", "fighting", "boss", "tomBeaten", "manor", "done"];

  /* ---------------- WARPS (manor warps live in world.js) ---------------- */

  /* ---------------- OPEN THE MANOR GATE (in the forest) ---------------- */
  W.openManorGate = function (G) {
    const f = G.maps.forest;
    // clear a path east of Tom's clearing and drop the dark gate at (26,9)
    f.ground[9][26] = "fdirt";
    f.object[9][26] = "dgate";
    f.object[8][26] = null; f.object[10][26] = null;
    f.object[9][25] = null;
  };

  /* ---------------- OPEN THE FOREST (remove the town log gate) ---------------- */
  W.openForestGate = function (G) {
    const ov = G.maps.overworld;
    ov.object[8][22] = null;        // the fallen log rolls aside
  };

  W.buildManor = buildManor;
})();
