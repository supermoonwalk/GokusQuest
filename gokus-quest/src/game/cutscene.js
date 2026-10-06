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
  const walkTo = (ent, target, near, speed) => () => {
    const tx = target().x, ty = target().y;
    const dx = tx - ent.px, dy = ty - ent.py, d = Math.hypot(dx, dy);
    if (d <= near) { ent.moving = false; return true; }
    const sp = Math.min(speed, d - near);
    Engine.moveEntity(ent, dx / d * sp, dy / d * sp, { ox: 3, oy: 7, w: 10, h: 8 });
    ent.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
    ent.moving = true;
    return false;
  };
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
    p.atkTimer = 0; p.spin = 0; p.moving = false; G.keys = {};

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

  window.Cutscene = { start, update, finale, get active() { return !!steps; } };
})();
