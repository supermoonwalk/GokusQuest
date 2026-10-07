/* ============================================================
   main.js  —  Bootstrap: scaling, input, the rAF game loop.
   ============================================================ */
(function () {
  let canvas, ctx;

  function resize() {
    const stage = document.getElementById("stage");
    const vp = document.getElementById("viewport");
    const availW = stage.clientWidth, availH = stage.clientHeight;
    const scale = Math.max(1, Math.min(availW / Engine.VPW, availH / Engine.VPH));
    const w = Math.round(Engine.VPW * scale), h = Math.round(Engine.VPH * scale);
    vp.style.width = w + "px"; vp.style.height = h + "px";
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    vp.style.setProperty("--scale", scale);
  }

  const DIR = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right",
  };

  function onKeyDown(e) {
    const k = e.key;
    if (G.state === "title") {
      if (k === "Enter" || k === " ") { e.preventDefault(); UI.chooseTitle(); }
      else if (DIR[k] === "up" || DIR[k] === "left") { e.preventDefault(); UI.moveTitleSel(-1); }
      else if (DIR[k] === "down" || DIR[k] === "right") { e.preventDefault(); UI.moveTitleSel(1); }
      return;
    }
    if (G.state === "ending") { if (k === "Enter" || k === " ") { e.preventDefault(); UI.afterEnding(); } return; }
    if (G.state === "cutscene") { if (k === "Enter" || k === " ") { e.preventDefault(); UI.endChapterCard(); } return; }
    if (G.state === "dialogue") { if (k === "Enter" || k === " " || k === "e" || k === "E") { e.preventDefault(); UI.advanceDialogue(); } return; }
    if (G.state === "shop") { if (k === "Escape" || k === "e" || k === "E") { e.preventDefault(); Shop.close(); } return; }
    if (G.state === "map") { if (k === "Escape" || k === "m" || k === "M") { e.preventDefault(); UI.closeMap(); } return; }

    // menus
    if (k === "q" || k === "Q") { e.preventDefault(); UI.toggleMenu("quest"); return; }
    if (k === "i" || k === "I") { e.preventDefault(); UI.toggleMenu("inventory"); return; }
    if (k === "m" || k === "M") { e.preventDefault(); UI.toggleMap(); return; }
    if (k === "Escape") { UI.closeMenu(); return; }
    if (G.state === "menu") { if (k === "Enter" || k === " ") { e.preventDefault(); UI.closeMenu(); } return; }

    // play
    if (DIR[k]) { e.preventDefault(); G.keys[DIR[k]] = true; return; }
    if (e.repeat) return;
    if (k === " ") { e.preventDefault(); Combat.playerAttack(); }
    else if (k === "e" || k === "E") { e.preventDefault(); Engine.interact(); }
    else if (k === "j" || k === "J" || k === "1") { e.preventDefault(); Combat.useSpecial(0); }
    else if (k === "k" || k === "K" || k === "2") { e.preventDefault(); Combat.useSpecial(1); }
    else if (k === "t" || k === "T") { e.preventDefault(); Engine.useTreat(); }
  }
  function onKeyUp(e) { if (DIR[e.key]) G.keys[DIR[e.key]] = false; }

  // fixed timestep: game logic always runs at 60 updates/s, whatever the
  // monitor refresh rate; rendering happens once per animation frame.
  const STEP = 1000 / 60;
  const MAX_STEPS = 5;               // after a long stall (tab hidden), don't fast-forward
  let last = 0, acc = 0;

  function loop(now) {
    if (!last) last = now;
    acc += Math.min(now - last, STEP * MAX_STEPS);
    last = now;
    let stepped = false;
    while (acc >= STEP) { Engine.update(); acc -= STEP; stepped = true; }
    if (stepped && G.state !== "title" && G.maps[G.cur]) {
      Engine.render(ctx);
      if (G.state === "map") UI.drawMap();
      UI.updateHud();
    }
    requestAnimationFrame(loop);
  }

  function boot() {
    canvas = document.getElementById("game");
    canvas.width = Engine.VPW; canvas.height = Engine.VPH;
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    Engine.init();
    UI.drawTitleCat();
    UI.initTitleMenu();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", resize);
    window.addEventListener("blur", () => { G.keys = {}; });

    document.querySelectorAll(".title-opt").forEach(b => b.addEventListener("click", () => UI.chooseTitle(b.dataset.act)));
    document.getElementById("dialogue").addEventListener("click", () => { if (G.state === "dialogue") UI.advanceDialogue(); });

    document.getElementById("btn-quest").addEventListener("click", () => UI.toggleMenu("quest"));
    document.getElementById("btn-bag").addEventListener("click", () => UI.toggleMenu("inventory"));
    document.getElementById("btn-map").addEventListener("click", () => UI.toggleMap());
    document.querySelectorAll(".panel-close").forEach(b => b.addEventListener("click", () => { UI.closeMenu(); UI.closeMap(); Shop.close(); }));

    // on-screen action buttons (touch)
    const ab = document.getElementById("btn-attack"); if (ab) ab.addEventListener("click", () => Combat.playerAttack());
    const eb = document.getElementById("btn-act"); if (eb) eb.addEventListener("click", () => Engine.interact());

    resize();
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
