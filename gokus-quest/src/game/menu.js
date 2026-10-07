/* ============================================================
   menu.js  —  Pause menu (Esc): resume, save, save files,
   settings, co-op (coming soon), back to title. Also the slot
   picker on the title screen (NEW GAME when all slots are full,
   LOAD GAME). Settings persist in localStorage.
   Keyboard: arrows/WASD move, Enter/Space/E choose, Esc back.
   ============================================================ */
(function () {
  const SETTINGS_KEY = "gokusquest.settings";
  const DEFAULTS = { textSpeed: "normal", flashes: true, autosave: true };
  function loadSettings() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) {}
    G.settings = Object.assign({}, DEFAULTS, s);
  }
  function storeSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(G.settings)); } catch (e) {} }
  loadSettings();

  // friendly names for the save-file list
  const PLACES = {
    overworld: "Town", home: "Goku's Hut", shop: "Whiskers' Market", interior: "Chi Chi's Cottage",
    forest: "Whiskerwood", hollow: "Thornhollow", grounds: "Vesper's Grounds", manor: "Vesper's Throne Hall",
    ew_gate: "Elderwood Gate", ew_crossing: "Mossy Crossing", ew_shrine: "Elderwood Shrine",
    oak_roots: "Hollow Oak", oak_heart: "Hollow Oak (heart)", ew_glade: "Sunlit Glade", ew_thorn: "Thornmaze",
    ew_overlook: "Overlook", den_a: "Kingsroot Den", den_b: "Thornmane's Lair",
    zl_road: "Coast Road", zl_harbor: "Harbor", zl_dike: "The Dike", zl_cove: "Hidden Cove", zl_flats: "Tidal Flats",
    zl_island: "The Island", lh_a: "Lighthouse", lh_b: "Lighthouse (top)", palace_a: "Sunken Palace",
    palace_b: "Tide Queen's Hall",
  };
  const place = (m) => PLACES[m] || (World.PLACES && World.PLACES[m]) || m;
  function playtime(frames) {
    const min = Math.floor(frames / 3600), h = Math.floor(min / 60);
    return h ? h + "h " + String(min % 60).padStart(2, "0") + "m" : min + " min";
  }
  function when(at) {
    const d = new Date(at);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function el(id) { return document.getElementById(id); }
  let view = null, ctx = "pause", sel = 0, note = "", confirm = null;

  /* ---------------- open / close ---------------- */
  function openPause() {
    if (G.state !== "play") return;
    G.state = "pause"; ctx = "pause"; G.keys = {};
    show("main");
  }
  function openTitlePicker(mode) {               // mode: "new" | "load"
    ctx = "title"; show(mode === "new" ? "newSlot" : "loadSlot");
  }
  function close() {
    el("pause-panel").classList.remove("show");
    view = null; confirm = null;
    if (G.state === "pause") G.state = "play";
  }
  function isOpen() { return !!view; }
  function back() {
    if (confirm) { confirm = null; render(); return; }
    if (view === "main" || ctx === "title") close();
    else show("main");
  }
  function show(v) { view = v; sel = 0; note = ""; confirm = null; el("pause-panel").classList.add("show"); render(); }

  /* ---------------- views ---------------- */
  function button(label, onClick, opts) {
    const b = document.createElement("button");
    b.className = "menu-btn" + (opts && opts.cls ? " " + opts.cls : "");
    b.innerHTML = label;
    if (opts && opts.disabled) b.disabled = true;
    else b.addEventListener("click", onClick);
    return b;
  }
  function slotCard(n, actions) {
    const i = Save.info(n);
    const card = document.createElement("div"); card.className = "slot-card" + (n === Save.getSlot() && ctx === "pause" ? " current" : "");
    card.innerHTML = i
      ? `<div class="slot-head">SLOT ${n}${n === Save.getSlot() && ctx === "pause" ? " <small>(playing)</small>" : ""}</div>
         <div class="slot-place">${place(i.cur)}</div>
         <div class="slot-quest">${(World.QUEST.steps[i.quest] || "").replace(/^Chapter III: /, "")}</div>
         <div class="slot-meta">⏱ ${playtime(i.time)} &middot; <span class="coin-i"></span>${i.coins} &middot; kitties ${i.kitties} &middot; ${when(i.at)}</div>`
      : `<div class="slot-head">SLOT ${n}</div><div class="slot-place dim">— empty —</div>`;
    const row = document.createElement("div"); row.className = "slot-acts";
    actions(i).forEach(b => row.appendChild(b));
    card.appendChild(row);
    return card;
  }
  function render() {
    const body = el("pause-body"); body.innerHTML = "";
    const title = el("pause-title");
    if (view === "main") {
      title.textContent = "MENU";
      body.appendChild(button("RESUME", close));
      body.appendChild(button("SAVE GAME", () => {
        note = Save.saveManual() ? "Saved to slot " + Save.getSlot() + "." : "Can't save right now.";
        render();
      }));
      body.appendChild(button("SAVE FILES", () => show("slots")));
      body.appendChild(button("SETTINGS", () => show("settings")));
      body.appendChild(button("CONTROLS", () => show("controls")));
      body.appendChild(button("CO-OP <small>(coming soon)</small>", null, { disabled: true }));
      body.appendChild(button("QUIT TO TITLE", () => {
        if (G.settings.autosave) Save.saveManual();
        location.reload();
      }, { cls: "warn" }));
    } else if (view === "slots") {
      title.textContent = "SAVE FILES";
      for (let n = 1; n <= Save.SLOTS; n++) body.appendChild(slotCard(n, (i) => {
        const acts = [button("SAVE HERE", () => ask(i ? "Overwrite slot " + n + "?" : null, () => {
          note = Save.saveManual(n) ? "Saved to slot " + n + ". You're now playing in slot " + n + "." : "Can't save right now.";
        }), { cls: "small" })];
        if (i && n !== Save.getSlot()) acts.push(button("LOAD", () => ask("Load slot " + n + "? Unsaved progress is lost.", () => loadSlot(n)), { cls: "small" }));
        if (i && n !== Save.getSlot()) acts.push(button("DELETE", () => ask("Delete slot " + n + " for good?", () => { Save.clear(n); note = "Slot " + n + " deleted."; }), { cls: "small warn" }));
        return acts;
      }));
      body.appendChild(button("◀ BACK", back));
    } else if (view === "newSlot" || view === "loadSlot") {
      const isNew = view === "newSlot";
      title.textContent = isNew ? "NEW GAME: CHOOSE A SLOT" : "LOAD GAME";
      for (let n = 1; n <= Save.SLOTS; n++) body.appendChild(slotCard(n, (i) => {
        if (isNew) return [button(i ? "OVERWRITE" : "START HERE", () => ask(i ? "Overwrite slot " + n + "? That save is lost." : null, () => {
          Save.clear(n); Save.setSlot(n); close(); UI.startGame();
        }), { cls: "small" + (i ? " warn" : "") })];
        return i ? [button("LOAD", () => { close(); UI.continueGame(n); }, { cls: "small" })] : [];
      }));
      body.appendChild(button("◀ BACK", back));
    } else if (view === "settings") {
      title.textContent = "SETTINGS";
      const S = G.settings;
      const opt = (label, value, next) => button(label + ": <b>" + value + "</b>", () => { next(); storeSettings(); render(); });
      const speeds = ["slow", "normal", "fast", "instant"];
      body.appendChild(opt("TEXT SPEED", S.textSpeed.toUpperCase(), () => { S.textSpeed = speeds[(speeds.indexOf(S.textSpeed) + 1) % speeds.length]; }));
      body.appendChild(opt("SCREEN FLASHES", S.flashes ? "ON" : "OFF", () => { S.flashes = !S.flashes; }));
      body.appendChild(opt("AUTOSAVE", S.autosave ? "ON" : "OFF", () => { S.autosave = !S.autosave; }));
      body.appendChild(button("CO-OP MODE <small>(coming soon)</small>", null, { disabled: true }));
      body.appendChild(button("SOUND <small>(coming soon)</small>", null, { disabled: true }));
      body.appendChild(button("◀ BACK", back));
    } else if (view === "controls") {
      title.textContent = "CONTROLS";
      const t = document.createElement("div"); t.className = "controls-list";
      t.innerHTML = [["WASD / Arrows", "Move"], ["Space", "Swipe (also lanterns, runes, bells, shells)"], ["E", "Talk / open / use"],
        ["J / K", "Special moves"], ["T", "Eat a treat"], ["Q", "Quest"], ["I", "Bag"], ["M", "Map"], ["Esc", "Menu / back"]]
        .map(([k, v]) => `<div><b>${k}</b><span>${v}</span></div>`).join("");
      body.appendChild(t);
      body.appendChild(button("◀ BACK", back));
    }
    if (confirm) {
      const c = document.createElement("div"); c.className = "menu-confirm";
      c.innerHTML = `<div>${confirm.text}</div>`;
      const row = document.createElement("div"); row.className = "slot-acts";
      row.appendChild(button("YES", () => { const fn = confirm.fn; confirm = null; fn(); render(); }, { cls: "small warn" }));
      row.appendChild(button("NO", () => { confirm = null; render(); }, { cls: "small" }));
      c.appendChild(row); body.prepend(c);
    }
    if (note) { const n = document.createElement("div"); n.className = "menu-note"; n.textContent = note; body.prepend(n); }
    focus();
  }
  function ask(text, fn) {
    if (!text) { fn(); render(); return; }
    confirm = { text, fn }; sel = 0; render();
  }
  function loadSlot(n) {
    // reload into the chosen slot: the title screen's CONTINUE then picks it up
    try { localStorage.setItem("gokusquest.continueSlot", String(n)); } catch (e) {}
    location.reload();
  }

  /* ---------------- keyboard ---------------- */
  function buttons() { return Array.from(el("pause-body").querySelectorAll("button:not([disabled])")); }
  function focus() { const b = buttons(); if (!b.length) return; sel = Math.max(0, Math.min(sel, b.length - 1)); b[sel].focus(); }
  function move(d) { const b = buttons(); if (!b.length) return; sel = (sel + d + b.length) % b.length; b[sel].focus(); }
  function activate() { const b = buttons()[sel]; if (b) b.click(); }

  window.Menu = { openPause, openTitlePicker, close, back, move, activate, isOpen, loadSettings };
})();
