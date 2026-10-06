/* ============================================================
   world.js  —  Maps (TOWN / FOREST / shop / cottage), entities,
   monster stats, economy, upgrades, specials, gear tiers.
   ============================================================ */
(function () {
  function grid(w, h, fill) {
    const g = [];
    for (let y = 0; y < h; y++) { g.push(new Array(w).fill(fill)); }
    return g;
  }

  /* ---------------- TOWN (safe meadow — no enemies) ---------------- */
  function buildOverworld() {
    const W = 24, H = 16;
    const ground = grid(W, H, "grass");
    const object = grid(W, H, null);

    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      if ((x * 7 + y * 13) % 11 === 0) ground[y][x] = "grass2";

    for (let x = 0; x < W; x++) { object[0][x] = "tree"; object[H - 1][x] = "tree"; }
    for (let y = 0; y < H; y++) { object[y][0] = "tree"; object[y][W - 1] = "tree"; }

    const trees = [[2,1],[5,1],[8,2],[3,13],[7,13],[10,13],[2,11],[20,2],[16,2],[13,1],[11,13],[18,13]];
    trees.forEach(([x,y]) => object[y][x] = "tree");

    // Cottage (cols 2-4, rows 3-5)
    object[3][2] = "roofL"; object[3][3] = "roofM"; object[3][4] = "roofR";
    object[4][2] = "wallL"; object[4][3] = "window"; object[4][4] = "wallR";
    object[5][2] = "wallL"; object[5][3] = "door";   object[5][4] = "wallR";
    ground[6][3] = "matground";

    // paths
    for (let y = 6; y <= 8; y++) ground[y][3] = "path";
    for (let x = 3; x <= 22; x++) ground[8][x] = "path";
    ground[7][3] = "path";
    for (let y = 8; y <= 11; y++) ground[8 + 0][8] = "path", ground[y][8] = "path";

    // pond + flowers
    for (let y = 10; y <= 12; y++) for (let x = 14; x <= 17; x++) ground[y][x] = "water";
    object[9][14] = "flowerY"; object[9][16] = "flowerP"; object[13][15] = "flowerP";
    object[6][5] = "flowerP"; object[6][6] = "flowerY"; object[7][6] = "flowerP";
    object[9][4] = "bush"; object[10][6] = "bush"; object[7][9] = "flowerY";
    object[6][1] = "fence"; object[7][1] = "fence";
    object[6][4] = "sign";

    // forest entrance on the EAST edge (framed by pines), gated by a log until quest opens it
    object[8][23] = "farch";        // warp tile to forest
    object[7][23] = "ftree"; object[9][23] = "ftree";
    object[7][22] = "ftree"; object[9][22] = "ftree";
    object[8][22] = "flog";         // gate (removed once Chi Chi's fate is known)

    return { name: "overworld", w: W, h: H, ground, object, music: "field" };
  }

  /* ---------------- FOREST (combat) ---------------- */
  function buildForest() {
    const W = 28, H = 18;
    const ground = grid(W, H, "fgrass");
    const object = grid(W, H, null);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      if ((x * 5 + y * 11) % 6 === 0) ground[y][x] = "fgrass2";

    // pine border
    for (let x = 0; x < W; x++) { object[0][x] = "ftree"; object[H - 1][x] = "ftree"; }
    for (let y = 0; y < H; y++) { object[y][0] = "ftree"; object[y][W - 1] = "ftree"; }

    // main dirt path west->east along row 9, with a fork up to a chest
    for (let x = 1; x <= 25; x++) ground[9][x] = "fdirt";
    ground[8][1] = "fdirt"; ground[10][1] = "fdirt";       // entrance clearing
    for (let y = 3; y <= 9; y++) ground[y][6] = "fdirt";   // fork north near x6
    ground[3][6] = "fdirt"; ground[3][5] = "fdirt"; ground[3][7] = "fdirt";
    // boss clearing (east)
    for (let y = 7; y <= 11; y++) for (let x = 22; x <= 25; x++) ground[y][x] = "fdirt";

    // tree clusters (avoid the path)
    const pines = [[3,3],[4,5],[9,3],[12,5],[15,3],[18,4],[21,3],[3,12],[6,13],[9,14],[12,12],
                   [16,13],[19,12],[22,14],[24,4],[2,7],[10,11],[14,11],[17,7],[20,8]];
    pines.forEach(([x,y]) => { if (ground[y][x] !== "fdirt") object[y][x] = "ftree"; });
    const bushes = [[4,8],[8,11],[11,7],[13,13],[16,10],[19,6],[23,13],[5,11],[15,8]];
    bushes.forEach(([x,y]) => { if (ground[y][x] !== "fdirt") object[y][x] = "fbush"; });
    [[7,6],[14,6],[20,11],[3,9 - 0]].forEach(() => {});
    object[6][3] = "stump"; object[11][13] = "stump"; object[5][20] = "stump";
    object[7][8] = "fflower"; object[10][16] = "fflower"; object[12][9] = "fflower"; object[4][12] = "fflower";

    return { name: "forest", w: W, h: H, ground, object, music: "forest" };
  }

  /* ---------------- SHOP interior ---------------- */
  function buildShop() {
    const W = 11, H = 8;
    const ground = grid(W, H, "sfloor");
    const object = grid(W, H, null);
    for (let x = 0; x < W; x++) { object[0][x] = "swall"; object[H - 1][x] = "swall"; }
    for (let y = 0; y < H; y++) { object[y][0] = "swall"; object[y][W - 1] = "swall"; }
    // back-wall wares
    object[0][2] = "swares"; object[0][4] = "swares"; object[0][6] = "swares"; object[0][8] = "swares";
    object[1][1] = "slamp"; object[1][9] = "slamp";
    // counter (cols 3-7, row 4)
    for (let x = 3; x <= 7; x++) object[4][x] = "scounter";
    // goods around
    object[6][1] = "crate"; object[6][2] = "barrel"; object[6][9] = "crate"; object[5][9] = "barrel";
    ground[5][5] = "srug"; ground[6][5] = "srug";
    // exit mat (bottom centre)
    object[H - 1][5] = "sexit";
    return { name: "shop", w: W, h: H, ground, object, music: "shop" };
  }

  /* ---------------- MONSTERS (aggro tuned down) ---------------- */
  const MONSTERS = {
    kitten:  { name: "Alley Kitten", kind: "hench",  hp: 14, atk: 4, def: 0, touch: 4, speed: 0.62, aggro: 38, coins: 6 },
    scruffy: { name: "Scruffy Stray", kind: "hench2", hp: 20, atk: 5, def: 1, touch: 5, speed: 0.6,  aggro: 40, coins: 9 },
    mouser:  { name: "Mean Mouser", kind: "hench",   hp: 26, atk: 6, def: 1, touch: 6, speed: 0.66, aggro: 44, coins: 11 },
    boss:    { name: "Tuxedo Tom", kind: "boss",     hp: 64, atk: 8, def: 2, touch: 7, speed: 0.85, aggro: 80, coins: 45, big: true, boss: true },
    shade:   { name: "Shade Prowler", kind: "shade", hp: 28, atk: 7, def: 2, touch: 6, speed: 0.82, aggro: 46, coins: 13 },
    brute:   { name: "Brutus", kind: "brute",        hp: 52, atk: 10, def: 4, touch: 9, speed: 0.5, aggro: 42, coins: 22, big: true },
    hex:     { name: "Hex the Hisser", kind: "hex",  hp: 34, atk: 8, def: 2, touch: 7, speed: 0.68, aggro: 48, coins: 17 },
    vesper:  { name: "Madame Vesper", kind: "vesper", hp: 120, atk: 11, def: 4, touch: 9, speed: 0.7, aggro: 220, coins: 0, big: true, boss: true, vesper: true },
  };

  /* ---------------- ENTITIES ---------------- */
  function makeEntities() {
    return {
      overworld: [   // TOWN — friendly only
        { type: "npc", id: "villager", kind: "villager", x: 6, y: 9, dir: "down" },
        { type: "shop", id: "shop", x: 8, y: 11 },
        { type: "chest", id: "c_yard", x: 2, y: 12, coins: 12 },
        { type: "gear", id: "g_field", gid: null, x: 5, y: 12 },
        { type: "sign", id: "sign", x: 4, y: 6, text: ["A hand-painted sign:", "\"Chi Chi's Cottage \u2014 knock first, the cat naps here.\""] },
        { type: "sign", id: "woodsign", x: 21, y: 8, text: ["A weathered signpost points east:", "\"\u2192 WHISKERWOOD. Mind the strays.\""] },
      ],
      forest: [
        { type: "monster", id: "f1", mon: "kitten",  x: 6,  y: 9,  dir: "left", alive: true },
        { type: "monster", id: "f2", mon: "scruffy", x: 10, y: 8,  dir: "left", alive: true },
        { type: "monster", id: "f3", mon: "mouser",  x: 14, y: 10, dir: "left", alive: true },
        { type: "monster", id: "f4", mon: "shade",   x: 18, y: 9,  dir: "left", alive: true },
        { type: "monster", id: "f5", mon: "hex",     x: 20, y: 7,  dir: "left", alive: true },
        { type: "monster", id: "boss", mon: "boss",  x: 24, y: 9,  dir: "left", alive: true, boss: true },
        { type: "captive", id: "chichi", kind: "chichi", x: 24, y: 7, dir: "down", caged: true },
        { type: "chest", id: "c_fork", x: 6, y: 3, coins: 14 },
        { type: "chest", id: "c_deep", x: 26, y: 2, coins: 20 },
        { type: "gear", id: "g_forest", gid: null, x: 12, y: 14 },
        { type: "gear", id: "g_forest2", gid: null, x: 3, y: 5 },
      ],
      shop: [
        { type: "npc", id: "shopkeep", kind: "villager", x: 5, y: 3, dir: "down" },
      ],
      interior: [
        { type: "clue", id: "bed", x: 1, y: 1, text: ["Chi Chi's little bed, blanket still rumpled.", "She was curled up here not long ago."] },
        { type: "clue", id: "shelf1", x: 3, y: 1, text: ["A shelf of books: knitting, and fish recipes.", "Very Chi Chi."] },
        { type: "clue", id: "table", x: 3, y: 3, text: ["Two teacups. One tipped over, tea barely dry.", "Chi Chi had a visitor."] },
        { type: "clue", id: "chairTip", x: 3, y: 5, text: ["A chair knocked clean over.", "Someone left in a hurry \u2014 or was dragged."] },
        { type: "clue", id: "vase", x: 8, y: 5, text: ["Chi Chi's favorite vase, smashed on the floor.", "There was a struggle here."] },
        { type: "clue", id: "claw", x: 11, y: 3, text: ["Deep claw marks gouged across the wall.", "Too big to be Chi Chi's."] },
        { type: "clue", id: "window", x: 8, y: 0, isKey: true, text: [
          "The window is smashed inward from OUTSIDE.",
          "Caught on the frame: tufts of black-and-white fur...",
          "A tuxedo cat broke in and took her. TUXEDO TOM." ] },
        { type: "item", id: "ribbon", x: 6, y: 6, item: "ribbon",
          text: ["Chi Chi's red ribbon, by the doorway.", "You tuck it away. You'll give it back to her."] },
      ],
    };
  }

  /* ---------------- WARPS ---------------- */
  const WARPS = [
    { map: "overworld", x: 3, y: 5, toMap: "interior", toX: 5, toY: 7, toDir: "up" },
    { map: "interior", x: 5, y: 8, toMap: "overworld", toX: 3, toY: 6, toDir: "down" },
    // shop interior -> town (walk onto the exit mat)
    { map: "shop", x: 5, y: 7, toMap: "overworld", toX: 8, toY: 12, toDir: "down" },
    // town <-> forest (gated until 'deduced'; a fallen log also blocks it physically)
    { map: "overworld", x: 23, y: 8, toMap: "forest", toX: 2, toY: 9, toDir: "right", needForest: true },
    { map: "forest", x: 1, y: 9, toMap: "overworld", toX: 22, toY: 8, toDir: "left" },
    // forest -> manor (gate appears after Tom is beaten)
    { map: "forest", x: 26, y: 9, toMap: "manor", toX: 10, toY: 16, toDir: "up" },
    { map: "manor", x: 10, y: 18, toMap: "forest", toX: 25, toY: 9, toDir: "left" },
    { map: "manor", x: 11, y: 18, toMap: "forest", toX: 25, toY: 9, toDir: "left" },
  ];

  /* ---------------- QUEST ---------------- */
  const QUEST = {
    title: "The Search for Chi Chi",
    steps: {
      start:    "Find your sister Chi Chi. Start at her cottage.",
      searched: "Search the cottage for clues. (Walk up, press E.)",
      deduced:  "Tuxedo Tom took Chi Chi! The east woods are open \u2014 head into WHISKERWOOD.",
      fighting: "Cut through Tom's gang in the forest. Swipe with SPACE.",
      boss:     "Defeat Tuxedo Tom and free Chi Chi!",
    },
  };

  /* ---------------- PLAYER ---------------- */
  const PLAYER_BASE = { name: "Goku", maxHp: 30, atk: 7, def: 2, spd: 1.45 };

  /* ---------------- UPGRADES ---------------- */
  const UPGRADES = {
    hp:  { name: "Max Health", step: 8,    max: 8, baseCost: 14, desc: "+8 max HP" },
    atk: { name: "Attack",     step: 2,    max: 8, baseCost: 18, desc: "+2 Attack" },
    def: { name: "Defense",    step: 1,    max: 8, baseCost: 15, desc: "+1 Defense" },
    spd: { name: "Speed",      step: 0.12, max: 6, baseCost: 22, desc: "Move & swipe faster" },
    chi: { name: "Max CHI",    step: 2,    max: 6, baseCost: 16, desc: "+2 special energy" },
  };
  function upgradeCost(key) {
    const u = UPGRADES[key], lvl = G.upgrades[key];
    return Math.round(u.baseCost * (1 + lvl * 0.8));
  }

  /* ---------------- SPECIALS ---------------- */
  const SPECIALS = {
    slam: { name: "180 Door Slam", cost: 4, icon: "slam", desc: "Spin attack: big damage + knockback all around you." },
    dash: { name: "Dash Dodge",    cost: 2, icon: "dash", desc: "Quick dash in your facing direction. Brief invulnerability." },
    roar: { name: "Cat Roar",      cost: 3, icon: "roar", desc: "A shout that damages and knocks back nearby foes." },
  };

  /* ---------------- GEAR (random quality tiers) ---------------- */
  const GEAR = {
    claws:  { name: "Claws",  slot: "claws",  statKey: "atk", base: 3, statLabel: "Attack" },
    collar: { name: "Collar", slot: "collar", statKey: "def", base: 2, statLabel: "Defense" },
    charm:  { name: "Charm",  slot: "charm",  statKey: "chi", base: 2, statLabel: "max CHI" },
  };
  const TIERS = [
    { name: "Cracked",  mult: 0.5, weight: 22, color: "#9a93a0" },
    { name: "Worn",     mult: 0.9, weight: 30, color: "#c9b48a" },
    { name: "Fine",     mult: 1.3, weight: 28, color: "#7fb069" },
    { name: "Pristine", mult: 1.8, weight: 15, color: "#5b9ed6" },
    { name: "Mythic",   mult: 2.6, weight: 5,  color: "#d67ad0" },
  ];
  function rollTier() {
    const total = TIERS.reduce((a, t) => a + t.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < TIERS.length; i++) { r -= TIERS[i].weight; if (r <= 0) return i; }
    return 0;
  }
  function rollGear(gid) {
    if (!gid) gid = ["claws", "collar", "charm"][Math.floor(Math.random() * 3)];
    const g = GEAR[gid], tier = rollTier();
    const val = Math.max(1, Math.round(g.base * TIERS[tier].mult) + (Math.random() < 0.4 ? 1 : 0));
    const inst = { gid, tier, equipped: false };
    inst[g.statKey] = val;
    return inst;
  }
  function tierName(t) { return TIERS[t].name; }
  function tierColor(t) { return TIERS[t].color; }
  function gearStat(inst) { return inst[GEAR[inst.gid].statKey]; }
  function gearLine(inst) { return "+" + gearStat(inst) + " " + GEAR[inst.gid].statLabel + "."; }
  function gearValue(inst) { return Math.max(3, Math.round(gearStat(inst) * (2 + inst.tier))); }

  window.World = {
    buildOverworld, buildForest, buildShop, buildInterior: buildInteriorRef,
    makeEntities, MONSTERS, WARPS, QUEST, PLAYER_BASE,
    UPGRADES, upgradeCost, SPECIALS, GEAR, TIERS,
    rollGear, tierName, tierColor, gearStat, gearLine, gearValue,
    SHOPKEEPER_PATH: [{ x: 7, y: 10 }, { x: 8, y: 11 }],
  };

  /* ---------------- COTTAGE interior (unchanged) ---------------- */
  function buildInteriorRef() {
    const W = 12, H = 9;
    const ground = grid(W, H, "floor");
    const object = grid(W, H, null);
    for (let x = 0; x < W; x++) { object[0][x] = "wallInt"; object[H - 1][x] = "wallInt"; }
    for (let y = 0; y < H; y++) { object[y][0] = "wallInt"; object[y][W - 1] = "wallInt"; }
    object[0][2] = "wallWindow"; object[0][8] = "wallBroken"; object[3][11] = "wallClaw";
    object[H - 1][5] = "exitInt";
    ground[4][5] = "rug"; ground[4][6] = "rug"; ground[5][5] = "rug"; ground[5][6] = "rug";
    object[1][1] = "bed"; object[1][3] = "shelf"; object[1][10] = "plant";
    object[3][3] = "table"; object[3][4] = "chairOk"; object[5][3] = "chairTip";
    object[5][8] = "vase"; object[1][8] = "shelf";
    return { name: "interior", w: W, h: H, ground, object, music: "home" };
  }
})();
