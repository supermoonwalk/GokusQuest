/* ============================================================
   world3.js  —  Rescuable villagers who open shops in town, the
   THORNHOLLOW side area in the woods (Bramble the smith), and
   VESPER'S GROUNDS between the forest and her castle (Hazel the
   carpenter). Extends window.World.
   ============================================================ */
(function () {
  const W = window.World;

  function grid(w, h, fill) {
    const g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill(fill));
    return g;
  }

  /* ---------------- VILLAGERS ----------------
     Each one is caged somewhere off the main route. Freed, they move to
     town and open a stall (an entity of type "shop" with this shopId). */
  W.VILLAGERS = {
    smith:     { name: "Bramble", title: "Bramble's Forge",   kind: "smith",
                 lines: ["*clang* The cage door falls off its hinges.",
                         "\"Bless your whiskers! Tom's thugs grabbed me on the road — wanted me to forge them chains.\"",
                         "\"I'm Bramble, a smith. I'll set up a FORGE in your town. Come by for claws, collars and charms!\""] },
    carpenter: { name: "Hazel",   title: "Hazel's Workshop",  kind: "carpenter",
                 lines: ["*the lock gives way with a crack*",
                         "\"Finally! Vesper kept me here to build her CAGES. Can you imagine?\"",
                         "\"I'm Hazel, a carpenter. I'll open a WORKSHOP in town: furniture for your hut, even a whole new room.\""] },
  };

  /* ---------------- THORNHOLLOW (side area north of the forest fork) ---------------- */
  W.buildHollow = function () {
    const MW = 18, MH = 12;
    const ground = grid(MW, MH, "fgrass");
    const object = grid(MW, MH, null);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++)
      if ((x * 7 + y * 5) % 6 === 0) ground[y][x] = "fgrass2";
    for (let x = 0; x < MW; x++) { object[0][x] = "ftree"; object[MH - 1][x] = "ftree"; }
    for (let y = 0; y < MH; y++) { object[y][0] = "ftree"; object[y][MW - 1] = "ftree"; }
    // winding trail from the south entrance up to the clearing with the cage
    for (let y = 4; y <= 11; y++) ground[y][9] = "fdirt";
    for (let x = 5; x <= 9; x++) ground[7][x] = "fdirt";
    for (let y = 2; y <= 4; y++) for (let x = 7; x <= 11; x++) ground[y][x] = "fdirt";
    object[MH - 1][9] = null;                         // entrance gap (warp tile below)
    const thorns = [[3, 2], [4, 4], [2, 6], [14, 2], [13, 5], [15, 7], [12, 9], [3, 9], [6, 10], [14, 10]];
    thorns.forEach(([x, y]) => { if (ground[y][x] !== "fdirt") object[y][x] = "ftree"; });
    const bushes = [[5, 3], [12, 3], [6, 5], [11, 6], [4, 8], [13, 8], [7, 9], [11, 10]];
    bushes.forEach(([x, y]) => { if (ground[y][x] !== "fdirt") object[y][x] = "fbush"; });
    object[5][15] = "stump"; object[8][2] = "fflower"; object[9][15] = "fflower";
    object[10][10] = "sign";
    return { name: "hollow", w: MW, h: MH, ground, object, music: "forest" };
  };
  W.hollowEntities = function () {
    return [
      { type: "monster", id: "h1", mon: "kitten",  x: 9,  y: 9, dir: "down", alive: true },
      { type: "monster", id: "h2", mon: "scruffy", x: 6,  y: 7, dir: "right", alive: true },
      { type: "monster", id: "h3", mon: "mouser",  x: 11, y: 5, dir: "left", alive: true },
      { type: "monster", id: "h4", mon: "shade",   x: 8,  y: 3, dir: "down", alive: true },
      { type: "captive", id: "v_smith", kind: "smith", kname: "Bramble", villager: "smith", caged: true, x: 9, y: 2, dir: "down" },
      { type: "chest", id: "c_hollow", x: 15, y: 9, coins: 18 },
      { type: "sign", id: "hollowsign", x: 10, y: 10, text: ["Words scratched into the bark:", "\"THORNHOLLOW. Tom's boys keep their prisoners up the trail.\""] },
    ];
  };

  /* ---------------- VESPER'S GROUNDS (forest gate -> castle) ---------------- */
  W.buildGrounds = function () {
    const MW = 30, MH = 14;
    const ground = grid(MW, MH, "fgrass2");
    const object = grid(MW, MH, null);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++)
      if ((x * 3 + y * 7) % 5 === 0) ground[y][x] = "fgrass";
    for (let x = 0; x < MW; x++) { object[0][x] = "ftree"; object[MH - 1][x] = "ftree"; }
    for (let y = 0; y < MH; y++) { object[y][0] = "ftree"; object[y][MW - 1] = "ftree"; }
    // flagstone road: west entrance -> east, then north to the castle door
    for (let x = 0; x <= 26; x++) ground[7][x] = "dstone";
    for (let y = 3; y <= 7; y++) ground[y][26] = "dstone";
    object[7][0] = null;                               // entrance gap (warp back to the forest)
    // side path south to the carpenter's cage
    for (let y = 8; y <= 11; y++) ground[y][12] = "dstone2";
    for (let x = 10; x <= 14; x++) ground[11][x] = "dstone2";
    // castle front (rows 0-2, cols 21-29) with its door at (26,2)
    for (let x = 21; x < MW; x++) { object[0][x] = "dwallTop"; object[1][x] = "dwall"; object[2][x] = "dwall"; }
    object[2][26] = "ddoor";
    object[1][23] = "banner"; object[1][28] = "banner";
    object[2][24] = "torch"; object[2][28] = "torch";
    // gloomy garden: dead trees, hedges, braziers along the road
    const trees = [[3, 3], [6, 2], [9, 4], [15, 2], [18, 4], [4, 10], [8, 11], [17, 10], [21, 11], [24, 10], [19, 6]];
    trees.forEach(([x, y]) => { if (ground[y][x].indexOf("dstone") !== 0) object[y][x] = "ftree"; });
    const hedges = [[2, 5], [5, 5], [8, 5], [11, 5], [14, 5], [17, 5], [2, 9], [5, 9], [8, 9], [16, 9], [20, 9], [23, 5]];
    hedges.forEach(([x, y]) => { if (ground[y][x].indexOf("dstone") !== 0) object[y][x] = "fbush"; });
    [[7, 6], [15, 6], [22, 8], [25, 4]].forEach(([x, y]) => object[y][x] = "brazier");
    object[9][27] = "rubble"; object[4][13] = "web";
    object[6][3] = "sign";
    return { name: "grounds", w: MW, h: MH, ground, object, music: "manor", dark: true };
  };
  W.groundsEntities = function () {
    return [
      { type: "monster", id: "g1", mon: "shade", x: 6,  y: 8, dir: "left", alive: true },
      { type: "monster", id: "g2", mon: "hex",   x: 11, y: 6, dir: "left", alive: true },
      { type: "monster", id: "g3", mon: "shade", x: 18, y: 8, dir: "left", alive: true },
      { type: "monster", id: "g4", mon: "brute", x: 23, y: 6, dir: "left", alive: true },
      { type: "monster", id: "g5", mon: "hex",   x: 26, y: 4, dir: "down", alive: true },
      { type: "monster", id: "g6", mon: "brute", x: 14, y: 10, dir: "up", alive: true },
      { type: "captive", id: "v_carp", kind: "carpenter", kname: "Hazel", villager: "carpenter", caged: true, x: 12, y: 12, dir: "up" },
      { type: "chest", id: "c_grounds", x: 3, y: 11, coins: 25 },
      { type: "gear", id: "g_grounds", gid: null, x: 27, y: 10 },
      { type: "sign", id: "groundssign", x: 3, y: 6, text: ["A wrought-iron sign, polished to a shine:",
        "\"PRIVATE GROUNDS OF MADAME VESPER. Strays will be COLLECTED.\""] },
    ];
  };

  /* ---------------- TOWN STALLS (hidden until their owner is rescued) ---------------- */
  W.townStalls = function () {
    return [
      { type: "shop", id: "stall_smith", shopId: "smith", style: "smith", owner: "smith", requires: "smith", x: 11, y: 11 },
      { type: "shop", id: "stall_carp", shopId: "carpenter", style: "carpenter", owner: "carpenter", requires: "carpenter", x: 14, y: 5 },
    ];
  };

  /* ---------------- ROUTE CHANGES ----------------
     forest fork (6,0) <-> Thornhollow; forest gate (26,9) -> grounds;
     castle door -> throne hall; throne hall exit -> grounds. */
  const warps = W.WARPS;
  for (const w of warps) {
    if (w.map === "forest" && w.toMap === "manor") { w.toMap = "grounds"; w.toX = 1; w.toY = 7; w.toDir = "right"; }
    if (w.map === "manor" && w.toMap === "forest") { w.toMap = "grounds"; w.toX = 26; w.toY = 3; w.toDir = "down"; }
  }
  warps.push(
    { map: "forest", x: 6, y: 0, toMap: "hollow", toX: 9, toY: 10, toDir: "up" },
    { map: "hollow", x: 9, y: 11, toMap: "forest", toX: 6, toY: 1, toDir: "down" },
    { map: "grounds", x: 0, y: 7, toMap: "forest", toX: 25, toY: 9, toDir: "left" },
    { map: "grounds", x: 26, y: 2, toMap: "manor", toX: 10, toY: 16, toDir: "up" },
  );

  // forest: open a trail north from the fork to Thornhollow
  const buildForest = W.buildForest;
  W.buildForest = function () {
    const m = buildForest();
    m.object[0][6] = "farch";
    m.object[2][7] = "sign";
    for (let y = 1; y <= 3; y++) m.ground[y][6] = "fdirt";
    return m;
  };
  const makeEntities = W.makeEntities;
  W.makeEntities = function () {
    const ent = makeEntities();
    const fork = ent.forest.find(e => e.id === "c_fork");
    if (fork) fork.x = 5;                            // chest moves off the new trail
    ent.forest.push({ type: "sign", id: "hollowpost", x: 7, y: 2, text: ["A crooked signpost:", "\"↑ THORNHOLLOW.\" Someone has scratched underneath: \"HELP\"."] });
    ent.overworld.push(...W.townStalls());
    return ent;
  };

  /* ---------------- QUEST ---------------- */
  Object.assign(W.QUEST.steps, {
    tomBeaten: "Tom served a darker mistress. Madame Vesper stole Chi Chi away — take the dark GATE at the east of the woods.",
    grounds:   "Cross Vesper's gloomy grounds and find the way into her castle.",
    manor:     "Climb into Vesper's throne hall. Free every caged kitten and reach her throne.",
  });
  W.QUEST.order = ["start", "searched", "deduced", "fighting", "boss", "tomBeaten", "grounds", "manor", "done"];
})();
