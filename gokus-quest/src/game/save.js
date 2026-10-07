/* ============================================================
   save.js  —  Save/load progress to localStorage, in 3 slots.
   Serializes the persistent parts of G plus per-entity flags
   (alive, taken, caged, gone), and re-applies world changes
   (gates) on load. The game autosaves into the current slot
   (unless switched off in the settings).
   ============================================================ */
(function () {
  const LEGACY_KEY = "gokusquest.save.v1";       // single save from before slots existed
  const SLOTS = 3;
  const keyOf = (n) => "gokusquest.slot" + n;
  let slot = 1;                                   // the slot this session plays in
  const VERSION = 1;
  const TS = 16;
  const AUTOSAVE_FRAMES = 300;       // ~5s at 60 updates/s
  let lastAuto = 0;

  // entity fields that change during play and must survive a reload
  const ENT_FIELDS = ["alive", "dead", "taken", "caged", "gone", "gaveTreats"];

  function storage() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  // an old single save becomes slot 1
  (function migrate() {
    const s = storage(); if (!s) return;
    try {
      const old = s.getItem(LEGACY_KEY);
      if (old && !s.getItem(keyOf(1))) s.setItem(keyOf(1), old);
      if (old) s.removeItem(LEGACY_KEY);
    } catch (e) {}
  })();

  function raw(n) {
    const s = storage(); if (!s) return null;
    try { const d = JSON.parse(s.getItem(keyOf(n))); return d && d.v === VERSION ? d : null; }
    catch (e) { return null; }
  }
  // any slot in use?
  function has() { for (let n = 1; n <= SLOTS; n++) if (raw(n)) return true; return false; }
  function hasSlot(n) { return !!raw(n); }
  // the most recently saved slot (what CONTINUE loads)
  function latest() {
    let best = 0, at = -1;
    for (let n = 1; n <= SLOTS; n++) { const d = raw(n); if (d && d.at > at) { at = d.at; best = n; } }
    return best;
  }
  function firstEmpty() { for (let n = 1; n <= SLOTS; n++) if (!raw(n)) return n; return 0; }
  function clear(n) {
    const s = storage(); if (!s) return;
    try { s.removeItem(keyOf(n || slot)); } catch (e) {}
  }
  function setSlot(n) { slot = n; }
  function getSlot() { return slot; }
  // summary for the save-file screens
  function info(n) {
    const d = raw(n); if (!d) return null;
    return { slot: n, at: d.at, cur: d.cur, quest: d.quest, coins: d.coins, time: d.time || 0,
             kitties: Object.keys((d.flags && d.flags.kitties) || {}).length,
             hp: d.player.hp, villagers: Object.keys(d.villagers || {}).length };
  }

  // not during cutscenes, death or after the ending. Dialogue is fine: rewards are applied
  // before their dialogue opens, and any follow-up a dialogue's onDone would apply (quest
  // update, shopkeeper walk) comes from an interaction that can simply be repeated.
  function canSave() {
    const p = G.player;
    return !!p && !p.dead && G.quest !== "done" && !G.scene &&
      ["play", "menu", "map", "shop", "dialogue"].includes(G.state);
  }

  function snapshot() {
    const p = G.player;
    const entities = {};
    for (const m in G.entities) {
      entities[m] = {};
      for (const e of G.entities[m]) {
        if (!e.id) continue;
        const rec = {};
        for (const f of ENT_FIELDS) if (e[f] !== undefined) rec[f] = e[f];
        // a shopkeeper mid-walk counts as having arrived
        if (e.scripted) rec.gone = true;
        entities[m][e.id] = rec;
      }
    }
    const eqIndex = {};
    for (const slot in G.equipped) eqIndex[slot] = G.equipped[slot] ? G.gearOwned.indexOf(G.equipped[slot]) : -1;
    return {
      v: VERSION, at: Date.now(), time: G.playFrames || 0,
      cur: G.cur,
      player: { px: p.px, py: p.py, dir: p.dir, hp: p.hp },
      coins: G.coins, treats: G.treats, chi: G.chi,
      inventory: G.inventory, flags: G.flags, quest: G.quest,
      upgrades: G.upgrades,
      gearOwned: G.gearOwned.map(g => Object.assign({}, g)),
      equipped: eqIndex,
      specials: G.specials, specialsOwned: G.specialsOwned,
      home: G.home, villagers: G.villagers,
      entities,
    };
  }

  const autosaveOn = () => !(G.settings && G.settings.autosave === false);
  // write the current game into a slot (default: the current one)
  function save(n) {
    if (!canSave()) return false;
    const s = storage(); if (!s) return false;
    try { s.setItem(keyOf(n || slot), JSON.stringify(snapshot())); return true; }
    catch (e) { return false; }
  }
  // the pause menu's "save": also allowed while the menu itself is open
  function saveManual(n) {
    const prev = G.state; if (G.state === "pause") G.state = "play";
    const ok = save(n);
    G.state = prev;
    if (ok && n) slot = n;
    return ok;
  }

  // save + brief on-screen indicator (used at checkpoints like map changes)
  function checkpoint() {
    if (autosaveOn() && save() && UI.showSaved) UI.showSaved();
  }

  // periodic background save, called from Engine.update()
  function tick() {
    if (G.frame - lastAuto < AUTOSAVE_FRAMES) return;
    lastAuto = G.frame;
    if (autosaveOn()) save();
  }

  // apply a saved game on top of a freshly initialised world (Engine.init)
  function load(n) {
    if (n) slot = n;
    const d = raw(slot);
    if (!d || !G.maps[d.cur]) return false;
    G.playFrames = d.time || 0;

    G.cur = d.cur;
    // the respawn point is always Goku's hut (older saves stored the town square)
    G.coins = d.coins; G.treats = d.treats; G.chi = d.chi || 0;
    G.inventory = d.inventory || [];
    G.flags = Object.assign(G.flags, d.flags);
    G.quest = d.quest;
    G.upgrades = Object.assign(G.upgrades, d.upgrades);
    G.specials = d.specials || [null, null];
    G.specialsOwned = d.specialsOwned || [];
    G.home = d.home || {};
    G.villagers = d.villagers || {};
    Engine.applyHome();

    G.gearOwned = d.gearOwned || [];
    for (const slot in G.equipped) {
      const i = d.equipped ? d.equipped[slot] : -1;
      G.equipped[slot] = i >= 0 ? G.gearOwned[i] || null : null;
    }
    for (const g of G.gearOwned) g.equipped = false;
    for (const slot in G.equipped) if (G.equipped[slot]) G.equipped[slot].equipped = true;

    for (const m in d.entities) {
      for (const e of (G.entities[m] || [])) {
        const rec = d.entities[m][e.id];
        if (rec) Object.assign(e, rec);
        if (e.type === "monster") { e.px = e.x * TS; e.py = e.y * TS; e.hp = e.maxHp; }
      }
    }

    Engine.applyVillagers();
    // re-apply one-time world changes
    if (G.flags.deduced) World.openForestGate(G);
    if (G.flags.tomBeaten) World.openManorGate(G);

    const p = G.player;
    Engine.recalcPlayer(false);
    p.px = d.player.px; p.py = d.player.py; p.dir = d.player.dir || "down";
    p.hp = Math.max(1, Math.min(p.maxHp, d.player.hp));
    p.iframes = 60;
    G.coinDrops = []; G.fx = [];
    lastAuto = G.frame;
    return true;
  }

  // flush on tab close / app backgrounding
  window.addEventListener("beforeunload", () => { if (autosaveOn()) save(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && autosaveOn()) save(); });

  window.Save = { save, saveManual, load, has, hasSlot, latest, firstEmpty, clear, setSlot, getSlot, info, checkpoint, tick, SLOTS };
})();
