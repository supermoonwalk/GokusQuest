/* ============================================================
   ui.js  —  HUD, full-screen map, dialogue, menus, title,
   cutscenes, ending. Combat/shop live in their own modules.
   ============================================================ */
(function () {
  function el(id) { return document.getElementById(id); }
  let D = null, typer = null;

  /* -------------------- DIALOGUE -------------------- */
  function showDialogue(name, lines, onDone) {
    if (!Array.isArray(lines)) lines = [lines];
    D = { name, lines, idx: 0, onDone, typing: false, full: "", shown: 0 };
    G.state = "dialogue";
    el("dialogue").classList.add("show");
    startLine();
  }
  function startLine() {
    const box = el("d-text"), nameEl = el("d-name");
    D.full = D.lines[D.idx];
    D.shown = 0; D.typing = true;
    if (D.name) { nameEl.textContent = D.name; nameEl.style.display = ""; }
    else { nameEl.style.display = "none"; }
    box.textContent = "";
    el("d-next").style.opacity = "0";
    clearInterval(typer);
    typer = setInterval(() => {
      D.shown++;
      box.textContent = D.full.slice(0, D.shown);
      if (D.shown >= D.full.length) { clearInterval(typer); D.typing = false; el("d-next").style.opacity = "1"; }
    }, 16);
  }
  function advanceDialogue() {
    if (!D) return;
    if (D.typing) {
      clearInterval(typer); D.shown = D.full.length;
      el("d-text").textContent = D.full; D.typing = false; el("d-next").style.opacity = "1";
      return;
    }
    D.idx++;
    if (D.idx < D.lines.length) startLine();
    else {
      el("dialogue").classList.remove("show");
      const cb = D.onDone; D = null;
      if (G.state === "dialogue") G.state = "play";
      if (cb) cb();
    }
  }

  /* -------------------- HUD (compact) -------------------- */
  const SP_ICON = { slam: "\u21BB", dash: "\u00BB", roar: "\u25C9" };
  function updateHud() {
    const p = G.player; if (!p) return;
    const hp = Math.max(0, p.hp);
    const pct = (hp / p.maxHp) * 100;
    const bar = el("hud-hp-bar");
    bar.style.width = pct + "%";
    bar.style.background = pct > 50 ? "#5fb85f" : pct > 22 ? "#e7c14b" : "#d65a5a";
    el("hud-hp-text").textContent = `${hp}/${p.maxHp}`;
    const cb = el("hud-chi-bar");
    if (cb) cb.style.width = (Math.max(0, Math.min(1, G.chi / G.maxChi)) * 100) + "%";
    el("hud-coins").textContent = G.coins;
    el("hud-treats").textContent = G.treats;
    // special slots
    ["J", "K"].forEach((label, i) => {
      const s = el("slot-" + i); if (!s) return;
      const id = G.specials[i];
      s.classList.toggle("empty", !id);
      s.querySelector(".slot-glyph").textContent = id ? (SP_ICON[id] || "?") : "\u2013";
      s.querySelector(".slot-cost").textContent = id ? World.SPECIALS[id].cost : "";
      const ready = id && G.chi >= World.SPECIALS[id].cost;
      s.classList.toggle("ready", !!ready);
    });
  }

  /* -------------------- FULL-SCREEN MAP -------------------- */
  let mmCtx = null;
  function toggleMap() {
    if (G.state === "map") { closeMap(); return; }
    if (G.state !== "play") return;
    G.state = "map";
    el("map-overlay").classList.add("show");
    drawMap();
  }
  function closeMap() {
    el("map-overlay").classList.remove("show");
    if (G.state === "map") G.state = "play";
  }
  function drawMap() {
    const cv = el("bigmap"); if (!cv) return;
    if (!mmCtx) { mmCtx = cv.getContext("2d"); mmCtx.imageSmoothingEnabled = false; }
    const map = G.maps[G.cur];
    const s = Math.max(2, Math.floor(Math.min(cv.width / map.w, cv.height / map.h)));
    const ox = Math.floor((cv.width - s * map.w) / 2);
    const oy = Math.floor((cv.height - s * map.h) / 2);
    mmCtx.fillStyle = "#1d1726"; mmCtx.fillRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      let c = "#7fb069";
      const gid = map.ground[y][x], oid = map.object[y][x];
      if (gid === "path" || gid === "matground") c = "#d8b88c";
      else if (gid === "strawmat") c = "#d8b45a";
      else if (gid === "water") c = "#6bb6d6";
      else if (gid === "floor" || gid === "rug") c = "#caa06a";
      else if (gid === "fgrass" || gid === "fgrass2") c = "#3f6b39";
      else if (gid === "fdirt") c = "#6b4f2c";
      else if (gid === "sfloor" || gid === "srug") c = "#caa06a";
      else if (gid === "dstone" || gid === "dstone2") c = "#2b2536";
      else if (gid === "dcarpet") c = "#6e2546";
      else if (gid === "dexit" || gid === "sexit") c = "#e8c34a";
      if (oid) {
        if (oid === "tree" || oid === "bush" || oid === "ftree" || oid === "fbush") c = "#1f3d1f";
        else if (oid === "flog" || oid === "stump") c = "#5a3f28";
        else if (oid === "farch") c = "#173016";
        else if (oid.indexOf("roof") === 0) c = "#b35a4f";
        else if (oid.indexOf("hutRoof") === 0) c = "#c89a4a";
        else if (oid.indexOf("hutWall") === 0 || oid === "hutWindow" || oid === "hutDoor") c = "#9c7448";
        else if (["scratchpost", "fishbowl", "cushion", "trophies"].includes(oid)) c = "#8a6a44";
        else if (oid.indexOf("dwall") === 0) c = "#0f0c17";
        else if (oid === "swall" || oid === "scounter" || oid === "swares" || oid === "crate" || oid === "barrel") c = "#5a4029";
        else if (oid === "dgate") c = "#8fe04a";
        else if (oid === "ddoor") c = "#3a2a1e";
        else if (oid === "pillar") c = "#3a3450";
        else if (oid === "torch" || oid === "brazier" || oid === "slamp") c = "#ffae3c";
        else if (oid.indexOf("throne") === 0 || oid === "banner") c = "#5e1f3e";
        else if (oid.indexOf("wall") === 0 || oid === "window" || oid === "door") c = "#8a6a44";
        else if (oid === "exitInt") c = "#e0c060";
      }
      mmCtx.fillStyle = c; mmCtx.fillRect(ox + x * s, oy + y * s, s, s);
    }
    for (const e of (G.entities[G.cur] || [])) {
      if (e.gone) continue;
      const ex = Math.floor((e.px || e.x * 16) / 16), ey = Math.floor((e.py || e.y * 16) / 16);
      let c = null;
      if (e.type === "monster" && e.alive) c = e.boss ? "#c46bd6" : "#d65a5a";
      else if (e.type === "npc") c = "#e2913f";
      else if (e.type === "shop") c = "#f0c64a";
      else if ((e.type === "gear" || e.type === "chest") && !e.taken) c = "#e8c34a";
      else if (e.type === "captive") c = e.kid ? "#9af0ff" : "#f2c0d0";
      if (c) { mmCtx.fillStyle = c; mmCtx.fillRect(ox + ex * s, oy + ey * s, s, s); }
    }
    const p = G.player;
    const px = Math.floor(p.px / 16), py = Math.floor(p.py / 16);
    mmCtx.fillStyle = "#fff7df"; mmCtx.fillRect(ox + px * s - 1, oy + py * s - 1, s + 2, s + 2);
  }

  /* -------------------- MENUS (quest / inventory) -------------------- */
  const ITEM_INFO = {
    ribbon: { name: "Chi Chi's Ribbon", desc: "Her favourite red ribbon. A promise to return it." },
    treat: { name: "Fish Treats", desc: "Crunchy dried sardines. Heals 14 HP (or press T)." },
  };
  function toggleMenu(which) {
    if (G.state === "menu" && G.menu === which) { closeMenu(); return; }
    if (G.state !== "play" && G.state !== "menu") return;
    G.menu = which; G.state = "menu";
    el("quest-panel").classList.toggle("show", which === "quest");
    el("inv-panel").classList.toggle("show", which === "inventory");
    if (which === "quest") renderQuest();
    if (which === "inventory") renderInventory();
  }
  function closeMenu() {
    el("quest-panel").classList.remove("show");
    el("inv-panel").classList.remove("show");
    G.menu = null; if (G.state === "menu") G.state = "play";
  }
  function renderQuest() {
    el("quest-title").textContent = World.QUEST.title;
    el("quest-current").textContent = World.QUEST.steps[G.quest];
    const log = el("quest-log"); log.innerHTML = "";
    const seen = World.QUEST.order || ["start", "searched", "deduced", "fighting", "boss"];
    const cur = seen.indexOf(G.quest);
    seen.forEach((k, i) => {
      if (i > cur) return;
      const li = document.createElement("div");
      li.className = "quest-item" + (i === cur ? " active" : " done");
      li.textContent = (i < cur ? "\u2713 " : "\u25B6 ") + World.QUEST.steps[k];
      log.appendChild(li);
    });
  }
  function renderInventory() {
    const grid = el("inv-grid"); grid.innerHTML = "";
    // equipped gear summary
    const p = G.player;
    const stat = el("inv-stats");
    stat.innerHTML = `ATK <b>${p.atk}</b> &middot; DEF <b>${p.def}</b> &middot; HP <b>${p.maxHp}</b> &middot; CHI <b>${G.maxChi}</b> &middot; SPD <b>${p.spd.toFixed(2)}</b>`;
    // equipped slots
    const eqWrap = el("inv-equip"); eqWrap.innerHTML = "";
    ["claws", "collar", "charm"].forEach(slot => {
      const inst = G.equipped[slot];
      const cell = document.createElement("div"); cell.className = "eq-cell" + (inst ? "" : " empty");
      const cv = document.createElement("canvas"); cv.width = 16; cv.height = 16; cv.className = "eq-icon";
      const cx = cv.getContext("2d"); cx.imageSmoothingEnabled = false;
      if (inst) Sprites2.drawGearIcon(cx, slot === "charm" ? "bell" : slot, 0, 0, 1);
      cell.appendChild(cv);
      const t = document.createElement("div"); t.className = "eq-txt";
      t.innerHTML = inst
        ? `<span style="color:${World.tierColor(inst.tier)}">${World.tierName(inst.tier)} ${World.GEAR[inst.gid].name}</span><small>${World.gearLine(inst)}</small>`
        : `<span class="dim">${slot} slot</span><small>empty</small>`;
      cell.appendChild(t); eqWrap.appendChild(cell);
    });
    // items
    const items = [];
    if (G.flags.ribbon) items.push("ribbon");
    if (G.treats > 0) items.push("treat");
    items.forEach(id => {
      const info = ITEM_INFO[id];
      const cell = document.createElement("div"); cell.className = "inv-cell";
      const cv = document.createElement("canvas"); cv.width = 16; cv.height = 16; cv.className = "inv-icon";
      const cx = cv.getContext("2d"); cx.imageSmoothingEnabled = false;
      if (id === "ribbon") Sprites.drawPixels(cx, Sprites.RIBBON.rows, Sprites.RIBBON.pal, 0, 0, 1, false);
      else drawTreatIcon(cx);
      cell.appendChild(cv);
      const nm = document.createElement("div"); nm.className = "inv-name";
      nm.textContent = info.name + (id === "treat" ? " x" + G.treats : "");
      const ds = document.createElement("div"); ds.className = "inv-desc"; ds.textContent = info.desc;
      cell.appendChild(nm); cell.appendChild(ds);
      if (id === "treat") {
        const full = p.hp >= p.maxHp;
        const b = document.createElement("button");
        b.className = "shop-buy inv-use" + (full ? " broke" : "");
        b.textContent = full ? "HP FULL" : "EAT";
        b.disabled = full;
        b.addEventListener("click", () => { if (Engine.useTreat()) renderInventory(); });
        cell.classList.add("has-use"); cell.appendChild(b);
      }
      grid.appendChild(cell);
    });
    if (!items.length) {
      const empty = document.createElement("div"); empty.className = "inv-desc"; empty.textContent = "Nothing in your bag yet.";
      grid.appendChild(empty);
    }
  }
  function drawTreatIcon(cx) {
    const pal = { o:"#7a5230", b:"#d8a85a", h:"#f0d28a", e:"#5a5560" };
    const rows = [
      "................","................","......oo........",".....obbo.......",
      "....obhbbo......","...obhbbbbo.....","..obhbbbbbo.....","..obbbbbbeo.....",
      "..obbbbbeo......",".obbbbbeo.......",".obbbbeo........","..obbeo.........",
      "...oeo..........","................","................","................",
    ];
    Sprites.drawPixels(cx, rows, pal, 0, 0, 1, false);
  }

  /* -------------------- TRANSITION -------------------- */
  function flashTransition() {
    const f = el("fade"); f.classList.remove("anim"); void f.offsetWidth; f.classList.add("anim");
  }

  /* -------------------- TITLE -------------------- */
  function drawTitleCat() {
    const cv = el("title-cat"); if (!cv) return;
    const cx = cv.getContext("2d"); cx.imageSmoothingEnabled = false;
    cx.clearRect(0, 0, cv.width, cv.height);
    Sprites.drawCat(cx, "goku", "down", 0, 0, { scale: 6 });
  }
  // title menu: CONTINUE (only with a save) / NEW GAME
  let titleSel = 0, confirmNew = false;
  function titleOptions() {
    return Array.from(document.querySelectorAll(".title-opt")).filter(b => b.style.display !== "none");
  }
  function initTitleMenu() {
    const hasSave = Save.has();
    el("opt-continue").style.display = hasSave ? "" : "none";
    el("opt-new").textContent = "NEW GAME";
    titleSel = 0; confirmNew = false;
    renderTitleMenu();
  }
  function renderTitleMenu() {
    titleOptions().forEach((b, i) => b.classList.toggle("sel", i === titleSel));
  }
  function moveTitleSel(d) {
    const n = titleOptions().length;
    titleSel = (titleSel + d + n) % n;
    if (confirmNew) { confirmNew = false; el("opt-new").textContent = "NEW GAME"; }
    renderTitleMenu();
  }
  function chooseTitle(act) {
    if (G.state !== "title") return;
    if (!act) { const b = titleOptions()[titleSel]; act = b && b.dataset.act; }
    if (act === "continue") { continueGame(); return; }
    if (act === "new") {
      // starting over wipes the save: ask once
      if (Save.has() && !confirmNew) {
        confirmNew = true; el("opt-new").textContent = "OVERWRITE SAVE?";
        titleSel = titleOptions().indexOf(el("opt-new")); renderTitleMenu();
        return;
      }
      Save.clear(); startGame();
    }
  }
  function continueGame() {
    if (!Save.load()) { initTitleMenu(); return; }
    el("title").classList.remove("show");
    G.state = "play";
    Engine.updateCamera(); updateHud();
    // saved right after entering the manor, before the chapter card finished
    if (G.flags.enteredManor && !G.flags.learnedSlam) { showChapterCard(); return; }
    showDialogue(null, ["Welcome back, Goku. Chi Chi is still out there."]);
  }
  let savedTimer = null;
  function showSaved() {
    const t = el("save-toast"); if (!t) return;
    t.classList.add("show");
    clearTimeout(savedTimer); savedTimer = setTimeout(() => t.classList.remove("show"), 1200);
  }

  function startGame() {
    el("title").classList.remove("show");
    G.state = "play"; updateHud();
    showDialogue("Goku", [
      "*Goku stretches on his scratchy straw mat. His hut is bare: no bed, no shelves, nothing.*",
      "One day I'll make this place cosy. Whiskers sells furniture at his market...",
      "Chi Chi didn't show up for breakfast. She NEVER misses fish day.",
      "My little sister... something's wrong. I'd better check her cottage.",
      "(WASD/Arrows move \u00b7 SPACE swipe \u00b7 E interact \u00b7 J/K specials \u00b7 T treat \u00b7 M map)"
    ]);
  }

  /* -------------------- CHAPTER II CARD -------------------- */
  let _chTimer = null;
  function showChapterCard() {
    G.state = "cutscene";
    el("chapter2").classList.add("show");
    const cv = el("ch2-art");
    if (cv) {
      const cx = cv.getContext("2d"); cx.imageSmoothingEnabled = false;
      cx.clearRect(0, 0, cv.width, cv.height);
      Sprites2.drawVesper(cx, 18, 12, 6, { t: 0 });
    }
    clearTimeout(_chTimer); _chTimer = setTimeout(endChapterCard, 8000);
  }
  function endChapterCard() {
    const c = el("chapter2");
    if (!c.classList.contains("show")) return;
    clearTimeout(_chTimer);
    c.classList.remove("show");
    G.state = "play";
    if (!G.flags.learnedSlam) {
      G.flags.learnedSlam = true;
      Shop.unlockSpecial("slam");
      // guarantee the signature move is actually bound to a key
      if (!G.specials.includes("slam")) G.specials[0] = "slam";
      const slot = G.specials.indexOf("slam");
      const key = slot === 1 ? "K" : "J";
      updateHud();
      showDialogue("Goku", [
        "So many heavy doors... and so many cages.",
        "Goku remembers the game he and Chi Chi played as kittens: spin around, and SLAM the door shut. He KNOWS this one.",
        "NEW SPECIAL: 180 DOOR SLAM! Build CHI by swiping foes, then press " + key + " to unleash a spinning slam.",
        "(Reassign your specials any time at Whiskers' shop.) Free every kitten. Reach the throne. End the Cat Lady."
      ]);
    }
  }

  /* -------------------- FINALE -------------------- */
  // ending card: Goku, Chi Chi and the kittens walk home through a dawn meadow
  let endAnim = null;
  function showFinale() {
    G.state = "ending";
    Save.clear();             // story complete: next boot starts fresh
    el("ending").classList.add("show");
    el("ending-title").textContent = "HOME AT LAST";
    const freed = (Engine.freedCount ? Engine.freedCount() : 0);
    el("ending-text").innerHTML =
      "Madame Vesper is gone, and every lock in her manor gave way with her.<br>" +
      "Goku leads Chi Chi and all five kittens out into the dawn" +
      (freed > 0 ? " \u2014 <b>" + freed + "</b> of them freed by his own paws" : "") + ".<br>" +
      "Tonight, the whole meadow will be purring.";
    const cv = el("ending-cats"); if (!cv) return;
    const cx = cv.getContext("2d"); cx.imageSmoothingEnabled = false;
    const W = cv.width, H = cv.height, GROUND = H - 18;
    const party = ["goku", "chichi"].concat(Sprites2.KITTEN_KINDS);
    let f = 0;
    cancelAnimationFrame(endAnim);
    (function frame() {
      if (G.state !== "ending") return;
      f++;
      // sky warms up over the first seconds
      const k = Math.min(1, f / 240);
      const sky = cx.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, k < 0.5 ? "#4a3a52" : "#7a6a9a");
      sky.addColorStop(1, k < 0.5 ? "#c98a9a" : "#f6c99a");
      cx.fillStyle = sky; cx.fillRect(0, 0, W, GROUND);
      // rising sun
      const sunY = GROUND + 6 - k * 34;
      cx.fillStyle = "#ffd98a"; cx.beginPath(); cx.arc(W - 46, sunY, 13, 0, 6.28); cx.fill();
      cx.fillStyle = "#fff0c4"; cx.beginPath(); cx.arc(W - 46, sunY, 8, 0, 6.28); cx.fill();
      // far hills (slow parallax)
      cx.fillStyle = "#6a8a5a";
      for (let i = -1; i < 5; i++) {
        const hx = ((i * 64 - f * 0.15) % (W + 64) + W + 64) % (W + 64) - 32;
        cx.beginPath(); cx.arc(hx, GROUND + 6, 30, Math.PI, 0); cx.fill();
      }
      // meadow + scrolling flowers
      cx.fillStyle = "#7fb069"; cx.fillRect(0, GROUND, W, H - GROUND);
      cx.fillStyle = "#6a9a58"; cx.fillRect(0, GROUND, W, 1);
      for (let i = 0; i < 14; i++) {
        const fx = ((i * 23 - f * 0.6) % W + W) % W, fy = GROUND + 4 + (i * 7) % 12;
        cx.fillStyle = i % 3 ? "#f2c0d0" : "#ffe08a"; cx.fillRect(Math.round(fx), fy, 2, 2);
      }
      // the party walks right (in place, with a bob)
      const XS = [118, 86, 66, 50, 34, 18, 2];          // Goku, Chi Chi, then the kittens
      party.forEach((kind, i) => {
        const x = XS[i], sc = i < 2 ? 2 : 1;
        const bob = Math.floor((f + i * 7) / 8) % 2;
        Sprites.drawCat(cx, kind, "right", x, GROUND - 16 * sc + 2, { scale: sc, bob: -bob });
      });
      // hearts drifting up from the pair
      if (f % 50 === 0 || f === 1) heartsEnd.push({ x: 112 + Math.random() * 12, y: GROUND - 36, t: 0 });
      for (const h of heartsEnd) { h.t++; Sprites.drawHeart(cx, Math.round(h.x), Math.round(h.y - h.t * 0.3), 1, true); }
      heartsEnd = heartsEnd.filter(h => h.t < 90);
      endAnim = requestAnimationFrame(frame);
    })();
  }
  let heartsEnd = [];

  window.UI = {
    showDialogue, advanceDialogue, updateHud,
    toggleMenu, closeMenu, toggleMap, closeMap, drawMap,
    flashTransition, startGame, drawTitleCat,
    initTitleMenu, moveTitleSel, chooseTitle, continueGame, showSaved,
    showChapterCard, endChapterCard, showFinale,
    get dialogueOpen() { return !!D; },
  };
})();
