/* ============================================================
   world4.js  —  Chapter III, region 1: the ELDERWOOD (old forest).
   Unlocked when Vesper falls: the thorn hedge north of town
   withers. Rooms so far: gate, mossy crossing, shrine, and the
   first dungeon (Hollow Oak: roots + heart). Master Mochi the
   dojo cat gives the scroll quest; finishing it opens her dojo.
   Extends window.World.
   ============================================================ */
(function () {
  const W = window.World;
  const TS = 16;

  function grid(w, h, fill) {
    const g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill(fill));
    return g;
  }
  // a forest room with a tree border, mottled grass and openings (gaps in the border)
  function forestRoom(name, MW, MH, gaps, seed) {
    const ground = grid(MW, MH, "fgrass");
    const object = grid(MW, MH, null);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++)
      if ((x * 5 + y * (seed || 7)) % 6 === 0) ground[y][x] = "fgrass2";
    for (let x = 0; x < MW; x++) { object[0][x] = "ftree"; object[MH - 1][x] = "ftree"; }
    for (let y = 0; y < MH; y++) { object[y][0] = "ftree"; object[y][MW - 1] = "ftree"; }
    for (const [x, y] of gaps) { object[y][x] = null; ground[y][x] = "fdirt"; }
    return { name, w: MW, h: MH, ground, object, music: "forest" };
  }
  function path(map, x0, y0, x1, y1) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { map.ground[y][x] = "fdirt"; map.object[y][x] = null; }
  }
  function scatter(map, list, tile) {
    for (const [x, y] of list) if (map.ground[y][x] !== "fdirt" && map.ground[y][x] !== "water" && !map.object[y][x]) map.object[y][x] = tile;
  }

  /* ---------------- new cats ---------------- */
  Object.assign(window.Sprites.CAT_PALETTES, {
    wild: { O:"#2a2016", B:"#a07a4a", S:"#6e5232", E:"#b8e04a", W:"#fff", I:"#d39bb0", C:"#c9a46a" },
    moss: { O:"#16241a", B:"#5f7f4a", S:"#3f5a30", E:"#ffd36a", W:"#eaffd0", I:"#bfe07a", C:"#8aa86a" },
    fang: { O:"#1a1410", B:"#5a4a3a", S:"#3a2e24", E:"#ff5a3a", W:"#fff", I:"#e0908f", C:"#8a7a6a" },
    dojo: { O:"#2a2430", B:"#8f8a96", S:"#6a6572", E:"#3aa0a8", W:"#fff", I:"#e0908f", C:"#d8504f" },
    lost: { O:"#5a3318", B:"#f5c98a", S:"#d9a25e", E:"#5b9e57", W:"#fff", I:"#e0908f", C:"#fff0d6" },
    wildking: { O:"#1a120c", B:"#8a5a2c", S:"#5a3a1c", E:"#ffd23a", W:"#fff", I:"#e0908f", C:"#d8a050" },
  });
  Object.assign(W.MONSTERS, {
    wildcat:  { name: "Wildcat",     kind: "wild", hp: 34, atk: 8,  def: 2, touch: 7, speed: 0.8,  aggro: 52, coins: 14 },
    mosscat:  { name: "Moss Lurker", kind: "moss", hp: 44, atk: 9,  def: 3, touch: 8, speed: 0.6,  aggro: 44, coins: 18 },
    // Elderwood's ruler: huge, territorial, short-fused (combat.js: anger + roars)
    thornmane: { name: "Thornmane", kind: "wildking", hp: 260, atk: 13, def: 5, touch: 11, speed: 0.9, aggro: 170, coins: 120,
                 big: true, huge: true, boss: true, wildking: true },
    fang:     { name: "Old Fang",    kind: "fang", hp: 140, atk: 12, def: 4, touch: 10, speed: 0.75, aggro: 120, coins: 60, big: true, boss: true },
  });

  /* ---------------- VILLAGER: Master Mochi (dojo) ---------------- */
  W.VILLAGERS.dojo = { name: "Master Mochi", title: "Mochi's Dojo", kind: "dojo", lines: [] };

  /* ---------------- ROOMS ---------------- */
  // 1. Elderwood gate: entrance from town (south), north -> crossing, east -> shrine
  W.buildEwGate = function () {
    const m = forestRoom("ew_gate", 20, 14, [[10, 13], [10, 0], [19, 7]], 7);
    path(m, 10, 1, 10, 12); path(m, 11, 7, 18, 7);
    scatter(m, [[3, 3], [6, 2], [14, 3], [16, 5], [4, 9], [7, 11], [14, 10], [17, 11], [2, 6], [13, 2]], "ftree");
    scatter(m, [[5, 5], [8, 4], [13, 5], [6, 9], [15, 9], [12, 11], [3, 11]], "fbush");
    m.object[12][12] = "sign"; m.object[4][4] = "stump"; m.object[10][16] = "fflower";
    return m;
  };
  // 2. Mossy crossing: river with a bridge; a lost kitten hides in the north-west corner
  W.buildEwCrossing = function () {
    const m = forestRoom("ew_crossing", 20, 14, [[10, 13], [10, 0]], 5);
    for (let x = 1; x < 19; x++) { m.ground[6][x] = "water"; m.ground[7][x] = "water"; }
    path(m, 10, 1, 10, 12);                               // the bridge crosses the river at x=10
    // the north is blocked by a fallen giant tree (the rest of the Elderwood lies beyond)
    m.object[1][9] = "flog"; m.object[1][10] = "flog"; m.object[1][11] = "flog";
    // secret: a hedge wall with one gap hides the north-west nook
    for (let y = 1; y <= 4; y++) m.object[y][5] = "fbush";
    for (let x = 1; x <= 5; x++) m.object[4][x] = "fbush";
    m.object[2][5] = null;                                // the gap
    scatter(m, [[14, 2], [16, 4], [12, 3], [7, 3], [3, 10], [6, 11], [14, 10], [17, 9], [15, 12]], "ftree");
    scatter(m, [[8, 9], [12, 10], [4, 8], [16, 11]], "fbush");
    m.object[2][13] = "sign"; m.object[10][7] = "fflower"; m.object[9][15] = "stump";
    return m;
  };
  // 3. Shrine: Master Mochi sits by the old shrine; the Hollow Oak's door is to the north
  W.buildEwShrine = function () {
    const m = forestRoom("ew_shrine", 18, 12, [[0, 7]], 3);
    path(m, 1, 7, 9, 7); path(m, 9, 3, 9, 7);
    for (let y = 5; y <= 9; y++) for (let x = 11; x <= 15; x++) m.ground[y][x] = "matground";
    // the Hollow Oak: a wall of giant trunks with a door in it
    for (let x = 5; x <= 13; x++) { m.object[1][x] = "ftree"; m.object[2][x] = "ftree"; }
    m.object[2][9] = "ddoor";
    m.object[6][15] = "pillar"; m.object[8][15] = "pillar";
    scatter(m, [[3, 3], [2, 10], [6, 10], [16, 3], [16, 10], [3, 5]], "ftree");
    scatter(m, [[5, 9], [12, 3], [14, 3]], "fflower");
    return m;
  };
  // 4. Hollow Oak, roots: light all three lanterns before they go out to lift the root barrier
  W.buildOakRoots = function () {
    const MW = 16, MH = 12;
    const ground = grid(MW, MH, "dstone");
    const object = grid(MW, MH, null);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if ((x * 3 + y * 5) % 7 === 0) ground[y][x] = "dstone2";
    for (let x = 0; x < MW; x++) { object[0][x] = "dwallTop"; object[MH - 1][x] = "dwall"; }
    for (let y = 0; y < MH; y++) { object[y][0] = "dwall"; object[y][MW - 1] = "dwall"; }
    object[MH - 1][8] = null; ground[MH - 1][8] = "dexit";      // back out to the shrine
    for (let x = 1; x < MW - 1; x++) object[4][x] = "flog";        // the root barrier
    object[0][8] = "ddoor";                                        // deeper, to the heart
    object[7][3] = "rubble"; object[9][12] = "web"; object[2][2] = "web";
    return { name: "oak_roots", w: MW, h: MH, ground, object, music: "manor", dark: true };
  };
  // puzzles: solving one sets G.flags.puzzles[id] and clears its barrier cells (applyRegion)
  //   timed: every switch of the group lit at the same time (they burn out)
  //   order: switches struck in the given order (a wrong one resets the group)
  //   clear: every enemy in the room defeated (an arena)
  W.PUZZLES = {
    oakLanterns: { map: "oak_roots", kind: "timed", barrier: { row: 4, x0: 1, x1: 14 },
                   msg: "All three lanterns blaze at once. The roots shudder... and pull back into the walls!" },
    gladeRunes:  { map: "ew_glade", kind: "order", order: ["rune_e", "rune_n", "rune_w"], barrier: { row: 2, x0: 9, x1: 11 },
                   msg: "East, north, west: the runes hum together. The thorn wall to the north crumbles to dust!" },
    denArena:    { map: "den_a", kind: "clear", barrier: { row: 3, x0: 1, x1: 14 },
                   msg: "The last of Thornmane's guards flees. The log barricade to his lair rolls aside." },
  };
  // 5. Hollow Oak, heart: Old Fang guards the scroll
  W.buildOakHeart = function () {
    const MW = 16, MH = 12;
    const ground = grid(MW, MH, "dstone2");
    const object = grid(MW, MH, null);
    for (let x = 0; x < MW; x++) { object[0][x] = "dwallTop"; object[MH - 1][x] = "dwall"; }
    for (let y = 0; y < MH; y++) { object[y][0] = "dwall"; object[y][MW - 1] = "dwall"; }
    object[MH - 1][8] = null; ground[MH - 1][8] = "dexit";
    for (let y = 2; y <= 8; y++) for (let x = 4; x <= 11; x++) ground[y][x] = "fdirt";
    [[3, 2], [12, 2], [3, 8], [12, 8]].forEach(([x, y]) => object[y][x] = "pillar");
    object[1][7] = "torch"; object[1][9] = "torch";
    return { name: "oak_heart", w: MW, h: MH, ground, object, music: "manor", dark: true };
  };

  // 6. Sunlit glade (past the fallen giant): rune puzzle seals the way north
  W.buildEwGlade = function () {
    const m = forestRoom("ew_glade", 20, 14, [[10, 13], [0, 7], [10, 0]], 4);
    path(m, 10, 1, 10, 12); path(m, 1, 7, 9, 7);
    for (let x = 9; x <= 11; x++) m.object[2][x] = "fbush";   // the thorn wall (rune puzzle)
    for (let y = 9; y <= 11; y++) for (let x = 14; x <= 16; x++) m.ground[y][x] = "water";
    scatter(m, [[3, 3], [6, 2], [15, 2], [17, 4], [3, 11], [7, 11], [18, 10], [13, 12]], "ftree");
    scatter(m, [[4, 5], [16, 7], [12, 9]], "fbush");
    m.object[10][8] = "sign"; m.object[4][15] = "fflower"; m.object[5][3] = "fflower";
    return m;
  };
  // 7. Thornmaze: hedge maze, a lost kitten in the far corner
  const MAZE = [
    "####################",
    "#....b....b.......K#",
    "#.bbb.bbb.b.bbbbb.b#",
    "#.b.....b.b.....b..#",
    "#.b.bbb.b.bbbbb.bbb#",
    "#...b...b.....b...b#",
    "#bbbb.bbbbbbb.bbb.b#",
    "#.....b.....b...b...",
    "#.bbbbb.bbb.bbb.b.b#",
    "#.b.....b.....b.b.b#",
    "#.b.bbbbb.bbbbb.b.b#",
    "#...b.......C...b..#",
    "#bb...bbbbbbbbb...b#",
    "####################",
  ];
  W.buildEwThorn = function () {
    const m = forestRoom("ew_thorn", 20, 14, [[19, 7]], 6);
    for (let y = 0; y < 14; y++) for (let x = 0; x < 20; x++) {
      const c = MAZE[y][x];
      m.object[y][x] = c === "#" ? "ftree" : c === "b" ? "fbush" : null;
      if (c === "." || c === "K" || c === "C") m.ground[y][x] = "fdirt";       // trodden paths show the maze
    }
    m.ground[7][19] = "fdirt";
    return m;
  };
  // 8. Overlook: rocky ridge before the den; Thornmane's guards keep a kitten caged here
  W.buildEwOverlook = function () {
    const m = forestRoom("ew_overlook", 20, 14, [[10, 13]], 2);
    path(m, 10, 3, 10, 12); path(m, 4, 8, 10, 8);
    for (let x = 6; x <= 14; x++) { m.object[1][x] = "ftree"; m.object[2][x] = "ftree"; }
    m.object[2][10] = "ddoor";                                   // the den
    scatter(m, [[2, 3], [16, 3], [17, 6], [2, 11], [6, 11], [15, 11], [13, 9]], "ftree");
    scatter(m, [[3, 6], [15, 5], [7, 5], [16, 9]], "stump");
    m.object[10][12] = "sign";
    return m;
  };
  // 9. Kingsroot den, outer hall: an arena (beat every guard to move the barricade)
  function denRoom(name, MW, MH, seed) {
    const ground = grid(MW, MH, "fdirt");
    const object = grid(MW, MH, null);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if ((x * 7 + y * seed) % 9 === 0) ground[y][x] = "fgrass2";
    for (let x = 0; x < MW; x++) { object[0][x] = "ftree"; object[MH - 1][x] = "ftree"; }
    for (let y = 0; y < MH; y++) { object[y][0] = "ftree"; object[y][MW - 1] = "ftree"; }
    return { name, w: MW, h: MH, ground, object, music: "manor", dark: true };
  }
  W.buildDenA = function () {
    const m = denRoom("den_a", 16, 12, 3);
    m.object[11][8] = null;                                      // back out to the overlook
    m.object[0][8] = "farch";                                    // deeper, to the lair
    for (let x = 1; x < 15; x++) m.object[3][x] = "flog";         // the barricade
    [[3, 6], [12, 6], [5, 9], [10, 9]].forEach(([x, y]) => m.object[y][x] = "stump");
    m.object[2][2] = "web";
    return m;
  };
  // 10. Kingsroot den, the lair: Thornmane
  W.buildDenB = function () {
    const m = denRoom("den_b", 18, 14, 5);
    m.object[13][9] = null;
    [[3, 3], [14, 3], [3, 10], [14, 10]].forEach(([x, y]) => m.object[y][x] = "stump");
    m.object[1][8] = "brazier"; m.object[1][10] = "brazier";
    return m;
  };

  W.elderwoodEntities = function () {
    return {
      ew_gate: [
        { type: "monster", id: "e1", mon: "wildcat", x: 6, y: 7, dir: "right", alive: true },
        { type: "monster", id: "e2", mon: "wildcat", x: 14, y: 4, dir: "down", alive: true },
        { type: "monster", id: "e3", mon: "mosscat", x: 15, y: 8, dir: "left", alive: true },
        { type: "chest", id: "c_ewgate", x: 2, y: 2, coins: 22 },
        { type: "sign", id: "ewsign", x: 12, y: 12, text: ["Carved into an ancient stone:", "\"THE ELDERWOOD. Mind the old ones. → SHRINE east.\""] },
      ],
      ew_crossing: [
        { type: "monster", id: "e4", mon: "mosscat", x: 6, y: 10, dir: "right", alive: true },
        { type: "monster", id: "e5", mon: "wildcat", x: 14, y: 3, dir: "left", alive: true },
        { type: "monster", id: "e6", mon: "wildcat", x: 13, y: 10, dir: "left", alive: true },
        { type: "captive", id: "kit_ew1", kind: "lost", kname: "Pebble", lostKitty: true, caged: false, x: 2, y: 2, dir: "down" },
        { type: "gear", id: "g_crossing", gid: null, x: 17, y: 11 },
        { type: "sign", id: "crosssign", x: 13, y: 2, text: ["A giant elder tree has fallen across the northern path.", "Claw marks all over it... as if something HUGE pushed it there on purpose."] },
        { type: "obstacle", id: "elderlog", x: 10, y: 1 },
      ],
      ew_glade: [
        { type: "monster", id: "e7", mon: "wildcat", x: 5, y: 10, dir: "right", alive: true },
        { type: "monster", id: "e8", mon: "wildcat", x: 15, y: 5, dir: "left", alive: true },
        { type: "switch", id: "rune_e", group: "gladeRunes", look: "rune", x: 15, y: 6, lit: 0 },
        { type: "switch", id: "rune_n", group: "gladeRunes", look: "rune", x: 12, y: 4, lit: 0 },
        { type: "switch", id: "rune_w", group: "gladeRunes", look: "rune", x: 6, y: 5, lit: 0 },
        { type: "sign", id: "runesign", x: 8, y: 10, text: ["Three standing stones, carved with suns. Beneath them:",
          "\"The sun wakes in the EAST, climbs to the NORTH, and sleeps in the WEST.\""] },
      ],
      ew_thorn: [
        { type: "monster", id: "e9", mon: "wildcat", x: 7, y: 7, dir: "left", alive: true },
        { type: "monster", id: "e10", mon: "mosscat", x: 3, y: 9, dir: "up", alive: true },
        { type: "monster", id: "e11", mon: "wildcat", x: 13, y: 3, dir: "left", alive: true },
        { type: "captive", id: "kit_ew2", kind: "lost", kname: "Sprout", lostKitty: true, caged: false, x: 18, y: 1, dir: "down" },
        { type: "chest", id: "c_thorn", x: 12, y: 11, coins: 35 },
      ],
      ew_overlook: [
        { type: "monster", id: "e12", mon: "mosscat", x: 6, y: 6, dir: "down", alive: true },
        { type: "monster", id: "e13", mon: "wildcat", x: 14, y: 7, dir: "left", alive: true },
        { type: "monster", id: "e14", mon: "wildcat", x: 7, y: 10, dir: "up", alive: true },
        { type: "captive", id: "kit_ew3", kind: "lost", kname: "Fern", lostKitty: true, caged: true, x: 4, y: 4, dir: "down" },
        { type: "gear", id: "g_overlook", gid: null, x: 17, y: 11 },
        { type: "sign", id: "denwarn", x: 12, y: 10, text: ["Claw marks on every tree: \"MINE. MINE. ALL OF IT, MINE.\"",
          "It's signed with a paw print the size of a dinner plate."] },
      ],
      den_a: [
        { type: "monster", id: "d1", mon: "wildcat", x: 4, y: 7, dir: "right", alive: true },
        { type: "monster", id: "d2", mon: "wildcat", x: 11, y: 7, dir: "left", alive: true },
        { type: "monster", id: "d3", mon: "mosscat", x: 7, y: 5, dir: "down", alive: true },
        { type: "monster", id: "d4", mon: "mosscat", x: 9, y: 8, dir: "up", alive: true },
      ],
      den_b: [
        { type: "monster", id: "thornmane", mon: "thornmane", x: 8, y: 4, dir: "down", alive: true, boss: true,
          wake: { x0: 1, y0: 1, x1: 16, y1: 9 } },
      ],
      ew_shrine: [
        { type: "npc", id: "mochi", kind: "dojo", villager: "dojo", x: 13, y: 7, dir: "left" },
      ],
      oak_roots: [
        { type: "monster", id: "o1", mon: "shade", x: 5, y: 8, dir: "right", alive: true },
        { type: "monster", id: "o2", mon: "mosscat", x: 11, y: 7, dir: "left", alive: true },
        { type: "switch", id: "lamp1", group: "oakLanterns", x: 2, y: 6, lit: 0 },
        { type: "switch", id: "lamp2", group: "oakLanterns", x: 13, y: 6, lit: 0 },
        { type: "switch", id: "lamp3", group: "oakLanterns", x: 8, y: 9, lit: 0 },
        { type: "sign", id: "rootsign", x: 6, y: 10, text: ["Roots as thick as walls block the way up.", "Three old lanterns hang here, cold and dark. (Swipe them!)"] },
        { type: "monster", id: "o3", mon: "wildcat", x: 7, y: 2, dir: "down", alive: true },
      ],
      oak_heart: [
        { type: "monster", id: "fang", mon: "fang", x: 8, y: 3, dir: "down", alive: true, boss: true, drop: "scroll",
          wake: { x0: 1, y0: 1, x1: 14, y1: 8 },
          intro: ["A huge scarred tomcat uncurls in the dark, a scroll clamped in his teeth.",
                  "\"Mrrrh. Another little hero. The old cat's scroll stays with ME.\""] },
      ],
    };
  };

  /* ---------------- ROUTES ---------------- */
  W.WARPS.push(
    { map: "overworld", x: 11, y: 0, toMap: "ew_gate", toX: 10, toY: 12, toDir: "up" },
    { map: "ew_gate", x: 10, y: 13, toMap: "overworld", toX: 11, toY: 1, toDir: "down" },
    { map: "ew_gate", x: 10, y: 0, toMap: "ew_crossing", toX: 10, toY: 12, toDir: "up" },
    { map: "ew_crossing", x: 10, y: 13, toMap: "ew_gate", toX: 10, toY: 1, toDir: "down" },
    { map: "ew_gate", x: 19, y: 7, toMap: "ew_shrine", toX: 1, toY: 7, toDir: "right" },
    { map: "ew_shrine", x: 0, y: 7, toMap: "ew_gate", toX: 18, toY: 7, toDir: "left" },
    { map: "ew_shrine", x: 9, y: 2, toMap: "oak_roots", toX: 8, toY: 10, toDir: "up" },
    { map: "oak_roots", x: 8, y: 11, toMap: "ew_shrine", toX: 9, toY: 3, toDir: "down" },
    { map: "oak_roots", x: 8, y: 0, toMap: "oak_heart", toX: 8, toY: 10, toDir: "up" },
    { map: "oak_heart", x: 8, y: 11, toMap: "oak_roots", toX: 8, toY: 1, toDir: "down" },
    { map: "ew_crossing", x: 10, y: 0, toMap: "ew_glade", toX: 10, toY: 12, toDir: "up" },
    { map: "ew_glade", x: 10, y: 13, toMap: "ew_crossing", toX: 10, toY: 1, toDir: "down" },
    { map: "ew_glade", x: 0, y: 7, toMap: "ew_thorn", toX: 18, toY: 7, toDir: "left" },
    { map: "ew_thorn", x: 19, y: 7, toMap: "ew_glade", toX: 1, toY: 7, toDir: "right" },
    { map: "ew_glade", x: 10, y: 0, toMap: "ew_overlook", toX: 10, toY: 12, toDir: "up" },
    { map: "ew_overlook", x: 10, y: 13, toMap: "ew_glade", toX: 10, toY: 1, toDir: "down" },
    { map: "ew_overlook", x: 10, y: 2, toMap: "den_a", toX: 8, toY: 10, toDir: "up" },
    { map: "den_a", x: 8, y: 11, toMap: "ew_overlook", toX: 10, toY: 3, toDir: "down" },
    { map: "den_a", x: 8, y: 0, toMap: "den_b", toX: 9, toY: 12, toDir: "up" },
    { map: "den_b", x: 9, y: 13, toMap: "den_a", toX: 8, toY: 1, toDir: "down" },
  );

  // town: a path north to the Elderwood, sealed by a thorn hedge until Vesper falls
  const buildOverworld = W.buildOverworld;
  W.buildOverworld = function () {
    const m = buildOverworld();
    for (let y = 1; y <= 7; y++) m.ground[y][11] = "path";
    m.object[0][11] = "farch";
    m.object[1][11] = "fbush";                         // the thorn hedge
    m.object[1][12] = "sign";
    return m;
  };
  const makeEntities = W.makeEntities;
  W.makeEntities = function () {
    const ent = makeEntities();
    ent.overworld.push(
      { type: "sign", id: "northsign", x: 12, y: 1, text: ["An old wooden sign, half swallowed by thorns:", "\"NORTH: THE ELDERWOOD.\" Nobody has gone that way in years."] },
      { type: "shop", id: "stall_dojo", shopId: "dojo", style: "dojo", owner: "dojo", requires: "dojo", x: 20, y: 11 },
    );
    ent.overworld.push({ type: "sign", id: "coastsign", requiresFlag: "ewKing", x: 12, y: 14,
      text: ["A brand-new sign, still smelling of fresh paint:", "\"SOUTH: the coast road to ZEELAND.\" A note below: \"Washed out by the storm. Hazel is on it!\""] });
    // Chi Chi lives with Goku once she's home
    ent.home.push({ type: "npc", id: "chichi_home", kind: "chichi", requiresFlag: "chichiHome", x: 5, y: 3, dir: "down" });
    return ent;
  };

  // world state that follows from flags (called on init, load and after story beats)
  W.applyRegion = function (G) {
    if (G.flags.chapter3) G.maps.overworld.object[1][11] = null;           // the thorns withered
    for (const id in W.PUZZLES) {
      if (!(G.flags.puzzles && G.flags.puzzles[id])) continue;
      const P = W.PUZZLES[id], b = P.barrier;
      for (let x = b.x0; x <= b.x1; x++) G.maps[P.map].object[b.row][x] = null;
    }
    if (G.flags.elderLog) for (let x = 9; x <= 11; x++) G.maps.ew_crossing.object[1][x] = null;
    if (G.flags.ewKing) G.maps.overworld.object[14][12] = "sign";       // the coast road sign appears
  };

  // the fallen giant in the mossy crossing: Mochi's technique splits it
  W.useObstacle = function (G, e) {
    if (e.id !== "elderlog") return;
    if (!G.villagers.dojo) {
      UI.showDialogue("Goku", ["The fallen giant won't budge. Not even a little.",
        "(Someone who knows a real fighting technique might know a way...)"]);
      return;
    }
    UI.showDialogue("Goku", ["Goku remembers Master Mochi's lesson: \"Strength is nothing. Focus is everything.\"",
      "He breathes in... and strikes the trunk with one perfect paw. CRACK!"], () => {
      G.flags.elderLog = true; W.applyRegion(G);
      G.fx.push({ kind: "flash", color: "#fff7df", t: 0, life: 18 });
      for (let i = 0; i < 6; i++) G.fx.push({ kind: "smoke", x: 150 + i * 6, y: 24, color: "#8a6a44", t: -i * 2, life: 30 });
      if (G.quest === "dojo") Engine.setQuest("deep");
      UI.showDialogue(null, ["The giant tree splits in two. The deep Elderwood lies open to the north!"]);
    });
  };

  /* ---------------- QUEST ---------------- */
  Object.assign(W.QUEST.steps, {
    ch3:    "Chapter III: The thorns north of town have withered. Explore the ELDERWOOD.",
    scroll: "Recover Master Mochi's stolen scroll from the HOLLOW OAK, by the shrine east of the Elderwood gate.",
    dojo:   "Master Mochi's dojo is open in town. Maybe her technique can split the fallen giant tree in the MOSSY CROSSING.",
    deep:   "The deep Elderwood is open. Somewhere north, the cat who claims it all has his DEN.",
    zeeland: "Thornmane is humbled. He spoke of ZEELAND, by the sea, south of town. (The next region is on its way!)",
  });
  W.QUEST.order = W.QUEST.order.concat(["ch3", "scroll", "dojo", "deep", "zeeland"]);
})();
