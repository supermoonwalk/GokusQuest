/* ============================================================
   cheats.js  —  Test helpers for the browser console (F12).
   Only loaded by `npm run dev`, never in a release build.
   Type  cheat.help()  in the console for the list.
   Jumps set every story flag up to that point, so quests and
   dialogue stay consistent with where you land.
   ============================================================ */
(function () {
  function kill(map, id) {
    const e = G.entities[map].find(x => x.id === id);
    if (e) { e.alive = false; e.dead = true; G.flags.defeated[id] = true; }
  }
  function gone(map, id) { const e = G.entities[map].find(x => x.id === id); if (e) { e.gone = true; e.caged = false; } }

  // story stages, each builds on the previous one
  const STAGES = {
    bos() {
      Object.assign(G.flags, { metShop: true, shopMoved: true, searched: true, deduced: true, ribbon: true });
      G.entities.overworld.find(e => e.id === "villager").gone = true;
      if (!G.inventory.includes("ribbon")) G.inventory.push("ribbon");
      World.openForestGate(G);
      G.quest = "fighting";
    },
    kasteel() {
      STAGES.bos();
      G.flags.tomBeaten = true; G.flags.bossMet.boss = true; kill("forest", "boss"); gone("forest", "chichi");
      World.openManorGate(G);
      Object.assign(G.flags, { enteredGrounds: true, learnedSlam: true });
      if (!G.specialsOwned.includes("slam")) G.specialsOwned.push("slam");
      if (!G.specials.includes("slam")) G.specials[0] = "slam";
      G.quest = "grounds";
    },
    vesper() {
      STAGES.kasteel();
      G.flags.enteredManor = true; G.quest = "manor";
    },
    elderwood() {
      STAGES.vesper();
      kill("manor", "vesper"); G.flags.bossMet.vesper = true;
      for (const e of G.entities.manor) if (e.type === "captive") gone("manor", e.id);
      Object.assign(G.flags, { chapter3: true, chichiHome: true });
      G.quest = "ch3";
    },
    thornmane() {
      STAGES.elderwood();
      G.flags.scroll = true; G.villagers.dojo = true; G.flags.elderLog = true;
      kill("oak_heart", "fang");
      Object.assign(G.flags.puzzles, { oakLanterns: true, gladeRunes: true, denArena: true });
      G.quest = "deep";
    },
    zeeland() {
      STAGES.thornmane();
      G.flags.ewKing = true; G.flags.bossMet.thornmane = true; kill("den_b", "thornmane");
      G.quest = "zeeland";
    },
    koningin() {
      STAGES.zeeland();
      Object.assign(G.flags, { tideKey: true, palaceOpen: true });
      G.flags.puzzles.lhBells = true; G.flags.puzzles.palaceShells = true;
      kill("lh_b", "gullbeard");
      G.quest = "zl3";
    },
  };
  // where each jump drops you
  const SPOTS = {
    dorp:      ["overworld", 10, 9, "down"],
    hut:       ["home", 4, 4, "up"],
    bos:       ["forest", 2, 9, "right", "bos"],
    tom:       ["forest", 18, 9, "right", "bos"],
    kasteel:   ["grounds", 1, 7, "right", "kasteel"],
    vesper:    ["manor", 10, 8, "up", "vesper"],
    elderwood: ["ew_gate", 10, 12, "up", "elderwood"],
    thornmane: ["den_b", 9, 12, "up", "thornmane"],
    zeeland:   ["zl_road", 10, 2, "down", "zeeland"],
    koningin:  ["palace_b", 9, 12, "up", "koningin"],
  };

  function refresh() {
    Engine.applyVillagers();
    Engine.recalcPlayer(false);
    UI.updateHud();
  }

  const cheat = {
    help() {
      console.log([
        "cheat.sterk()          max upgrades, volle HP, 999 munten, 9 treats",
        "cheat.geld(500)        munten erbij",
        "cheat.heel()           HP en CHI vol",
        "cheat.onkwetsbaar()    aan/uit: je verliest geen HP",
        "cheat.winkels()        alle dorpelingen gered (alle winkels open)",
        "cheat.meubels()        alle meubels + extra kamer",
        "cheat.naar('plek')     springen: " + Object.keys(SPOTS).join(", "),
        "cheat.eb() / cheat.vloed()   getij forceren (Zeeland)",
        "cheat.waar()           waar ben je (kaart, tegel, quest)",
        "cheat.wis()            save wissen en opnieuw beginnen",
      ].join("\n"));
    },
    sterk() {
      Object.assign(G.upgrades, { hp: 8, atk: 8, def: 8, spd: 6, chi: 6 });
      G.coins = Math.max(G.coins, 999); G.treats = Math.max(G.treats, 9);
      refresh(); G.player.hp = G.player.maxHp; G.chi = G.maxChi; UI.updateHud();
      return "Goku is sterk!";
    },
    geld(n) { G.coins += n || 500; UI.updateHud(); return G.coins + " munten"; },
    heel() { G.player.hp = G.player.maxHp; G.chi = G.maxChi; UI.updateHud(); return "HP en CHI vol"; },
    onkwetsbaar() {
      if (cheat._god) { clearInterval(cheat._god); cheat._god = null; return "onkwetsbaar: UIT"; }
      cheat._god = setInterval(() => { if (G.player && !G.player.dead) G.player.hp = G.player.maxHp; }, 50);
      return "onkwetsbaar: AAN";
    },
    winkels() {
      for (const v in World.VILLAGERS) G.villagers[v] = true;
      refresh(); return "Alle winkels open: " + Object.keys(World.VILLAGERS).join(", ");
    },
    meubels() {
      G.home.room = true;
      for (const f in World.FURNITURE) G.home[f] = true;
      Engine.applyHome(); refresh(); return "Hut volledig ingericht";
    },
    naar(plek) {
      const s = SPOTS[plek];
      if (!s) return "Onbekend. Kies uit: " + Object.keys(SPOTS).join(", ");
      if (G.state === "title") UI.startGame();
      const [map, x, y, dir, stage] = s;
      if (stage) STAGES[stage]();
      refresh();
      UI.closeMenu(); UI.closeMap(); Shop.close();
      G.state = "play";
      Engine.warpTo(map, x, y, dir);
      return "Naar " + plek + " (quest: " + G.quest + ")";
    },
    eb() { G.frame = Math.ceil(G.frame / 900) * 900 + 30; return "Eb (7 sec)"; },
    vloed() { G.frame = Math.ceil(G.frame / 900) * 900 + 480; return "Vloed (7 sec)"; },
    waar() {
      return { kaart: G.cur, x: Math.round(G.player.px / 16), y: Math.round(G.player.py / 16), quest: G.quest };
    },
    wis() { localStorage.clear(); location.reload(); },
  };
  window.cheat = cheat;
  console.log("%cGoku's Quest cheats geladen. Typ cheat.help()", "color:#c96d6d;font-weight:bold");
})();
