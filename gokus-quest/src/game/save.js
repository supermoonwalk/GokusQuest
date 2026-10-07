/* ============================================================
   save.js  —  Save/load progress to localStorage. Serializes the
   persistent parts of G plus per-entity flags (alive, taken,
   caged, gone), and re-applies world changes (gates) on load.
   ============================================================ */
(function () {
  const KEY = "gokusquest.save.v1";
  const VERSION = 1;
  const TS = 16;
  const AUTOSAVE_FRAMES = 300;       // ~5s at 60 updates/s
  let lastAuto = 0;

  // entity fields that change during play and must survive a reload
  const ENT_FIELDS = ["alive", "dead", "taken", "caged", "gone", "gaveTreats"];

  function storage() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function has() {
    const s = storage(); if (!s) return false;
    try { return !!s.getItem(KEY); } catch (e) { return false; }
  }

  function clear() {
    const s = storage(); if (!s) return;
    try { s.removeItem(KEY); } catch (e) {}
  }

  // not during cutscenes, death or after the ending. Dialogue is fine: rewards are applied
  // before their dialogue opens, and any follow-up a dialogue's onDone would apply (quest
  // update, shopkeeper walk) comes from an interaction that can simply be repeated.
  function canSave() {
    const p = G.player;
    return !!p && !p.dead && G.quest !== "done" &&
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
      v: VERSION, at: Date.now(),
      cur: G.cur,
      player: { px: p.px, py: p.py, dir: p.dir, hp: p.hp },
      spawn: G.spawn,
      coins: G.coins, treats: G.treats, chi: G.chi,
      inventory: G.inventory, flags: G.flags, quest: G.quest,
      upgrades: G.upgrades,
      gearOwned: G.gearOwned.map(g => Object.assign({}, g)),
      equipped: eqIndex,
      specials: G.specials, specialsOwned: G.specialsOwned,
      entities,
    };
  }

  function save() {
    if (!canSave()) return false;
    const s = storage(); if (!s) return false;
    try { s.setItem(KEY, JSON.stringify(snapshot())); return true; }
    catch (e) { return false; }
  }

  // save + brief on-screen indicator (used at checkpoints like map changes)
  function checkpoint() {
    if (save() && UI.showSaved) UI.showSaved();
  }

  // periodic background save, called from Engine.update()
  function tick() {
    if (G.frame - lastAuto < AUTOSAVE_FRAMES) return;
    lastAuto = G.frame;
    save();
  }

  function read() {
    const s = storage(); if (!s) return null;
    try {
      const d = JSON.parse(s.getItem(KEY));
      return d && d.v === VERSION ? d : null;
    } catch (e) { return null; }
  }

  // apply a saved game on top of a freshly initialised world (Engine.init)
  function load() {
    const d = read();
    if (!d || !G.maps[d.cur]) return false;

    G.cur = d.cur;
    G.spawn = d.spawn || G.spawn;
    G.coins = d.coins; G.treats = d.treats; G.chi = d.chi || 0;
    G.inventory = d.inventory || [];
    G.flags = Object.assign(G.flags, d.flags);
    G.quest = d.quest;
    G.upgrades = Object.assign(G.upgrades, d.upgrades);
    G.specials = d.specials || [null, null];
    G.specialsOwned = d.specialsOwned || [];

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
  window.addEventListener("beforeunload", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

  window.Save = { save, load, has, clear, checkpoint, tick };
})();
