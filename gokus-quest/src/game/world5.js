/* ============================================================
   world5.js  —  Chapter III, region 2: ZEELAND (the coast).
   Unlocked by beating Thornmane: the coast road south of town.
   Tides: maps with `tidal: true` flood their "tideflat" tiles at
   high tide (engine.js); anyone caught out there washes back.
   Rooms: road, harbor (Biscuit the baker), dike, cove, flats,
   island, lighthouse (bells + Captain Gullbeard), sunken palace
   (shells + the Tide Queen). Extends window.World.
   ============================================================ */
(function () {
  const W = window.World;

  function grid(w, h, fill) {
    const g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill(fill));
    return g;
  }
  // a sandy room with a rocky border and openings in it
  function coastRoom(name, MW, MH, gaps, extra) {
    const ground = grid(MW, MH, "sand");
    const object = grid(MW, MH, null);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if ((x * 3 + y * 7) % 8 === 0) ground[y][x] = "sand2";
    for (let x = 0; x < MW; x++) { object[0][x] = "rock"; object[MH - 1][x] = "rock"; }
    for (let y = 0; y < MH; y++) { object[y][0] = "rock"; object[y][MW - 1] = "rock"; }
    for (const [x, y] of gaps) object[y][x] = null;
    return Object.assign({ name, w: MW, h: MH, ground, object, music: "field" }, extra || {});
  }
  function fill(map, x0, y0, x1, y1, layer, tile) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) map[layer][y][x] = tile;
  }
  function put(map, list, tile) { for (const [x, y] of list) map.object[y][x] = tile; }

  /* ---------------- cats of the coast ---------------- */
  Object.assign(window.Sprites.CAT_PALETTES, {
    crab:      { O:"#4a1a12", B:"#e0603a", S:"#a83a22", E:"#ffe08a", W:"#fff", I:"#f0a0a0", C:"#f08a5a" },
    gull:      { O:"#232833", B:"#9aa4b4", S:"#6a7484", E:"#f0b030", W:"#fff", I:"#e0a0a0", C:"#d8dde6" },
    gullbeard: { O:"#2a2a30", B:"#d8d8de", S:"#9a9aa6", E:"#f0b030", W:"#fff", I:"#e0a0a0", C:"#3a3a48" },
    tidequeen: { O:"#0f2a3a", B:"#5ab0c8", S:"#2f7a96", E:"#f6f0e0", W:"#fff", I:"#f0a0c0", C:"#e8f6fa" },
    baker:     { O:"#5a3a24", B:"#f6e7c4", S:"#e0c99a", E:"#5b9e57", W:"#fff", I:"#e0908f", C:"#fbf2da" },
    seakit:    { O:"#1f3a4a", B:"#9fd0e0", S:"#6fa8bc", E:"#ffcf3a", W:"#fff", I:"#f0a0c0", C:"#e8f6fa" },
  });
  Object.assign(W.MONSTERS, {
    crab:      { name: "Crabby Scrapper", kind: "crab", hp: 50, atk: 10, def: 5, touch: 9, speed: 0.55, aggro: 46, coins: 20 },
    gull:      { name: "Gullcat",         kind: "gull", hp: 38, atk: 10, def: 2, touch: 9, speed: 1.0,  aggro: 64, coins: 18 },
    gullbeard: { name: "Captain Gullbeard", kind: "gullbeard", hp: 180, atk: 13, def: 4, touch: 11, speed: 0.95, aggro: 140, coins: 80, big: true, boss: true },
    // the region boss: slow, but sends walls of water across her hall (combat.js)
    tidequeen: { name: "The Tide Queen", kind: "tidequeen", hp: 340, atk: 14, def: 6, touch: 12, speed: 0.6, aggro: 220, coins: 150,
                 big: true, huge: true, boss: true, tidequeen: true },
  });

  /* ---------------- VILLAGER: Biscuit the baker ---------------- */
  W.VILLAGERS.baker = { name: "Biscuit", title: "Biscuit's Bakery", kind: "baker",
    lines: ["*the crabs scatter, and the cage door creaks open*",
            "\"Oh, you lovely, LOVELY cat! The Tide Queen's crabs grabbed me for her kitchens. Fish pies for a queen, all day!\"",
            "\"I'm Biscuit. I'll bake for YOUR town instead. Come by my BAKERY for treats!\""] };

  /* ---------------- ROOMS ---------------- */
  // 1. coast road (from town): dunes, the first gulls
  W.buildZlRoad = function () {
    const m = coastRoom("zl_road", 20, 14, [[10, 0], [10, 13], [19, 7]]);
    fill(m, 10, 0, 10, 13, "ground", "path"); fill(m, 11, 7, 19, 7, "ground", "path");
    put(m, [[3, 3], [6, 2], [15, 2], [17, 4], [3, 10], [6, 11], [15, 11], [17, 9]], "bush");
    put(m, [[4, 6], [14, 10], [16, 5]], "rock");
    m.object[2][12] = "sign";
    return m;
  };
  // 2. harbor: a pier out over the water; Biscuit is caged at the end
  W.buildZlHarbor = function () {
    const m = coastRoom("zl_harbor", 20, 14, [[0, 7]]);
    fill(m, 12, 1, 18, 12, "ground", "water");
    fill(m, 6, 7, 17, 7, "ground", "pier"); fill(m, 15, 3, 15, 11, "ground", "pier");
    fill(m, 1, 7, 5, 7, "ground", "path");
    m.object[4][13] = "boat"; m.object[10][17] = "boat"; m.object[2][17] = "boat";
    put(m, [[3, 3], [8, 2], [4, 11], [9, 12]], "rock");
    m.object[6][3] = "sign"; m.object[10][6] = "crate"; m.object[4][9] = "barrel";
    return m;
  };
  // 3. dike: sea to the west, polder to the east; a tidal sandbar leads to a hidden cove
  W.buildZlDike = function () {
    const m = coastRoom("zl_dike", 20, 14, [[10, 0], [10, 13], [0, 10]], { tidal: true, tideSafe: [9, 10] });
    fill(m, 1, 1, 6, 12, "ground", "water");
    fill(m, 1, 10, 6, 10, "ground", "tideflat");                 // the secret sandbar
    fill(m, 7, 1, 7, 12, "object", "seawall"); m.object[10][7] = null;
    fill(m, 8, 0, 11, 13, "ground", "path");
    fill(m, 12, 1, 18, 12, "ground", "grass");
    for (let y = 2; y <= 11; y += 3) fill(m, 13, y, 17, y, "object", "fence");
    m.object[3][14] = null; m.object[9][16] = null;
    m.object[6][12] = "sign";
    return m;
  };
  // 4. hidden cove (reached over the sandbar at low tide)
  W.buildZlCove = function () {
    const m = coastRoom("zl_cove", 16, 12, [[15, 6]]);
    fill(m, 1, 1, 5, 10, "ground", "water"); fill(m, 6, 9, 12, 10, "ground", "water");
    put(m, [[7, 3], [9, 2], [11, 4], [8, 7], [13, 9]], "rock");
    m.object[2][7] = null;
    return m;
  };
  // 5. tidal flats: walk out at low tide; the lighthouse stands on the north-east rocks
  W.buildZlFlats = function () {
    const m = coastRoom("zl_flats", 20, 14, [[10, 0], [10, 13]], { tidal: true, tideSafe: [10, 3] });
    fill(m, 1, 6, 18, 12, "ground", "tideflat");
    fill(m, 14, 0, 18, 2, "object", "lighthouse"); m.object[2][16] = "ddoor";
    put(m, [[3, 2], [6, 4], [12, 3]], "rock");
    put(m, [[4, 8], [15, 9], [9, 11]], "rock");                    // rocks out on the flats
    m.object[4][8] = "sign";
    return m;
  };
  // 6. island: a kitten, a chest, and the sealed gate of the sunken palace
  W.buildZlIsland = function () {
    const m = coastRoom("zl_island", 16, 12, [[8, 11]]);
    fill(m, 1, 1, 14, 10, "ground", "sand");
    fill(m, 1, 9, 4, 10, "ground", "water"); fill(m, 12, 1, 14, 3, "ground", "water");
    fill(m, 5, 1, 11, 2, "object", "seawall"); m.object[2][8] = "pgate";
    put(m, [[3, 4], [12, 7], [6, 7]], "rock");
    return m;
  };
  // 7-8. lighthouse: bells (order puzzle) then Captain Gullbeard at the top
  function towerRoom(name) {
    const MW = 14, MH = 12;
    const ground = grid(MW, MH, "pier"), object = grid(MW, MH, null);
    for (let x = 0; x < MW; x++) { object[0][x] = "lighthouse"; object[MH - 1][x] = "lighthouse"; }
    for (let y = 0; y < MH; y++) { object[y][0] = "lighthouse"; object[y][MW - 1] = "lighthouse"; }
    object[MH - 1][7] = null; ground[MH - 1][7] = "dexit";
    return { name, w: MW, h: MH, ground, object, music: "field" };
  }
  W.buildLhA = function () {
    const m = towerRoom("lh_a");
    m.object[0][7] = "ddoor";
    fill(m, 1, 3, 12, 3, "object", "seawall");                    // stairs sealed by a gate
    put(m, [[1, 10], [12, 10]], "barrel"); m.object[9][2] = "sign";
    return m;
  };
  W.buildLhB = function () {
    const m = towerRoom("lh_b");
    m.object[1][7] = "brazier";                                   // the great lamp (dark)
    put(m, [[2, 2], [11, 2], [2, 8], [11, 8]], "crate");
    return m;
  };
  // 9-10. sunken palace: tidal shell room, then the Tide Queen's hall
  function palaceRoom(name, MW, MH, extra) {
    const ground = grid(MW, MH, "pfloor"), object = grid(MW, MH, null);
    for (let x = 0; x < MW; x++) { object[0][x] = "coral"; object[MH - 1][x] = "coral"; }
    for (let y = 0; y < MH; y++) { object[y][0] = "coral"; object[y][MW - 1] = "coral"; }
    object[MH - 1][9] = null; ground[MH - 1][9] = "dexit";
    return Object.assign({ name, w: MW, h: MH, ground, object, music: "manor" }, extra || {});
  }
  W.buildPalaceA = function () {
    const m = palaceRoom("palace_a", 18, 12, { tidal: true, tideSafe: [9, 10] });
    fill(m, 1, 4, 16, 8, "ground", "tideflat");
    fill(m, 1, 2, 16, 2, "object", "coral");                      // the coral gate
    m.object[0][9] = "ddoor";
    put(m, [[4, 10], [14, 10]], "coral");
    return m;
  };
  W.buildPalaceB = function () {
    const m = palaceRoom("palace_b", 18, 14, { dark: true });
    put(m, [[3, 3], [14, 3], [3, 10], [14, 10]], "coral");
    m.object[1][8] = "brazier"; m.object[1][10] = "brazier";
    return m;
  };

  W.zeelandEntities = function () {
    return {
      zl_road: [
        { type: "monster", id: "z1", mon: "gull", x: 5, y: 4, dir: "right", alive: true },
        { type: "monster", id: "z2", mon: "gull", x: 15, y: 10, dir: "left", alive: true },
        { type: "monster", id: "z3", mon: "crab", x: 14, y: 4, dir: "down", alive: true },
        { type: "sign", id: "zlsign", x: 12, y: 2, text: ["A salt-crusted sign:", "\"ZEELAND. By order of the TIDE QUEEN, all fish belong to Her Majesty.\"",
          "Someone has scrawled underneath: \"We're STARVING.\""] },
      ],
      zl_harbor: [
        { type: "monster", id: "z4", mon: "crab", x: 9, y: 7, dir: "left", alive: true },
        { type: "monster", id: "z5", mon: "crab", x: 15, y: 5, dir: "down", alive: true },
        { type: "monster", id: "z6", mon: "crab", x: 5, y: 10, dir: "up", alive: true },
        { type: "captive", id: "v_baker", kind: "baker", kname: "Biscuit", villager: "baker", caged: true, x: 17, y: 7, dir: "left" },
        { type: "chest", id: "c_harbor", x: 2, y: 12, coins: 30 },
        { type: "sign", id: "harborsign", x: 3, y: 6, text: ["\"HARBOR CLOSED. All catches go to the palace.\"", "Somewhere out on the pier, someone is crying for help."] },
      ],
      zl_dike: [
        { type: "monster", id: "z7", mon: "crab", x: 9, y: 6, dir: "down", alive: true },
        { type: "monster", id: "z8", mon: "gull", x: 15, y: 7, dir: "left", alive: true },
        { type: "sign", id: "dikesign", x: 12, y: 6, text: ["Painted on the dike wall:", "\"At LOW TIDE a sandbar shows to the west. Don't get caught when the water comes back!\""] },
      ],
      zl_cove: [
        { type: "monster", id: "z9", mon: "crab", x: 10, y: 6, dir: "left", alive: true },
        { type: "captive", id: "kit_zl1", kind: "seakit", kname: "Pearl", lostKitty: true, caged: false, x: 7, y: 2, dir: "down" },
        { type: "chest", id: "c_cove", x: 13, y: 2, coins: 40 },
      ],
      zl_flats: [
        { type: "monster", id: "z10", mon: "gull", x: 5, y: 3, dir: "right", alive: true },
        { type: "monster", id: "z11", mon: "crab", x: 12, y: 9, dir: "left", alive: true },
        { type: "monster", id: "z12", mon: "gull", x: 7, y: 10, dir: "up", alive: true },
        { type: "sign", id: "flatsign", x: 8, y: 4, text: ["\"THE FLATS. Cross to the island at LOW TIDE only.\"", "\"The old lighthouse keeper kept the palace key. He left it at the top of the tower.\""] },
      ],
      zl_island: [
        { type: "monster", id: "z13", mon: "crab", x: 10, y: 6, dir: "left", alive: true },
        { type: "captive", id: "kit_zl2", kind: "seakit", kname: "Splash", lostKitty: true, caged: false, x: 2, y: 4, dir: "down" },
        { type: "gear", id: "g_island", gid: null, x: 13, y: 9 },
      ],
      lh_a: [
        { type: "monster", id: "l1", mon: "gull", x: 4, y: 7, dir: "right", alive: true },
        { type: "monster", id: "l2", mon: "gull", x: 10, y: 8, dir: "left", alive: true },
        { type: "switch", id: "bell_high", group: "lhBells", look: "bell", pitch: 3, x: 3, y: 6, lit: 0 },
        { type: "switch", id: "bell_low",  group: "lhBells", look: "bell", pitch: 1, x: 7, y: 6, lit: 0 },
        { type: "switch", id: "bell_mid",  group: "lhBells", look: "bell", pitch: 2, x: 11, y: 6, lit: 0 },
        { type: "sign", id: "bellsign", x: 2, y: 9, text: ["The keeper's note, nailed to the wall:",
          "\"Ring them as the tide rises: the SMALL bell first, then the MIDDLE one, then the BIG one.\""] },
      ],
      lh_b: [
        { type: "monster", id: "gullbeard", mon: "gullbeard", x: 6, y: 3, dir: "down", alive: true, boss: true, drop: "tideKey", dropQuest: "zl3",
          dropText: ["Captain Gullbeard tumbles over, squawking. A heavy shell-shaped key clatters to the floor.",
                     "You got the TIDE KEY! It must open the sunken palace on the island."],
          wake: { x0: 1, y0: 1, x1: 12, y1: 7 },
          intro: ["A scruffy gull-cat in a captain's hat spreads his wings across the lamp room.",
                  "\"SQUAWK! The keeper's key? It's the QUEEN'S key now, matey. Come and take it, if ye dare!\""] },
      ],
      palace_a: [
        { type: "monster", id: "p1", mon: "crab", x: 5, y: 9, dir: "right", alive: true },
        { type: "monster", id: "p2", mon: "crab", x: 13, y: 9, dir: "left", alive: true },
        { type: "switch", id: "shell1", group: "palaceShells", look: "shell", x: 3, y: 5, lit: 0 },
        { type: "switch", id: "shell2", group: "palaceShells", look: "shell", x: 14, y: 5, lit: 0 },
        { type: "switch", id: "shell3", group: "palaceShells", look: "shell", x: 9, y: 7, lit: 0 },
        { type: "captive", id: "kit_zl3", kind: "seakit", kname: "Minnow", lostKitty: true, caged: true, x: 16, y: 10, dir: "left" },
      ],
      palace_b: [
        { type: "monster", id: "tidequeen", mon: "tidequeen", x: 8, y: 3, dir: "down", alive: true, boss: true,
          wake: { x0: 1, y0: 1, x1: 16, y1: 10 } },
      ],
    };
  };

  /* ---------------- puzzles ---------------- */
  Object.assign(W.PUZZLES, {
    lhBells: { map: "lh_a", kind: "order", order: ["bell_low", "bell_mid", "bell_high"], barrier: { row: 3, x0: 1, x1: 12 },
               msg: "DING... DONG... BONG! The gate to the stairs swings open.",
               hint: ["A gate blocks the stairs. Three bells hang from the beams.", "(The keeper left a note on the wall. Ring the bells in the right order with SPACE.)"] },
    palaceShells: { map: "palace_a", kind: "timed", barrier: { row: 2, x0: 1, x1: 16 },
               msg: "All three shells glow at once. The coral gate shrinks back like a startled anemone!",
               hint: ["A coral gate. Three giant shells lie out on the flats.",
                      "(Swipe all three open at the same time. They're out on the flats, so go at LOW TIDE!)"] },
  });

  /* ---------------- routes ---------------- */
  W.WARPS.push(
    { map: "overworld", x: 13, y: 15, toMap: "zl_road", toX: 10, toY: 1, toDir: "down" },
    { map: "zl_road", x: 10, y: 0, toMap: "overworld", toX: 13, toY: 14, toDir: "up" },
    { map: "zl_road", x: 19, y: 7, toMap: "zl_harbor", toX: 1, toY: 7, toDir: "right" },
    { map: "zl_harbor", x: 0, y: 7, toMap: "zl_road", toX: 18, toY: 7, toDir: "left" },
    { map: "zl_road", x: 10, y: 13, toMap: "zl_dike", toX: 10, toY: 1, toDir: "down" },
    { map: "zl_dike", x: 10, y: 0, toMap: "zl_road", toX: 10, toY: 12, toDir: "up" },
    { map: "zl_dike", x: 0, y: 10, toMap: "zl_cove", toX: 14, toY: 6, toDir: "left" },
    { map: "zl_cove", x: 15, y: 6, toMap: "zl_dike", toX: 1, toY: 10, toDir: "right" },
    { map: "zl_dike", x: 10, y: 13, toMap: "zl_flats", toX: 10, toY: 1, toDir: "down" },
    { map: "zl_flats", x: 10, y: 0, toMap: "zl_dike", toX: 10, toY: 12, toDir: "up" },
    { map: "zl_flats", x: 10, y: 13, toMap: "zl_island", toX: 8, toY: 10, toDir: "up" },
    { map: "zl_island", x: 8, y: 11, toMap: "zl_flats", toX: 10, toY: 12, toDir: "down" },
    { map: "zl_flats", x: 16, y: 2, toMap: "lh_a", toX: 7, toY: 10, toDir: "up" },
    { map: "lh_a", x: 7, y: 11, toMap: "zl_flats", toX: 16, toY: 3, toDir: "down" },
    { map: "lh_a", x: 7, y: 0, toMap: "lh_b", toX: 7, toY: 10, toDir: "up" },
    { map: "lh_b", x: 7, y: 11, toMap: "lh_a", toX: 7, toY: 1, toDir: "down" },
    // the palace gate only opens with the keeper's key
    { map: "zl_island", x: 8, y: 2, toMap: "palace_a", toX: 9, toY: 10, toDir: "up", needFlag: "tideKey", setFlag: "palaceOpen",
      lockedText: ["A great gate of shell and coral, sealed with a shell-shaped lock.", "(The flats sign said the old lighthouse keeper kept the key...)"],
      lockedQuest: { from: "zl1", to: "zl2" } },
    { map: "palace_a", x: 9, y: 11, toMap: "zl_island", toX: 8, toY: 3, toDir: "down" },
    { map: "palace_a", x: 9, y: 0, toMap: "palace_b", toX: 9, toY: 12, toDir: "up" },
    { map: "palace_b", x: 9, y: 13, toMap: "palace_a", toX: 9, toY: 1, toDir: "down" },
  );

  // town: the coast road (south) opens once Thornmane is beaten; Biscuit's bakery stall
  const buildOverworld = W.buildOverworld;
  W.buildOverworld = function () {
    const m = buildOverworld();
    for (let y = 9; y <= 14; y++) m.ground[y][13] = "path";
    return m;
  };
  const makeEntities = W.makeEntities;
  W.makeEntities = function () {
    const ent = makeEntities();
    ent.overworld.push({ type: "shop", id: "stall_baker", shopId: "baker", style: "baker", owner: "baker", requires: "baker", x: 15, y: 14 });
    const coast = ent.overworld.find(e => e.id === "coastsign");
    if (coast) coast.text = ["A brand-new sign, still smelling of fresh paint:", "\"SOUTH: the coast road to ZEELAND.\" (Hazel fixed the road!)"];
    return ent;
  };
  const applyRegion = W.applyRegion;
  W.applyRegion = function (G) {
    applyRegion(G);
    if (G.flags.ewKing) G.maps.overworld.object[15][13] = "farch";             // the coast road is open
    if (G.flags.palaceOpen) G.maps.zl_island.object[2][8] = "ddoor";
  };

  /* ---------------- quest ---------------- */
  Object.assign(W.QUEST.steps, {
    zeeland: "Thornmane is humbled. Take the coast road SOUTH of town to ZEELAND.",
    zl1:     "Zeeland: the Tide Queen hoards every fish and the villages are starving. Find a way into her SUNKEN PALACE.",
    zl2:     "The palace on the island is sealed. The old LIGHTHOUSE on the flats might hold the key.",
    zl3:     "You have the TIDE KEY. Cross the flats at LOW TIDE and open the sunken palace on the island.",
    vuurland: "The Tide Queen is humbled and the fishing villages can eat again. Next: VUURLAND. (On its way!)",
  });
  W.QUEST.order = W.QUEST.order.concat(["zl1", "zl2", "zl3", "vuurland"]);
})();
