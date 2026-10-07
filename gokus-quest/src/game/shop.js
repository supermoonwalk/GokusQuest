/* ============================================================
   shop.js  —  Drives #shop-panel for every shop in town:
     whiskers  — stat training (+ specials and treats for now)
     smith     — Bramble's Forge: forge, equip and sell gear
     carpenter — Hazel's Workshop: furniture and a new room
   Each .shop-sec in the panel lists the shops it belongs to.
   ============================================================ */
(function () {
  function el(id) { return document.getElementById(id); }

  const TITLES = { whiskers: "Whiskers' Market" };
  let current = "whiskers";
  function open(id) {
    if (G.state !== "play") return;
    current = id || "whiskers";
    G.state = "shop";
    const v = World.VILLAGERS[current];
    el("shop-title").textContent = v ? v.title : TITLES[current];
    document.querySelectorAll("#shop-panel .shop-sec").forEach(sec => {
      sec.style.display = sec.dataset.shops.split(" ").includes(current) ? "" : "none";
    });
    el("shop-msg").textContent = "";
    el("shop-panel").classList.add("show");
    render();
  }
  function close() {
    el("shop-panel").classList.remove("show");
    if (G.state === "shop") G.state = "play";
  }

  function coinRow() {
    el("shop-coins").textContent = G.coins;
  }

  function render() {
    coinRow();
    renderStats();
    renderSpecials();
    renderConsumables();
    renderHome();
    renderRoom();
    renderForge();
    renderGear();
  }

  // Bramble forges a fresh piece of gear with a random quality roll
  const FORGE = { claws: 30, collar: 30, charm: 30 };
  function renderForge() {
    const wrap = el("shop-forge"); wrap.innerHTML = "";
    for (const gid in FORGE) {
      const g = World.GEAR[gid], cost = FORGE[gid];
      const row = document.createElement("div"); row.className = "shop-row";
      row.innerHTML = `<div class="shop-row-main"><span class="shop-name">${g.name}</span>
        <span class="shop-desc">Forge new ${g.name.toLowerCase()} (${g.statLabel}). Quality is a roll of the hammer!</span></div>`;
      row.appendChild(btn("FORGE", cost, G.coins >= cost, false, () => {
        G.coins -= cost;
        const inst = World.rollGear(gid);
        G.gearOwned.push(inst);
        Engine.autoEquipIfBetter(inst);
        el("shop-msg").textContent = "Bramble hands you: " + World.tierName(inst.tier) + " " + g.name + " (" + World.gearLine(inst) + ")" +
          (inst.equipped ? " Equipped!" : "");
        render(); UI.updateHud();
      }));
      wrap.appendChild(row);
    }
  }

  // Hazel can build a second room onto the hut
  const ROOM_COST = 120;
  function renderRoom() {
    const wrap = el("shop-room"); wrap.innerHTML = "";
    const row = document.createElement("div"); row.className = "shop-row";
    row.innerHTML = `<div class="shop-row-main"><span class="shop-name">Extra Room</span>
      <span class="shop-desc">Knock through the east wall of your hut. Room for a training dummy and a bookshelf.</span></div>`;
    if (G.home.room) {
      const b = document.createElement("button"); b.className = "shop-buy maxed"; b.textContent = "BUILT"; b.disabled = true;
      row.appendChild(b);
    } else row.appendChild(btn("BUILD", ROOM_COST, G.coins >= ROOM_COST, false, () => {
      G.coins -= ROOM_COST; G.home.room = true; Engine.applyHome(); render(); UI.updateHud();
    }));
    wrap.appendChild(row);
  }

  // furniture for Goku's hut: bought once, appears at home with a lasting perk
  function renderHome() {
    const wrap = el("shop-home"); if (!wrap) return; wrap.innerHTML = "";
    for (const fid in World.FURNITURE) {
      const f = World.FURNITURE[fid], owned = !!G.home[fid];
      if (f.room && !G.home.room) continue;
      const row = document.createElement("div"); row.className = "shop-row";
      row.innerHTML = `<div class="shop-row-main"><span class="shop-name">${f.name}</span>
        <span class="shop-desc">${f.desc}</span></div>`;
      if (owned) {
        const b = document.createElement("button"); b.className = "shop-buy maxed"; b.textContent = "AT HOME"; b.disabled = true;
        row.appendChild(b);
      } else {
        row.appendChild(btn("BUY", f.cost, G.coins >= f.cost, false, () => { Engine.buyFurniture(fid); render(); }));
      }
      wrap.appendChild(row);
    }
  }

  function btn(label, cost, affordable, maxed, onClick) {
    const b = document.createElement("button");
    b.className = "shop-buy" + (maxed ? " maxed" : (affordable ? "" : " broke"));
    if (maxed) b.textContent = "MAX";
    else { b.innerHTML = label + ' <span class="coin-i"></span>' + cost; }
    if (!maxed && affordable) b.addEventListener("click", onClick);
    else b.disabled = true;
    return b;
  }

  function renderStats() {
    const wrap = el("shop-stats"); wrap.innerHTML = "";
    for (const key of ["hp", "atk", "def", "spd", "chi"]) {
      const u = World.UPGRADES[key], lvl = G.upgrades[key], maxed = lvl >= u.max;
      const cost = World.upgradeCost(key);
      const row = document.createElement("div"); row.className = "shop-row";
      const pips = Array.from({ length: u.max }, (_, i) =>
        `<span class="lvpip${i < lvl ? " on" : ""}"></span>`).join("");
      row.innerHTML =
        `<div class="shop-row-main"><span class="shop-name">${u.name}</span>
           <span class="shop-desc">${u.desc}</span></div>
         <div class="lvpips">${pips}</div>`;
      row.appendChild(btn("BUY", cost, G.coins >= cost, maxed, () => {
        G.coins -= cost; G.upgrades[key]++; Engine.recalcPlayer(false); render();
      }));
      wrap.appendChild(row);
    }
  }

  function renderSpecials() {
    const wrap = el("shop-specials"); wrap.innerHTML = "";
    const forSale = { dash: 30, roar: 45 };   // slam is learned in the manor
    for (const id in forSale) {
      const sp = World.SPECIALS[id], owned = G.specialsOwned.includes(id);
      const cost = forSale[id];
      const row = document.createElement("div"); row.className = "shop-row";
      row.innerHTML = `<div class="shop-row-main"><span class="shop-name">${sp.name}</span>
        <span class="shop-desc">${sp.desc} (${sp.cost} CHI)</span></div>`;
      if (owned) {
        row.appendChild(slotToggles(id));
      } else {
        row.appendChild(btn("LEARN", cost, G.coins >= cost, false, () => {
          G.coins -= cost; unlockSpecial(id); render();
        }));
      }
      wrap.appendChild(row);
    }
    // also let slam be reassigned if learned
    if (G.specialsOwned.includes("slam")) {
      const sp = World.SPECIALS.slam;
      const row = document.createElement("div"); row.className = "shop-row";
      row.innerHTML = `<div class="shop-row-main"><span class="shop-name">${sp.name}</span>
        <span class="shop-desc">${sp.desc} (${sp.cost} CHI)</span></div>`;
      row.appendChild(slotToggles("slam"));
      wrap.appendChild(row);
    }
  }
  function slotToggles(id) {
    const box = document.createElement("div"); box.className = "slot-toggles";
    ["J", "K"].forEach((label, i) => {
      const b = document.createElement("button");
      const on = G.specials[i] === id;
      b.className = "slot-btn" + (on ? " on" : "");
      b.textContent = label;
      b.addEventListener("click", () => {
        if (G.specials[i] === id) G.specials[i] = null;
        else { for (let s = 0; s < 2; s++) if (G.specials[s] === id) G.specials[s] = null; G.specials[i] = id; }
        render(); UI.updateHud();
      });
      box.appendChild(b);
    });
    return box;
  }
  function unlockSpecial(id) {
    if (!G.specialsOwned.includes(id)) G.specialsOwned.push(id);
    const free = G.specials.indexOf(null);
    if (free >= 0) G.specials[free] = id;
    UI.updateHud();
  }

  function renderConsumables() {
    const wrap = el("shop-items"); wrap.innerHTML = "";
    const cost = 8;
    const row = document.createElement("div"); row.className = "shop-row";
    row.innerHTML = `<div class="shop-row-main"><span class="shop-name">Fish Treat</span>
      <span class="shop-desc">Heal 14 HP in a pinch. You have ${G.treats}.</span></div>`;
    row.appendChild(btn("BUY", cost, G.coins >= cost, false, () => {
      G.coins -= cost; G.treats++; render(); UI.updateHud();
    }));
    wrap.appendChild(row);
  }

  function renderGear() {
    const wrap = el("shop-gear"); wrap.innerHTML = "";
    const spares = G.gearOwned.filter(g => !g.equipped);
    if (G.gearOwned.length === 0) {
      wrap.innerHTML = `<div class="shop-empty">No gear yet \u2014 smash chests in the wild to find some.</div>`;
      return;
    }
    for (const inst of G.gearOwned) {
      const g = World.GEAR[inst.gid];
      const row = document.createElement("div"); row.className = "shop-row gear";
      const cv = document.createElement("canvas"); cv.width = 16; cv.height = 16; cv.className = "shop-gicon";
      const cx = cv.getContext("2d"); cx.imageSmoothingEnabled = false;
      Sprites2.drawGearIcon(cx, inst.gid === "charm" ? "bell" : inst.gid, 0, 0, 1);
      const main = document.createElement("div"); main.className = "shop-row-main";
      main.innerHTML = `<span class="shop-name" style="color:${World.tierColor(inst.tier)}">${World.tierName(inst.tier)} ${g.name}</span>
        <span class="shop-desc">${World.gearLine(inst)}${inst.equipped ? " \u2014 equipped" : ""}</span>`;
      const left = document.createElement("div"); left.className = "gear-left";
      left.appendChild(cv); left.appendChild(main);
      row.appendChild(left);
      const acts = document.createElement("div"); acts.className = "gear-acts";
      if (!inst.equipped) {
        const eq = document.createElement("button"); eq.className = "slot-btn"; eq.textContent = "EQUIP";
        eq.addEventListener("click", () => { Engine.equipGear(inst); render(); });
        acts.appendChild(eq);
        const sell = document.createElement("button"); sell.className = "shop-buy sell";
        sell.innerHTML = 'SELL <span class="coin-i"></span>' + World.gearValue(inst);
        sell.addEventListener("click", () => { Engine.sellGear(inst); render(); });
        acts.appendChild(sell);
      } else {
        const un = document.createElement("button"); un.className = "slot-btn on"; un.textContent = "EQUIPPED";
        un.addEventListener("click", () => { Engine.unequipSlot(g.slot); render(); });
        acts.appendChild(un);
      }
      row.appendChild(acts);
      wrap.appendChild(row);
    }
  }

  window.Shop = { open, close, render, unlockSpecial };
})();
