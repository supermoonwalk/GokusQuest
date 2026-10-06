/* ============================================================
   shop.js  —  Whiskers' market: buy stat upgrades, specials,
   treats; sell spare gear. Drives #shop-panel.
   ============================================================ */
(function () {
  function el(id) { return document.getElementById(id); }

  function open() {
    if (G.state !== "play") return;
    G.state = "shop";
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
    renderGear();
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
