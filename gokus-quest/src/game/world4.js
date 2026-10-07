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
  });
  Object.assign(W.MONSTERS, {
    wildcat:  { name: "Wildcat",     kind: "wild", hp: 34, atk: 8,  def: 2, touch: 7, speed: 0.8,  aggro: 52, coins: 14 },
    mosscat:  { name: "Moss Lurker", kind: "moss", hp: 44, atk: 9,  def: 3, touch: 8, speed: 0.6,  aggro: 44, coins: 18 },
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
  W.OAK_BARRIER = { map: "oak_roots", row: 4, x0: 1, x1: 14 };
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
        { type: "sign", id: "crosssign", x: 13, y: 2, text: ["A giant elder tree has fallen across the northern path.", "It's far too heavy to move alone. (The deep Elderwood lies beyond.)"] },
      ],
      ew_shrine: [
        { type: "npc", id: "mochi", kind: "dojo", villager: "dojo", x: 13, y: 7, dir: "left" },
      ],
      oak_roots: [
        { type: "monster", id: "o1", mon: "shade", x: 5, y: 8, dir: "right", alive: true },
        { type: "monster", id: "o2", mon: "mosscat", x: 11, y: 7, dir: "left", alive: true },
        { type: "switch", id: "lamp1", x: 2, y: 6, lit: 0 },
        { type: "switch", id: "lamp2", x: 13, y: 6, lit: 0 },
        { type: "switch", id: "lamp3", x: 8, y: 9, lit: 0 },
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
    // Chi Chi lives with Goku once she's home
    ent.home.push({ type: "npc", id: "chichi_home", kind: "chichi", requiresFlag: "chichiHome", x: 5, y: 3, dir: "down" });
    return ent;
  };

  // world state that follows from flags (called on init, load and after story beats)
  W.applyRegion = function (G) {
    if (G.flags.chapter3) G.maps.overworld.object[1][11] = null;           // the thorns withered
    if (G.flags.puzzles && G.flags.puzzles.oakLanterns) {
      const b = W.OAK_BARRIER;
      for (let x = b.x0; x <= b.x1; x++) G.maps[b.map].object[b.row][x] = null;
    }
  };

  /* ---------------- QUEST ---------------- */
  Object.assign(W.QUEST.steps, {
    ch3:    "Chapter III: The thorns north of town have withered. Explore the ELDERWOOD.",
    scroll: "Recover Master Mochi's stolen scroll from the HOLLOW OAK, by the shrine east of the Elderwood gate.",
    dojo:   "Master Mochi's dojo is open in town. The Elderwood still hides secrets... and a fallen giant blocks the north.",
  });
  W.QUEST.order = W.QUEST.order.concat(["ch3", "scroll", "dojo"]);
})();
