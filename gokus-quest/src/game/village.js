/* ============================================================
   village.js  —  Where the rescued villagers live and work.
   MARKET STREET (west of town): one house per villager, built
   the moment they move in (an empty lot until then). Every house
   can be entered; the owner stands behind the counter.
   Each house is styled after its owner:
     smith (Bramble)     stone forge, chimney, anvil + furnace
     carpenter (Hazel)   timber workshop, workbench + planks
     dojo (Mochi)        red-roofed dojo, tatami + scrolls
     baker (Biscuit)     cosy bakery, oven + bread shelves
   Also Mochi's shrine temple in the Elderwood (enterable).
   ============================================================ */
(function () {
  const W = window.World;
  const TS = 16;

  /* ---------------- tiles (drawn here, registered into Tiles.TILES) ---------------- */
  function tile(id, solid, draw) {
    const c = document.createElement("canvas"); c.width = TS; c.height = TS;
    const ctx = c.getContext("2d"); ctx.imageSmoothingEnabled = false;
    draw((col, x, y, w, h) => { ctx.fillStyle = col; ctx.fillRect(x, y, w || 1, h || 1); });
    Tiles.TILES[id] = { canvas: c, solid };
  }
  // per-house palettes and features
  const STYLES = {
    smith:     { roof: "#3e424d", roof2: "#565b68", wall: "#7a7f8c", wall2: "#646976", trim: "#2b2e36", door: "#3a2a1e", glass: "#ffb04a" },
    carpenter: { roof: "#4f8a4f", roof2: "#68a868", wall: "#b08856", wall2: "#93703f", trim: "#5f3f24", door: "#7a5230", glass: "#bfe6f2" },
    dojo:      { roof: "#b8403a", roof2: "#d0605a", wall: "#f4eee6", wall2: "#ddd3c6", trim: "#3a2a1e", door: "#f4eee6", glass: "#f4eee6" },
    baker:     { roof: "#d0703a", roof2: "#e8925a", wall: "#f0d9a0", wall2: "#dcc184", trim: "#8a5a24", door: "#7fb0d0", glass: "#fff0c4" },
  };
  function houseTiles(s) {
    const P = STYLES[s];
    const wallBase = (px, side) => {
      px(P.wall, 0, 0, 16, 16);
      if (s === "smith") { for (let y = 3; y < 16; y += 5) px(P.wall2, 0, y, 16, 1); px(P.wall2, 5, 0, 1, 3); px(P.wall2, 11, 4, 1, 4); px(P.wall2, 3, 9, 1, 4); }
      else if (s === "carpenter") { for (let y = 3; y < 16; y += 4) px(P.wall2, 0, y, 16, 1); }
      else if (s === "dojo") { px(P.trim, 0, 0, 16, 2); px(P.trim, 0, 14, 16, 2); }
      else { px(P.wall2, 0, 13, 16, 3); px(P.wall2, 2, 4, 1, 1); px(P.wall2, 11, 8, 1, 1); }
      if (side === "L") px(P.trim, 0, 0, 2, 16);
      if (side === "R") px(P.trim, 14, 0, 2, 16);
    };
    // roof row: full tile, sloped corners, wall top under the eave
    const roof = (px, part) => {
      px(P.wall, 0, 10, 16, 6); px(P.trim, 0, 10, 16, 2);
      for (let y = 0; y < 10; y++) {
        let x0 = 0, x1 = 16;
        if (part === "L") x0 = Math.max(0, 9 - y);
        if (part === "R") x1 = Math.min(16, 7 + y);
        px(y % 3 === 2 ? P.roof2 : P.roof, x0, y, x1 - x0, 1);
      }
      px(P.trim, 0, 9, 16, 1);
      if (s === "dojo" && part === "L") { px(P.roof, 0, 6, 3, 2); px(P.roof2, 0, 5, 2, 1); }      // upturned eaves
      if (s === "dojo" && part === "R") { px(P.roof, 13, 6, 3, 2); px(P.roof2, 14, 5, 2, 1); }
      if (s === "dojo" && part === "M") px("#e8c34a", 7, 1, 2, 2);                                // ridge ornament
      if (s === "smith" && part === "C") { px("#4a3a34", 9, 0, 5, 8); px("#2b2e36", 9, 0, 5, 1); px("#a8a8b0", 10, -0, 2, 1); }  // chimney
      if (s === "baker" && part === "C") { px("#b05a2a", 4, 0, 4, 7); px("#f6f0e0", 5, 0, 2, 1); }    // round-ish chimney
    };
    tile("h_" + s + "_roofL", true, (px) => roof(px, "L"));
    tile("h_" + s + "_roofM", true, (px) => roof(px, "M"));
    tile("h_" + s + "_roofC", true, (px) => roof(px, "C"));
    tile("h_" + s + "_roofR", true, (px) => roof(px, "R"));
    tile("h_" + s + "_wallL", true, (px) => wallBase(px, "L"));
    tile("h_" + s + "_wallR", true, (px) => wallBase(px, "R"));
    tile("h_" + s + "_window", true, (px) => {
      wallBase(px, "M");
      if (s === "dojo") { px(P.trim, 3, 3, 10, 9); px(P.glass, 4, 4, 8, 7); px(P.trim, 8, 4, 1, 7); px(P.trim, 4, 7, 8, 1); }
      else { px(P.trim, 3, 3, 10, 8); px(P.glass, 4, 4, 8, 6); px(P.trim, 7, 4, 1, 6); }
      if (s === "carpenter") { px("#7a5230", 3, 11, 10, 2); px("#e07a8a", 4, 10, 2, 1); px("#ffd36a", 8, 10, 2, 1); }   // flower box
      if (s === "baker") { px("#c98a3a", 5, 7, 6, 3); px("#e8b060", 6, 7, 4, 1); }                                    // bread in the window
    });
    tile("h_" + s + "_sign", true, (px) => {
      wallBase(px, "M");
      px(P.trim, 2, 4, 12, 8); px("#fbf2da", 3, 5, 10, 6);
      if (s === "smith") { px("#3e424d", 5, 6, 6, 2); px("#3e424d", 7, 8, 2, 2); px("#3e424d", 5, 10, 6, 1); }        // anvil
      if (s === "carpenter") { px("#c9a46a", 7, 6, 2, 5); px("#5a5f6e", 5, 5, 6, 2); }                              // hammer
      if (s === "dojo") { px("#d8504f", 7, 5, 2, 6); px("#d8504f", 5, 7, 6, 2); }                                   // emblem
      if (s === "baker") { px("#c98a3a", 4, 6, 8, 3); px("#e8b060", 5, 6, 6, 1); px("#c98a3a", 6, 9, 4, 1); }       // loaf
    });
    tile("h_" + s + "_door", false, (px) => {
      wallBase(px, "M");
      px(P.trim, 3, 3, 10, 13);
      if (s === "dojo") { px(P.door, 4, 4, 8, 12); for (let y = 6; y < 16; y += 4) px(P.trim, 4, y, 8, 1); px(P.trim, 8, 4, 1, 12); }  // shoji
      else { px(P.door, 4, 4, 8, 12); px(P.trim, 8, 4, 1, 12); px("#e0c060", 10, 10, 1, 1); }
      if (s === "smith") { px("#646976", 4, 7, 8, 1); px("#646976", 4, 12, 8, 1); }                                  // iron bands
    });
  }
  ["smith", "carpenter", "dojo", "baker"].forEach(houseTiles);

  // interior floors, walls and furniture
  function floor(id, a, b, pattern) { tile(id, false, (px) => { px(a, 0, 0, 16, 16); pattern(px, b); }); }
  floor("fl_forge", "#4a4652", "#3e3a46", (px, b) => { px(b, 0, 7, 16, 1); px(b, 7, 0, 1, 7); px(b, 3, 8, 1, 8); px(b, 12, 8, 1, 8); });
  floor("fl_shop", "#c9a46a", "#b08856", (px, b) => { for (let x = 0; x < 16; x += 5) px(b, x, 0, 1, 16); px("#e0c08a", 6, 4, 2, 1); px("#e0c08a", 11, 12, 2, 1); });
  floor("fl_tatami", "#c8c08a", "#a8a070", (px, b) => { px(b, 0, 0, 16, 1); px(b, 0, 15, 16, 1); px(b, 0, 0, 1, 16); for (let y = 3; y < 16; y += 3) px("#bcb47e", 1, y, 14, 1); });
  floor("fl_checker", "#f6efe0", "#d8c0a0", (px, b) => { px(b, 0, 0, 8, 8); px(b, 8, 8, 8, 8); });
  function wallIn(id, base, line, top) {
    tile(id, true, (px) => { px(base, 0, 0, 16, 12); px(top, 0, 12, 16, 4); px(line, 0, 12, 16, 1); for (let x = 3; x < 16; x += 6) px(line, x, 0, 1, 12); });
  }
  wallIn("wi_forge", "#5a5f6e", "#3e424d", "#2b2e36");
  wallIn("wi_shop", "#caa06a", "#a07a48", "#7d6240");
  wallIn("wi_dojo", "#f4eee6", "#3a2a1e", "#3a2a1e");
  wallIn("wi_bakery", "#f0d9a0", "#d8b880", "#c98a5a");
  const deco = (id, draw) => tile(id, true, draw);
  deco("anvil", (px) => { px("#3e424d", 2, 6, 12, 3); px("#565b68", 2, 6, 12, 1); px("#3e424d", 6, 9, 4, 4); px("#2b2e36", 4, 13, 8, 2); });
  deco("furnace", (px) => {
    px("#5a5f6e", 1, 1, 14, 15); px("#3e424d", 1, 1, 14, 2);
    px("#2b1a14", 4, 6, 8, 7); px("#ff8a3a", 5, 9, 6, 4); px("#ffd36a", 6, 10, 4, 2); px("#ffe8a0", 7, 11, 2, 1);
  });
  deco("workbench", (px) => { px("#a07a48", 1, 6, 14, 3); px("#c9a46a", 1, 6, 14, 1); px("#7a5530", 2, 9, 2, 6); px("#7a5530", 12, 9, 2, 6); px("#5a5f6e", 5, 4, 5, 2); });
  deco("planks", (px) => { for (let i = 0; i < 4; i++) { px(i % 2 ? "#c9a46a" : "#b08856", 1, 3 + i * 3, 14, 3); px("#7a5530", 1, 5 + i * 3, 14, 1); } });
  deco("scrollwall", (px) => { px("#f4eee6", 0, 0, 16, 12); px("#3a2a1e", 0, 12, 16, 4); px("#5f3f24", 4, 1, 8, 1); px("#fbf2da", 5, 2, 6, 8); px("#3a2a1e", 7, 3, 2, 1); px("#3a2a1e", 7, 5, 1, 3); px("#d8504f", 8, 8, 2, 1); });
  deco("bonsai", (px) => { px("#7a4a2c", 4, 11, 8, 4); px("#5a3318", 7, 7, 2, 4); px("#4f8a4f", 3, 3, 10, 5); px("#68a868", 5, 2, 5, 2); });
  deco("oven", (px) => {
    px("#b05a2a", 1, 2, 14, 14); px("#d0703a", 2, 2, 12, 2);
    px("#3a1a0e", 4, 7, 8, 6); px("#ff8a3a", 5, 10, 6, 3); px("#ffd36a", 6, 11, 4, 1);
  });
  deco("breadshelf", (px) => {
    px("#8a5a24", 1, 1, 14, 15); px("#a87038", 2, 2, 12, 13);
    px("#8a5a24", 2, 6, 12, 1); px("#8a5a24", 2, 11, 12, 1);
    px("#c98a3a", 3, 3, 4, 3); px("#e8b060", 9, 3, 4, 3); px("#c98a3a", 4, 8, 7, 3); px("#e0b060", 3, 12, 3, 3); px("#c98a3a", 8, 12, 5, 3);
  });
  deco("shrinealtar", (px) => { px("#3a2a1e", 2, 8, 12, 7); px("#5f3f24", 2, 8, 12, 1); px("#e8c34a", 6, 4, 4, 4); px("#ffe08a", 7, 5, 2, 2); px("#d8504f", 4, 6, 1, 2); px("#d8504f", 11, 6, 1, 2); });
  tile("emptylot", false, (px) => { px("#9a8a5a", 0, 0, 16, 16); for (let i = 0; i < 8; i++) px("#8a7a4a", (i * 7) % 15, (i * 5 + 2) % 15, 2, 1); px("#7fb069", 3, 2, 1, 2); px("#7fb069", 12, 11, 1, 2); });
  tile("lotstake", true, (px) => { px("#9a8a5a", 0, 0, 16, 16); px("#7a5530", 7, 4, 2, 10); px("#d8504f", 6, 3, 4, 2); });

  /* ---------------- MARKET STREET ---------------- */
  // house footprints: 4 wide x 3 tall, door at (x+1, y+2)
  W.HOUSES = {
    smith:     { x: 3,  y: 2, owner: "smith" },
    carpenter: { x: 10, y: 2, owner: "carpenter" },
    dojo:      { x: 17, y: 2, owner: "dojo" },
    baker:     { x: 24, y: 2, owner: "baker" },
  };
  function grid(w, h, fill) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill(fill)); return g; }
  W.buildMarket = function () {
    const MW = 30, MH = 14;
    const ground = grid(MW, MH, "grass"), object = grid(MW, MH, null);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if ((x * 7 + y * 13) % 11 === 0) ground[y][x] = "grass2";
    for (let x = 0; x < MW; x++) { object[0][x] = "tree"; object[MH - 1][x] = "tree"; }
    for (let y = 0; y < MH; y++) { object[y][0] = "tree"; object[y][MW - 1] = "tree"; }
    object[7][MW - 1] = null;                                         // back to town (east)
    for (let x = 1; x < MW; x++) ground[7][x] = "path";
    for (const id in W.HOUSES) { const h = W.HOUSES[id]; ground[5][h.x + 1] = "path"; ground[6][h.x + 1] = "path"; }
    // future lots on the south side
    for (const lx of [4, 12, 20]) { for (let y = 9; y <= 11; y++) for (let x = lx; x < lx + 4; x++) ground[y][x] = "emptylot"; object[9][lx] = "lotstake"; }
    [[2, 10], [9, 11], [17, 10], [25, 10], [27, 11]].forEach(([x, y]) => object[y][x] = "bush");
    object[6][8] = "flowerP"; object[6][15] = "flowerY"; object[6][22] = "flowerP"; object[8][27] = "sign";
    return { name: "market", w: MW, h: MH, ground, object, music: "field" };
  };
  // a house (or its empty lot) on market street, depending on who has moved in
  function placeHouse(map, h, built) {
    const s = h.owner, P = "h_" + s + "_";
    const rows = built
      ? [[P + "roofL", P + "roofM", P + "roofC", P + "roofR"], [P + "wallL", P + "window", P + "sign", P + "wallR"], [P + "wallL", P + "door", P + "window", P + "wallR"]]
      : [[null, null, null, null], [null, null, null, null], [null, "lotstake", null, null]];   // the stake marks the future door
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 4; dx++) {
      map.object[h.y + dy][h.x + dx] = rows[dy][dx];
      map.ground[h.y + dy][h.x + dx] = built ? "grass" : "emptylot";
    }
  }

  /* ---------------- interiors ---------------- */
  function interior(name, floorT, wallT, decor) {
    const MW = 11, MH = 8;
    const ground = grid(MW, MH, floorT), object = grid(MW, MH, null);
    for (let x = 0; x < MW; x++) { object[0][x] = wallT; object[MH - 1][x] = wallT; }
    for (let y = 0; y < MH; y++) { object[y][0] = wallT; object[y][MW - 1] = wallT; }
    object[MH - 1][5] = "sexit";
    for (const [x, y, t] of decor) object[y][x] = t;
    return { name, w: MW, h: MH, ground, object, music: "shop" };
  }
  const counter = [[3, 3, "scounter"], [4, 3, "scounter"], [6, 3, "scounter"], [7, 3, "scounter"], [5, 3, "scounter"]];
  W.buildHouseIn = {
    smith: () => interior("in_smith", "fl_forge", "wi_forge", counter.concat([[1, 1, "furnace"], [2, 1, "furnace"], [8, 1, "anvil"], [9, 5, "barrel"], [1, 5, "crate"], [9, 1, "crate"]])),
    carpenter: () => interior("in_carpenter", "fl_shop", "wi_shop", counter.concat([[1, 1, "workbench"], [2, 1, "planks"], [8, 1, "planks"], [9, 1, "workbench"], [1, 5, "planks"], [9, 5, "plant"]])),
    dojo: () => interior("in_dojo", "fl_tatami", "wi_dojo", counter.concat([[2, 0, "scrollwall"], [8, 0, "scrollwall"], [1, 1, "bonsai"], [9, 1, "dummy"], [9, 5, "dummy"], [1, 5, "bonsai"]])),
    baker: () => interior("in_baker", "fl_checker", "wi_bakery", counter.concat([[1, 1, "oven"], [2, 1, "oven"], [8, 1, "breadshelf"], [9, 1, "breadshelf"], [1, 5, "barrel"], [9, 5, "plant"]])),
  };
  // the shopkeeper behind the counter: a greeting in their own voice, then the shop
  const GREETINGS = {
    smith: ["\"Hmph. Welcome to the forge. Mind the sparks.\""],
    carpenter: ["\"Oh, hi hi! Mind the sawdust! Your hut could REALLY use some love, you know.\""],
    dojo: ["\"Breathe in. Breathe out. Now: what would you like to learn?\""],
    baker: ["\"Goku, dear! Fresh out of the oven, just for you. Take your pick!\""],
  };
  W.houseEntities = function () {
    const out = { market: [
      { type: "sign", id: "marketsign", x: 27, y: 8, text: ["MARKET STREET", "\"Every cat who moves in gets a house here. The empty lots on the south side are waiting...\""] },
    ] };
    for (const id in W.HOUSES) {
      out["in_" + id] = [{ type: "npc", id: "keeper_" + id, kind: W.VILLAGERS[id].kind, shopId: id, greet: GREETINGS[id], x: 5, y: 2, dir: "down" }];
    }
    return out;
  };

  /* ---------------- Mochi's shrine temple (Elderwood) ---------------- */
  W.buildShrineIn = function () {
    return interior("shrine_in", "fl_tatami", "wi_dojo", [[2, 0, "scrollwall"], [8, 0, "scrollwall"], [5, 1, "shrinealtar"], [1, 1, "bonsai"], [9, 1, "bonsai"], [1, 5, "torch"], [9, 5, "torch"]]);
  };

  /* ---------------- routes ---------------- */
  W.WARPS.push(
    { map: "overworld", x: 0, y: 10, toMap: "market", toX: 28, toY: 7, toDir: "left" },
    { map: "market", x: 29, y: 7, toMap: "overworld", toX: 1, toY: 10, toDir: "right" },
    { map: "ew_shrine", x: 13, y: 5, toMap: "shrine_in", toX: 5, toY: 6, toDir: "up" },
    { map: "shrine_in", x: 5, y: 7, toMap: "ew_shrine", toX: 13, toY: 6, toDir: "down" },
  );
  for (const id in W.HOUSES) {
    const h = W.HOUSES[id];
    W.WARPS.push(
      { map: "market", x: h.x + 1, y: h.y + 2, toMap: "in_" + id, toX: 5, toY: 6, toDir: "up", needFlag: "house_" + id,
        lockedText: ["An empty lot. Nobody lives here... yet."] },
      { map: "in_" + id, x: 5, y: 7, toMap: "market", toX: h.x + 1, toY: h.y + 3, toDir: "down" },
    );
  }

  // town: a path west to Market Street; the old stalls are gone (everyone has a house now)
  const buildOverworld = W.buildOverworld;
  W.buildOverworld = function () {
    const m = buildOverworld();
    m.object[10][0] = null;
    for (let x = 0; x <= 3; x++) m.ground[10][x] = "path";
    m.ground[9][3] = "path";
    m.object[11][1] = "sign";
    return m;
  };
  // the shrine gets a temple; Mochi waits inside it
  const buildEwShrine = W.buildEwShrine;
  W.buildEwShrine = function () {
    const m = buildEwShrine();
    for (let y = 5; y <= 9; y++) for (let x = 11; x <= 15; x++) { if (y < 7) m.ground[y][x] = "fgrass"; m.object[y][x] = null; }
    for (let x = 10; x <= 13; x++) m.ground[7][x] = "fdirt";
    m.ground[6][13] = "fdirt";
    const P = "h_dojo_";
    [[P + "roofL", P + "roofM", P + "roofC", P + "roofR"], [P + "wallL", P + "window", P + "sign", P + "wallR"], [P + "wallL", P + "door", P + "window", P + "wallR"]]
      .forEach((row, dy) => row.forEach((t, dx) => { m.object[3 + dy][12 + dx] = t; }));
    m.object[6][15] = "torch";
    return m;
  };
  const makeEntities = W.makeEntities;
  W.makeEntities = function () {
    const ent = makeEntities();
    ent.overworld = ent.overworld.filter(e => !(e.type === "shop" && e.shopId));          // stalls → houses
    ent.overworld.push({ type: "sign", id: "marketpost", x: 1, y: 11, text: ["← MARKET STREET", "Where the villagers you rescue set up house and shop."] });
    return ent;
  };
  const elderwoodEntities = W.elderwoodEntities;
  W.elderwoodEntities = function () {
    const ent = elderwoodEntities();
    const mochi = ent.ew_shrine.find(e => e.id === "mochi");
    ent.ew_shrine = ent.ew_shrine.filter(e => e !== mochi);
    mochi.x = 5; mochi.y = 3; mochi.dir = "down";
    ent.shrine_in = [mochi];
    return ent;
  };

  // build or clear houses to match who has moved in (called from applyRegion)
  const applyRegion = W.applyRegion;
  W.applyRegion = function (G) {
    applyRegion(G);
    for (const id in W.HOUSES) {
      const built = !!G.villagers[id];
      G.flags["house_" + id] = built;
      placeHouse(G.maps.market, W.HOUSES[id], built);
    }
  };

  W.PLACES = { market: "Market Street", in_smith: "Bramble's Forge", in_carpenter: "Hazel's Workshop",
               in_dojo: "Mochi's Dojo", in_baker: "Biscuit's Bakery", shrine_in: "Shrine Temple" };
})();
