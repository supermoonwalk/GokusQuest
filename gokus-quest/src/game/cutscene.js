/* ============================================================
   cutscene.js  —  Scripted in-world scenes. A scene is a list of
   steps; each step is a function called once per update that
   returns true when it's finished. Runs while G.state is
   "cutscene" (or "dialogue" opened by a step).
   ============================================================ */
(function () {
  const TS = 16;
  let steps = null, idx = 0, t = 0, waiting = false;

  function start(list) {
    steps = list; idx = 0; t = 0; waiting = false;
    G.state = "cutscene"; G.scene = true;
  }
  function finish() { steps = null; G.scene = false; }

  function update() {
    // tick per-entity animation timers used by scenes (hop, rattle, fades)
    for (const e of (G.entities[G.cur] || [])) {
      if (e.hop > 0) e.hop--;
      if (e.shake > 0) e.shake--;
    }
    if (!steps || waiting) return;
    const step = steps[idx];
    if (!step) { finish(); return; }
    if (step(t++)) { idx++; t = 0; }
  }

  /* ---------- step helpers ---------- */
  const wait = (n) => (t) => t >= n;
  const run = (fn) => () => { fn(); return true; };
  // show a dialogue and resume the scene when it's closed
  const say = (name, lines) => () => {
    waiting = true;
    UI.showDialogue(name, lines, () => { waiting = false; G.state = "cutscene"; });
    return true;
  };
  // walk an entity toward a pixel target; done when within `near` px
  const walkTo = (ent, target, near, speed) => (t) => {
    const tx = target().x, ty = target().y;
    const dx = tx - ent.px, dy = ty - ent.py, d = Math.hypot(dx, dy);
    if (d <= near || t > 150) { ent.moving = false; return true; }   // give up if something's in the way
    const sp = Math.min(speed, d - near);
    Engine.moveEntity(ent, dx / d * sp, dy / d * sp, { ox: 3, oy: 7, w: 10, h: 8 });
    ent.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
    ent.moving = true;
    return false;
  };
  // camera: ease to a pixel point / back to Goku (done once it has settled)
  const panTo = (x, y, frames) => (t) => { G.camFocus = { x, y }; return t >= (frames || 50); };
  const panBack = () => (t) => { if (t === 0) { G.camFocus = null; G.camEase = true; } return !G.camEase || t > 90; };
  // fade G.dim (manor darkness) to a value over n frames
  const dimTo = (v, n) => { let from = 0; return (t) => {
    if (t === 0) from = G.dim || 0;
    G.dim = from + (v - from) * Math.min(1, t / n); return t >= n; }; };
  const flash = (color) => G.fx.push({ kind: "flash", color, t: 0, life: 18 });
  const smoke = (x, y, color, n) => { for (let i = 0; i < (n || 6); i++)
    G.fx.push({ kind: "smoke", x: x + (i * 7 % 13) - 6, y: y + (i * 5 % 9) - 4, color, t: -i * 3, life: 40 }); };
  const face = (e, target) => {
    const dx = target.px - e.px, dy = target.py - e.py;
    e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
  };
  const freeze = () => {
    const p = G.player;
    p.atkTimer = 0; p.spin = 0; p.moving = false; p.iframes = 0; p.hurtFlash = 0; G.keys = {};
    G.fx = G.fx.filter(f => f.kind !== "hex");
  };
  const centre = (e) => ({ x: e.px + 8, y: e.py + 8 });
  const poof = (x, y) => G.fx.push({ kind: "poof", x, y, t: 0, life: 14 });
  const heart = (x, y) => G.fx.push({ kind: "heart", x, y, t: 0, life: 70 });

  /* ---------- FINALE: Goku & Chi Chi reunited ---------- */
  function finale() {
    const p = G.player;
    const ents = G.entities.manor;
    const chichi = ents.find(e => e.id === "chichi2");
    const kits = ents.filter(e => e.kid);
    // hexes from the fight vanish, and her minions flee into the dark
    G.fx = G.fx.filter(f => f.kind !== "hex");
    for (const m of ents) if (m.type === "monster" && m.alive) {
      m.alive = false; m.dead = true; poof(m.px + 8, m.py + 8);
    }
    p.atkTimer = 0; p.spin = 0; p.moving = false; p.iframes = 0; p.hurtFlash = 0; G.keys = {};

    const list = [
      wait(45),
      run(() => {
        // with Vesper gone, every lock in the manor gives way
        chichi.caged = false; poof(chichi.px + 8, chichi.py + 8);
        for (const k of kits) if (k.caged) k.caged = false;
        Combat.popText(chichi.px, chichi.py - 6, "!", "#ffe08a");
      }),
      wait(30),
      walkTo(chichi, () => ({ x: p.px + (chichi.px < p.px ? -13 : 13), y: p.py }), 1.5, 1.1),
      run(() => {
        chichi.dir = chichi.px < p.px ? "right" : "left";
        p.dir = chichi.px < p.px ? "left" : "right";
        heart(p.px + 4, p.py - 6); heart(chichi.px + 4, chichi.py - 6);
      }),
      wait(40),
      say("Chi Chi", [
        "Goku! I knew you'd come. I just KNEW it.",
        "...You're covered in scratches. Did you fight the WHOLE forest?",
      ]),
      say("Goku", ["Only the parts that got in the way."]),
    ];
    if (G.flags.ribbon) {
      list.push(say("Goku", ["Oh — I kept this safe for you.",
        "*Goku ties the red ribbon back around Chi Chi's ear.*"]));
      list.push(run(() => heart(chichi.px + 4, chichi.py - 8)));
      list.push(say("Chi Chi", ["My ribbon! You found it! ♥"]));
    }
    // the kittens come running, one after another, and gather around them
    const spots = [[-26, 14], [-12, 22], [4, 24], [20, 20], [32, 10]];
    kits.forEach((k, i) => {
      list.push(run(() => {
        const [ox, oy] = spots[i % spots.length];
        k.px = p.px + ox; k.py = p.py + oy; k.dir = "up";
        poof(k.px + 8, k.py + 8);
      }));
      list.push(wait(12));
    });
    list.push(say("Chi Chi", [
      "And look — everyone's free! Boots, Patches, Mittens, Smol, Pip...",
      "Let's take them all home, big brother.",
    ]));
    list.push(run(() => { for (let i = 0; i < 6; i++) heart(p.px - 20 + i * 10, p.py - 4 - (i % 2) * 6); }));
    list.push(wait(70));
    list.push(run(() => UI.flashTransition()));
    list.push(wait(14));
    list.push(run(() => { finish(); UI.showFinale(); }));
    start(list);
  }

  /* ---------- TOM: first meeting in his clearing ---------- */
  function tomIntro(tom) {
    const p = G.player;
    const cage = G.entities.forest.find(e => e.id === "chichi");
    freeze();
    tom.dir = "up";                          // facing his prize when you arrive
    const mid = { x: (tom.px + cage.px) / 2 + 8, y: (tom.py + cage.py) / 2 + 8 };
    start([
      panTo(mid.x, mid.y, 55),
      run(() => { cage.shake = 40; }),
      say("Chi Chi", ["*rattling the bars* GOKU! Over here!"]),
      run(() => { face(tom, p); tom.hop = 14; Combat.popText(tom.px + 4, tom.py - 8, "!", "#ffe08a"); }),
      wait(24),
      say("Tuxedo Tom", ["\"Well, well. Big brother came sniffing after all.\"",
        "\"She's spoken for, kid. Turn around \u2014 or I'll send you home in pieces.\""]),
      walkTo(tom, () => ({ x: p.px + 20, y: p.py }), 6, 1.4),
      run(() => { tom.hop = 14; }),
      panBack(),
      run(() => { finish(); G.state = "play"; tom.state = "chase"; tom.stateT = 0; tom.atkCD = 50; }),
    ]);
  }

  /* ---------- after Tom: Vesper takes Chi Chi, the manor gate opens ---------- */
  function vesperReveal(tom) {
    const cage = G.entities.forest.find(e => e.id === "chichi");
    const vesper = { type: "actor", kind: "vesper", px: cage.px - 40, py: cage.py + 6, alpha: 0, dir: "right" };
    // Tom stays on screen, beaten, for the scene
    const body = { type: "actor", kind: World.MONSTERS.boss.kind, px: tom.px, py: tom.py, dir: "down" };
    freeze();
    start([
      run(() => G.entities.forest.push(body)),
      wait(45),
      panTo(tom.px + 8, tom.py + 8, 30),
      say("Tuxedo Tom", ["Tom slumps, beaten. \"Heh... you think I'M the one to fear?\"",
        "\"I only FETCH for her. The Mistress wanted your sister... special.\""]),
      run(() => { G.entities.forest.push(vesper); flash("#8a4ab0"); smoke(vesper.px + 8, vesper.py + 8, "#5a2d6e", 8); }),
      (t) => { vesper.alpha = Math.min(1, t / 30); return t >= 30; },
      panTo(vesper.px + 24, vesper.py + 4, 40),
      say("???", ["A cold voice. A heavy cloud of lavender.",
        "\"Such a darling little tabby. She'll look perfect in my collection.\""]),
      say("Madame Vesper", ["\"I am Madame Vesper. Every stray belongs to me \u2014 and now, so does she.\""]),
      // she glides to the cage
      (t) => { const tx = cage.px - 14, dx = tx - vesper.px, dy = cage.py - vesper.py;
        vesper.px += Math.sign(dx) * Math.min(Math.abs(dx), 0.8); vesper.py += Math.sign(dy) * Math.min(Math.abs(dy), 0.6);
        return Math.abs(dx) < 1 && Math.abs(dy) < 1; },
      run(() => { cage.shake = 50; }),
      say("Chi Chi", ["GOKU \u2014!"]),
      run(() => { flash("#5a2d6e"); smoke(vesper.px + 8, vesper.py + 8, "#3f1f50", 10); smoke(cage.px + 8, cage.py + 8, "#3f1f50", 10); }),
      wait(10),
      run(() => { cage.gone = true; G.entities.forest = G.entities.forest.filter(e => e !== vesper); }),
      wait(30),
      // Tom slinks off into the trees after his mistress
      run(() => { smoke(body.px + 8, body.py + 8, "#3b3340", 6); }),
      wait(8),
      run(() => { G.entities.forest = G.entities.forest.filter(e => e !== body); }),
      wait(30),
      // the dark gate grinds open at the east edge of the clearing
      panTo(26 * TS + 8, 9 * TS + 8, 45),
      run(() => { World.openManorGate(G); flash("#2a1338"); smoke(26 * TS + 8, 9 * TS + 10, "#2a1338", 10); }),
      wait(40),
      say(null, ["To the EAST, a dark MANOR GATE grinds open.",
        "Stock up at Whiskers' shop, then go after them. This is far from over."]),
      panBack(),
      run(() => { finish(); G.state = "play"; }),
    ]);
  }

  /* ---------- VESPER: rising from her throne ---------- */
  function vesperIntro(v) {
    const p = G.player;
    const minions = G.entities.manor.filter(e => e.type === "monster" && e.alive && e !== v);
    const freed = Engine.freedCount();
    freeze();
    start([
      panTo(v.px + 8, v.py + 16, 50),
      dimTo(1, 40),
      say(null, ["The torches gutter. That lavender smell again \u2014 the same as the teacup in Chi Chi's cottage."]),
      run(() => { v.hop = 14; flash("#8a4ab0"); smoke(v.px + 8, v.py + 12, "#5a2d6e", 8); }),
      wait(30),
      say("Madame Vesper", [freed >= 5
        ? "\"You emptied my cages. Every last one. Do you know how long that collection took me?\""
        : "\"Tom failed me. My shadows failed me. How tiresome.\""]),
      // every shadow in the manor turns toward Goku
      run(() => { for (const m of minions) { face(m, p); m.hop = 14; Combat.popText(m.px + 4, m.py - 8, "!", "#ff7ad0"); } }),
      wait(30),
      say("Madame Vesper", ["\"No matter. Your sister stays \u2014 and you, little hero, will make a lovely new centrepiece.\""]),
      dimTo(0, 30),
      panBack(),
      run(() => { finish(); G.state = "play"; v.state = "chase"; v.stateT = 0; v.atkCD = 60; }),
    ]);
  }

  /* ---------- THORNMANE: the Wild King in his den ---------- */
  function wildKingIntro(k) {
    const p = G.player;
    freeze();
    k.dir = "up";                                   // busy sharpening his claws on the wall
    start([
      panTo(k.px + 8, k.py + 4, 50),
      run(() => { k.shake = 40; }),
      say(null, ["*SCRRRITCH. SCRRRITCH.* Something enormous is scratching deep grooves into the den wall."]),
      run(() => { face(k, p); k.hop = 14; G.fx.push({ kind: "flash", color: "#ffb03a", t: 0, life: 14 });
        Combat.popText(k.px - 6, k.py - 14, "!!", "#ffb03a"); }),
      wait(24),
      say("Thornmane", [
        "\"WHO. DARES. Who dares set paw in MY den?!\"",
        "\"This wood is MINE. That river is MINE. The shrine, the glade, the town beyond \u2014 all of it, MINE!\"",
        "\"You broke my tree. You beat my guards. You LOOK at me like an EQUAL?!\""]),
      say("Goku", ["The forest doesn't belong to anyone. Least of all to a bully."]),
      run(() => { k.hop = 14; k.shake = 30; Combat.popText(k.px - 6, k.py - 14, "ROAR!", "#ff5a3a"); flash("#ff5a3a"); }),
      say("Thornmane", ["\"BULLY?! I am the KING of the Elderwood! Kneel... or be CRUSHED!\""]),
      panBack(),
      run(() => { finish(); G.state = "play"; k.state = "chase"; k.stateT = 0; k.atkCD = 40; k.anger = 2; k.angerT = 180; }),
    ]);
  }
  function wildKingDefeat(k) {
    // he stays on screen, beaten (actor drawn at his size)
    const body = { type: "actor", kind: "wildking", scale: 2, px: k.px, py: k.py, dir: "down" };
    freeze();
    start([
      run(() => G.entities[G.cur].push(body)),
      wait(45),
      panTo(k.px + 8, k.py + 4, 30),
      say("Thornmane", [
        "*the giant cat sinks to the ground, panting*",
        "\"...You didn't run. Everyone runs. The wildcats, the moss lurkers, even the old shrine cat.\"",
        "\"I thought... if they all feared me, nobody could ever take anything from me again.\""]),
      say("Goku", ["Nobody needs to own the forest. You could just... live in it. With everyone else."]),
      say("Thornmane", [
        "*a long, grumbling silence* \"...Hmph. Fine. The wood is everyone's. Don't let it go to your head, little king.\"",
        "\"But hear this: I am not the only one who claims what isn't theirs. Down by the sea, in ZEELAND,\"",
        "\"the Tide Queen says every wave and every fish belongs to HER. The coast road runs SOUTH of your town.\""]),
      run(() => { smoke(body.px + 8, body.py + 8, "#5a3a1c", 8); }),
      wait(10),
      run(() => { G.entities[G.cur] = G.entities[G.cur].filter(e => e !== body); }),
      wait(30),
      say(null, ["Thornmane lumbers off into the trees. The Elderwood is free.",
        "NEW: a sign now marks the coast road to ZEELAND, south of town."]),
      panBack(),
      run(() => { finish(); G.state = "play"; Engine.setQuest("zeeland"); Engine.applyVillagers(); Save.checkpoint(); }),
    ]);
  }

  window.Cutscene = { start, update, finale, tomIntro, vesperReveal, vesperIntro, wildKingIntro, wildKingDefeat, get active() { return !!steps; } };
})();
