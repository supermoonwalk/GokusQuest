/* ============================================================
   playthrough.mjs  —  Functional test: plays the whole story in a
   real browser and checks each beat. Run with `npm test`.
   First time on a new machine: `npx playwright install chromium`.
   Uses teleports + real key presses (E to interact, Space to swipe);
   Goku is buffed so the fights stay short and deterministic enough.
   ============================================================ */
import { createServer } from "vite";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = await createServer({ root, logLevel: "silent", server: { port: 5199, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
const errors = [];
page.on("pageerror", e => errors.push(e.message));

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${name}${detail !== undefined ? "  (" + JSON.stringify(detail) + ")" : ""}`);
  if (!ok) failed++;
}
const ev = (fn, arg) => page.evaluate(fn, arg);
const state = () => ev(() => ({ state: G.state, quest: G.quest, cur: G.cur }));
const wait = ms => page.waitForTimeout(ms);
async function skipDialogue() {
  for (let i = 0; i < 40 && (await ev(() => G.state)) === "dialogue"; i++) {
    await page.keyboard.press("Enter"); await wait(30); await page.keyboard.press("Enter"); await wait(30);
  }
}
// let a cutscene play out (pressing through its dialogue) until control returns
async function playScene(maxMs = 20000) {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    const s = await ev(() => G.state);
    if (s === "play" || s === "ending") return s;
    if (s === "dialogue") { await page.keyboard.press("Enter"); await wait(30); await page.keyboard.press("Enter"); }
    await wait(50);
  }
  return ev(() => G.state);
}
async function useAt(x, y, dir) {
  await ev(([x, y, dir]) => { G.player.px = x * 16; G.player.py = y * 16; G.player.dir = dir; Engine.updateCamera(); }, [x, y, dir]);
  await page.keyboard.press("e"); await wait(80);
}
async function fight(map, id, maxSwipes) {
  for (let i = 0; i < maxSwipes; i++) {
    const s = await ev(([map, id]) => {
      const t = G.entities[map].find(e => e.id === id); if (!t.alive) return "dead";
      const c = Engine.centerOf(G.player), dx = t.px + 8 - c.x, dy = t.py + 8 - c.y;
      G.player.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
      G.player.hp = G.player.maxHp;
      return G.state;
    }, [map, id]);
    if (s === "dead") return true;
    if (s === "dialogue") await skipDialogue();
    await page.keyboard.press(" "); await wait(50);
  }
  return false;
}

try {
  await page.goto(url); await ev(() => localStorage.clear()); await page.reload(); await wait(500);
  check("title shows NEW GAME only", !(await page.isVisible("#opt-continue")));
  await page.keyboard.press("Enter"); await wait(100); await skipDialogue();
  check("game starts in Goku's hut", (await state()).cur === "home");
  check("the hut starts bare (straw mat only)", await ev(() => Object.keys(G.home).length === 0 && G.maps.home.ground[1][1] === "strawmat"));
  await useAt(4, 2, "down");
  check("an empty furniture spot hints at the shop", (await ev(() => G.state)) === "dialogue" && (await page.textContent("#d-text")).length > 0);
  await skipDialogue();
  // walk out of the door for real
  await ev(() => { G.player.px = 4 * 16; G.player.py = 4 * 16; });
  await page.keyboard.down("s"); await wait(800); await page.keyboard.up("s"); await wait(200);
  check("walking out of the hut leads into town", (await state()).cur === "overworld");

  // collisions: the market stall and Whiskers block movement
  await ev(() => { G.player.px = 8 * 16; G.player.py = 8 * 16; });
  await page.keyboard.down("s"); await wait(1200); await page.keyboard.up("s");
  check("can't walk through the market stall", (await ev(() => G.player.py)) < 162);

  await useAt(6, 8, "down");
  check("Whiskers talks", (await state()).state === "dialogue");
  await skipDialogue(); await wait(3000);
  check("Whiskers walks into his shop", await ev(() => G.flags.shopMoved));

  // Whiskers only trains stats (plus specials/treats for now); no furniture, no gear
  await ev(() => Engine.warpTo("shop", 5, 6, "up")); await skipDialogue();
  await useAt(5, 5, "up");
  const visible = sel => page.$eval(sel, el => el.closest(".shop-sec").style.display !== "none");
  check("Whiskers' shop: stats yes, furniture/gear no",
    (await ev(() => G.state)) === "shop" && await visible("#shop-stats") && !(await visible("#shop-home")) && !(await visible("#shop-forge")));
  await page.keyboard.press("Escape"); await wait(50);
  await ev(() => Engine.warpTo("home", 4, 5, "up")); await skipDialogue();
  await ev(() => { G.player.hp = 3; });
  await useAt(2, 1, "left"); await skipDialogue();
  check("resting on the straw mat restores HP", await ev(() => G.player.hp === G.player.maxHp));
  await ev(() => Engine.warpTo("overworld", 18, 6, "down")); await skipDialogue();
  check("no villager stalls in town yet", await ev(() => G.entities.overworld.filter(e => e.requires).every(e => e.gone)));

  // forest is locked before the clues
  await ev(() => Engine.warpTo("overworld", 21, 8, "right")); await skipDialogue();
  check("forest log blocks the path early", await ev(() => G.maps.overworld.object[8][22] === "flog"));

  // cottage clues
  await ev(() => Engine.warpTo("interior", 5, 7, "up")); await skipDialogue();
  check("entering cottage -> quest 'searched'", (await state()).quest === "searched");
  await useAt(6, 7, "up"); await skipDialogue();
  check("ribbon picked up", await ev(() => G.flags.ribbon));
  await useAt(8, 1, "up"); await skipDialogue();
  check("window clue -> quest 'deduced'", (await state()).quest === "deduced");
  check("forest log removed", await ev(() => G.maps.overworld.object[8][22] === null));

  // forest
  await ev(() => Engine.warpTo("forest", 2, 9, "right")); await skipDialogue();
  check("entering forest -> quest 'fighting'", (await state()).quest === "fighting");
  check("a trip out fills the fish bowl", await ev(() => G.flags.bowlReady));
  await ev(() => { G.upgrades.atk = 8; G.upgrades.hp = 8; G.upgrades.spd = 6; Engine.recalcPlayer(false); G.player.hp = G.player.maxHp; });

  // side trail north of the fork -> Thornhollow, where Bramble the smith is caged
  await ev(() => { G.player.px = 6 * 16; G.player.py = 2 * 16; });
  await page.keyboard.down("w"); await wait(700); await page.keyboard.up("w"); await skipDialogue();
  check("trail north of the fork leads to Thornhollow", (await state()).cur === "hollow");
  await useAt(9, 3, "up");
  check("Bramble the smith can be freed", (await ev(() => G.state)) === "dialogue");
  await skipDialogue();
  check("Bramble rescued, his cage is gone", await ev(() => G.villagers.smith && G.entities.hollow.find(e => e.id === "v_smith").gone));
  check("Bramble's forge opens in town", await ev(() => !G.entities.overworld.find(e => e.id === "stall_smith").gone));
  await ev(() => { G.coins = 500; Engine.warpTo("overworld", 11, 9, "down"); }); await skipDialogue();
  await useAt(11, 10, "down");
  check("the forge sells gear", (await ev(() => G.state)) === "shop" && (await page.textContent("#shop-title")) === "Bramble's Forge" && await visible("#shop-forge"));
  const gear0 = await ev(() => G.gearOwned.length);
  await page.click("#shop-forge .shop-row:nth-child(1) .shop-buy");
  check("forging gives a new piece of gear", (await ev(() => G.gearOwned.length)) === gear0 + 1 && (await page.textContent("#shop-msg")).length > 0);
  await page.keyboard.press("Escape"); await wait(50);

  // dying sends Goku home
  await ev(() => Engine.warpTo("forest", 2, 9, "right")); await skipDialogue();
  await ev(() => Engine.onPlayerDeath()); await wait(700); await skipDialogue();
  check("after a defeat Goku wakes up in his hut", (await state()).cur === "home");
  await ev(() => Engine.warpTo("forest", 2, 9, "right")); await skipDialogue();
  await ev(() => { G.player.hp = G.player.maxHp; });

  // Tom
  await wait(1200);
  check("Tom waits in his clearing", await ev(() => G.entities.forest.find(e => e.id === "boss").dormant));
  await ev(() => { G.player.px = 21 * 16; G.player.py = 9 * 16; }); await wait(100);
  check("Tom's entrance scene starts", await ev(() => G.scene === true) && (await state()).quest === "boss");
  await wait(600);
  check("camera pans to Tom's clearing", await ev(() => !!G.camFocus && G.camFocus.x > 22 * 16));
  check("Tom's entrance scene ends in the fight", (await playScene()) === "play" && await ev(() => G.entities.forest.find(e => e.id === "boss").state !== undefined && !G.scene));
  check("Tom defeated", await fight("forest", "boss", 150));
  check("Vesper's reveal scene starts", await ev(() => G.scene === true));
  await wait(400);
  check("beaten Tom stays on screen", await ev(() => G.entities.forest.some(e => e.type === "actor")));
  check("Vesper's reveal plays through", (await playScene(30000)) === "play");
  check("quest 'tomBeaten', gate open", (await state()).quest === "tomBeaten" && await ev(() => G.maps.forest.object[9][26] === "dgate"));
  check("Vesper took Chi Chi's cage", await ev(() => G.entities.forest.find(e => e.id === "chichi").gone));
  check("scene actors cleaned up, camera back on Goku", await ev(() => !G.entities.forest.some(e => e.type === "actor") && !G.camFocus));
  // a defeat after beating Tom: Tom stays beaten
  await ev(() => Engine.onPlayerDeath()); await wait(700); await skipDialogue();
  await ev(() => Engine.warpTo("forest", 20, 9, "right")); await skipDialogue(); await wait(300);
  check("Tom stays beaten after a defeat", await ev(() => !G.entities.forest.find(e => e.id === "boss").alive) && (await ev(() => G.state)) === "play");
  await ev(() => { G.player.hp = G.player.maxHp; });

  // through the gate: Vesper's grounds (chapter II)
  await ev(() => { G.player.px = 25 * 16; G.player.py = 9 * 16; });
  await page.keyboard.down("d"); await wait(600); await page.keyboard.up("d"); await wait(500);
  check("the dark gate leads to Vesper's grounds", (await state()).cur === "grounds" && (await state()).quest === "grounds");
  check("chapter II card", (await state()).state === "cutscene");
  await page.keyboard.press("Enter"); await wait(100); await skipDialogue();
  check("learned 180 Door Slam", await ev(() => G.specials.includes("slam")));
  check("the grounds have their own enemies", await ev(() => G.entities.grounds.filter(e => e.type === "monster").length >= 5));
  await useAt(12, 11, "down");
  check("Hazel the carpenter can be freed", (await ev(() => G.state)) === "dialogue");
  await skipDialogue();
  check("Hazel's workshop opens in town", await ev(() => G.villagers.carpenter && !G.entities.overworld.find(e => e.id === "stall_carp").gone));
  await useAt(26, 3, "up"); await wait(300);
  check("the castle door leads into the throne hall", (await state()).cur === "manor" && (await state()).quest === "manor");
  await skipDialogue();

  // Hazel: furniture and the extra room
  await ev(() => { G.coins = 600; Engine.warpTo("overworld", 14, 3, "down"); }); await skipDialogue();
  await useAt(14, 4, "down");
  check("the workshop sells furniture", (await ev(() => G.state)) === "shop" && (await page.textContent("#shop-title")) === "Hazel's Workshop" && (await page.$$("#shop-home .shop-row")).length === 7);
  const atk0 = await ev(() => G.player.atk), hp0 = await ev(() => G.player.maxHp), def0 = await ev(() => G.player.def);
  const c0 = await ev(() => G.coins);
  await page.click("#shop-home .shop-row:nth-child(1) .shop-buy");   // bed
  await page.click("#shop-home .shop-row:nth-child(2) .shop-buy");   // scratching post
  await page.click("#shop-home .shop-row:nth-child(3) .shop-buy");   // fish bowl
  check("buying furniture costs coins", (await ev(() => G.coins)) === c0 - 40 - 50 - 35);
  check("bed: +6 max HP, post: +1 attack", (await ev(() => G.player.maxHp)) === hp0 + 6 && (await ev(() => G.player.atk)) === atk0 + 1);
  await page.click("#shop-room .shop-buy");
  check("building the extra room unlocks room furniture", (await page.$$("#shop-home .shop-row")).length === 9);
  await page.click("#shop-home .shop-row:nth-child(8) .shop-buy");   // training dummy
  check("training dummy: +1 defense", (await ev(() => G.player.def)) === def0 + 1);
  await page.keyboard.press("Escape"); await wait(50);
  await ev(() => Engine.warpTo("home", 4, 5, "up")); await skipDialogue();
  check("the hut has grown a second room", await ev(() => G.maps.home.w === 15 && G.maps.home.object[1][12] === "dummy"));
  check("bought furniture stands in the hut", await ev(() => G.maps.home.object[1][1] === "bed" && G.maps.home.object[1][7] === "scratchpost"));
  await ev(() => { G.player.hp = 3; G.chi = 0; });
  await useAt(2, 1, "left"); await skipDialogue();
  check("resting in the bed restores HP and CHI", await ev(() => G.player.hp === G.player.maxHp && G.chi === G.maxChi));
  const tr = await ev(() => G.treats);
  await useAt(7, 3, "down"); await skipDialogue();
  check("fish bowl gives a treat after a trip out", (await ev(() => G.treats)) === tr + 1);

  // save + continue in the middle of the story
  await ev(() => Save.save());
  await page.reload(); await wait(500);
  check("CONTINUE offered after reload", await page.isVisible("#opt-continue"));
  await page.keyboard.press("Enter"); await wait(200); await skipDialogue();
  check("continue restores progress", (await state()).quest === "manor" && await ev(() => G.maps.forest.object[9][26] === "dgate"));
  check("continue keeps furniture and the extra room", await ev(() => G.home.bed && G.maps.home.w === 15 && G.maps.home.object[1][1] === "bed"));
  check("continue keeps rescued villagers", await ev(() => G.villagers.smith && G.villagers.carpenter &&
    !G.entities.overworld.find(e => e.id === "stall_smith").gone && G.entities.hollow.find(e => e.id === "v_smith").gone));
  await ev(() => { G.upgrades.atk = 8; G.upgrades.hp = 8; Engine.recalcPlayer(false); G.player.hp = G.player.maxHp; });

  // throne hall
  await ev(() => Engine.warpTo("manor", 10, 16, "up")); await wait(300); await skipDialogue();
  await wait(1200);
  check("Vesper stays on her throne", await ev(() => G.entities.manor.find(e => e.id === "vesper").dormant));
  const k = await ev(() => { const k = G.entities.manor.find(e => e.id === "k_mittens"); return [k.x, k.y]; });
  await useAt(k[0], k[1] - 1, "down"); await skipDialogue();
  check("freeing a kitten", (await ev(() => Engine.freedCount())) === 1);
  await ev(() => { G.player.px = 10 * 16; G.player.py = 6 * 16; }); await wait(100);
  check("Vesper's throne scene starts", await ev(() => G.scene === true));
  await wait(1200);
  check("the manor darkens around her", await ev(() => G.dim > 0.5));
  check("Vesper's throne scene ends in the fight", (await playScene()) === "play" && await ev(() => !G.dim));
  check("Vesper defeated", await fight("manor", "vesper", 300));

  // finale scene -> ending card
  for (let i = 0; i < 400 && (await ev(() => G.state)) !== "ending"; i++) {
    if ((await ev(() => G.state)) === "dialogue") { await page.keyboard.press("Enter"); await wait(30); await page.keyboard.press("Enter"); }
    await wait(50);
  }
  check("reunion plays and ends on the ending card", (await state()).state === "ending");
  check("Chi Chi out of her cage", await ev(() => !G.entities.manor.find(e => e.id === "chichi2").caged));
  check("the ending card offers to continue", (await page.textContent("#ending .press")).includes("continue"));

  // ===== Chapter III: the real game begins =====
  await page.keyboard.press("Enter"); await wait(300);
  check("after the ending Goku is home with Chi Chi", (await state()).cur === "home" && await ev(() => !G.entities.home.find(e => e.id === "chichi_home").gone));
  await skipDialogue();
  check("quest: chapter III", (await state()).quest === "ch3");
  check("Vesper and Tom stay beaten", await ev(() => !G.entities.manor.find(e => e.id === "vesper").alive && !G.entities.forest.find(e => e.id === "boss").alive));
  check("the kittens went home (manor cages empty)", await ev(() => G.entities.manor.filter(e => e.type === "captive").every(e => e.gone)));
  check("the game keeps saving after the ending", await ev(() => Save.has()));
  check("the thorn hedge north of town has withered", await ev(() => G.maps.overworld.object[1][11] === null));
  await ev(() => { G.upgrades.atk = 8; G.upgrades.hp = 8; Engine.recalcPlayer(false); G.player.hp = G.player.maxHp; });
  await ev(() => Engine.warpTo("overworld", 11, 2, "up")); await skipDialogue();
  await page.keyboard.down("w"); await wait(700); await page.keyboard.up("w"); await skipDialogue();
  check("the north path leads into the Elderwood", (await state()).cur === "ew_gate");

  // a lost kitten hides behind a hedge in the mossy crossing
  await ev(() => Engine.warpTo("ew_crossing", 10, 12, "up")); await skipDialogue();
  check("a fallen giant tree blocks the north of the crossing", await ev(() => G.maps.ew_crossing.object[1][10] === "flog"));
  await useAt(3, 2, "left");
  check("finding a lost kitty", (await ev(() => G.state)) === "dialogue");
  await skipDialogue();
  check("lost kitty counted and sent home", await ev(() => G.flags.kitties.kit_ew1 && G.entities.ew_crossing.find(e => e.id === "kit_ew1").gone));

  // Master Mochi's quest
  await ev(() => Engine.warpTo("ew_shrine", 1, 7, "right")); await skipDialogue();
  await useAt(12, 7, "right");
  check("Master Mochi asks for her scroll", (await ev(() => G.state)) === "dialogue" && (await state()).quest === "scroll");
  await skipDialogue();
  await useAt(9, 3, "up"); await wait(300); await skipDialogue();
  check("the Hollow Oak door leads into the dungeon", (await state()).cur === "oak_roots");
  check("roots block the way at first", await ev(() => G.maps.oak_roots.object[4][8] === "flog"));
  await ev(() => { for (const m of G.entities.oak_roots) if (m.type === "monster") { m.alive = false; m.deadAt = G.frame; } });
  const lanterns = [[3, 6, "left"], [12, 6, "right"], [8, 8, "down"]];
  for (const [i, [x, y, d]] of lanterns.entries()) {
    await ev(([x, y, d]) => { G.player.px = x * 16; G.player.py = y * 16; G.player.dir = d; G.player.atkCD = 0; }, [x, y, d]);
    await page.keyboard.press(" "); await wait(250);
    if (i === 0) check("one lit lantern alone doesn't lift the roots", await ev(() => G.entities.oak_roots.find(e => e.id === "lamp1").lit > 0 && !G.flags.puzzles.oakLanterns));
  }
  await skipDialogue();
  check("lighting all three lanterns lifts the roots", await ev(() => G.flags.puzzles.oakLanterns && G.maps.oak_roots.object[4][8] === null));
  await ev(() => Engine.warpTo("oak_heart", 8, 10, "up")); await skipDialogue();
  await ev(() => { G.player.px = 8 * 16; G.player.py = 7 * 16; }); await wait(150);
  check("Old Fang wakes with his own intro", (await ev(() => G.state)) === "dialogue");
  await skipDialogue();
  check("Old Fang defeated", await fight("oak_heart", "fang", 300));
  await wait(700); await skipDialogue();
  check("the scroll is recovered", await ev(() => G.flags.scroll));
  await ev(() => Engine.warpTo("ew_shrine", 11, 7, "right")); await skipDialogue();
  await useAt(12, 7, "right"); await skipDialogue();
  check("Mochi moves to town and opens her dojo", await ev(() => G.villagers.dojo && !G.entities.overworld.find(e => e.id === "stall_dojo").gone) && (await state()).quest === "dojo");
  await ev(() => Engine.warpTo("overworld", 20, 9, "down")); await skipDialogue();
  await useAt(20, 10, "down");
  check("the dojo teaches the special moves", (await page.textContent("#shop-title")) === "Mochi's Dojo" && await visible("#shop-specials"));
  await page.keyboard.press("Escape"); await wait(50);
  await ev(() => Engine.warpTo("shop", 5, 6, "up")); await skipDialogue();
  await useAt(5, 5, "up");
  check("...and Whiskers no longer does", !(await visible("#shop-specials")) && await visible("#shop-stats"));
  await page.keyboard.press("Escape"); await wait(50);

  // ===== the deep Elderwood =====
  await ev(() => Engine.warpTo("ew_crossing", 10, 3, "up")); await skipDialogue();
  await useAt(10, 2, "up"); await skipDialogue();
  check("Mochi's technique splits the fallen giant", await ev(() => G.flags.elderLog && G.maps.ew_crossing.object[1][10] === null) && (await state()).quest === "deep");
  await ev(() => { G.player.px = 10 * 16; G.player.py = 1 * 16; });
  await page.keyboard.down("w"); await wait(500); await page.keyboard.up("w"); await skipDialogue();
  check("north of the crossing lies the sunlit glade", (await state()).cur === "ew_glade");
  await ev(() => { for (const m of G.entities.ew_glade) if (m.type === "monster") { m.alive = false; m.deadAt = G.frame; } });
  const strike = async (x, y, d) => {
    await ev(([x, y, d]) => { G.player.px = x * 16; G.player.py = y * 16; G.player.dir = d; G.player.atkCD = 0; }, [x, y, d]);
    await page.keyboard.press(" "); await wait(250);
  };
  await strike(13, 4, "left");                              // north rune first: wrong
  check("runes struck in the wrong order fizzle", await ev(() => G.entities.ew_glade.every(e => !e.lit) && !G.flags.puzzles.gladeRunes));
  await strike(14, 6, "right"); await strike(13, 4, "left");
  check("two runes in the right order stay lit", await ev(() => G.entities.ew_glade.filter(e => e.lit).length === 2 && !G.flags.puzzles.gladeRunes));
  await strike(7, 5, "left"); await skipDialogue();
  check("east, north, west: the thorn wall crumbles", await ev(() => G.flags.puzzles.gladeRunes && G.maps.ew_glade.object[2][10] === null));

  await ev(() => Engine.warpTo("ew_thorn", 18, 7, "left")); await skipDialogue();
  await useAt(17, 1, "right"); await skipDialogue();
  check("a lost kitty hides at the end of the thornmaze", await ev(() => G.flags.kitties.kit_ew2));
  await ev(() => Engine.warpTo("ew_overlook", 10, 12, "up")); await skipDialogue();
  await useAt(4, 5, "up"); await skipDialogue();
  check("Thornmane's guards kept a kitty caged on the overlook", await ev(() => G.flags.kitties.kit_ew3 && Object.keys(G.flags.kitties).length === 3));

  // dungeon 2: the den
  await useAt(10, 3, "up"); await wait(300); await skipDialogue();
  check("the overlook door leads into Thornmane's den", (await state()).cur === "den_a");
  check("a barricade blocks the den while guards remain", await ev(() => G.maps.den_a.object[3][8] === "flog"));
  for (const id of ["d1", "d2", "d3", "d4"]) {
    await ev((id) => { const m = G.entities.den_a.find(e => e.id === id); if (m.alive) { G.player.px = m.px; G.player.py = m.py + 14; } }, id);
    check("den guard " + id + " beaten", await fight("den_a", id, 80));
  }
  await wait(200); await skipDialogue();
  check("beating every guard opens the barricade", await ev(() => G.flags.puzzles.denArena && G.maps.den_a.object[3][8] === null));
  await ev(() => Engine.warpTo("den_b", 9, 12, "up")); await skipDialogue();
  await ev(() => { G.player.px = 9 * 16; G.player.py = 8 * 16; }); await wait(150);
  check("Thornmane's entrance scene starts", await ev(() => G.scene === true));
  check("Thornmane's entrance scene ends in the fight", (await playScene()) === "play");
  let roared = false;
  for (let i = 0; i < 400; i++) {
    const s = await ev(() => { const t = G.entities.den_b.find(e => e.id === "thornmane"); if (!t.alive) return "dead";
      const c = Engine.centerOf(G.player), dx = t.px + 8 - c.x, dy = t.py + 8 - c.y;
      G.player.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
      G.player.hp = G.player.maxHp; return G.state + ":" + t.roars; });
    if (s === "dead") break;
    if (s.endsWith(":1") || s.endsWith(":2")) roared = true;
    if (s.startsWith("dialogue")) await skipDialogue();
    await page.keyboard.press(" "); await wait(50);
  }
  check("Thornmane roars and calls his guards", roared);
  check("Thornmane defeated", await ev(() => !G.entities.den_b.find(e => e.id === "thornmane").alive));
  check("Thornmane's defeat scene plays", (await playScene(30000)) === "play");
  check("quest: on to Zeeland", (await state()).quest === "zeeland" && await ev(() => G.flags.ewKing));
  check("summoned guards are gone", await ev(() => !G.entities.den_b.some(e => e.summoned && e.alive)));
  check("the coast road sign appears in town", await ev(() => G.maps.overworld.object[14][12] === "sign" && !G.entities.overworld.find(e => e.id === "coastsign").gone));
  await ev(() => Engine.onPlayerDeath()); await wait(700); await skipDialogue();
  check("Thornmane stays beaten after a defeat", await ev(() => !G.entities.den_b.find(e => e.id === "thornmane").alive && !G.entities.den_b.some(e => e.summoned)));

  // regular enemies return after a while, bosses don't
  await ev(() => { for (const m of G.entities.ew_gate) if (m.type === "monster") { m.alive = false; m.dead = true; m.deadAt = G.frame - 60 * 60 * 4; } });
  await ev(() => Engine.warpTo("ew_gate", 10, 12, "up")); await skipDialogue();
  check("regular enemies respawn after a few minutes", await ev(() => G.entities.ew_gate.filter(e => e.type === "monster").every(e => e.alive)));
  await ev(() => Engine.warpTo("oak_heart", 8, 10, "up")); await skipDialogue();
  check("dungeon bosses stay beaten", await ev(() => !G.entities.oak_heart.find(e => e.id === "fang").alive));
  await ev(() => Save.save()); await page.reload(); await wait(500);
  await page.keyboard.press("Enter"); await wait(300); await skipDialogue();
  check("continue after the ending keeps chapter III progress", await ev(() => G.villagers.dojo && G.flags.puzzles.oakLanterns && G.maps.oak_roots.object[4][8] === null && G.flags.chichiHome && G.maps.overworld.object[1][11] === null));
  check("continue keeps the deep Elderwood open", await ev(() => G.maps.ew_crossing.object[1][10] === null && G.maps.ew_glade.object[2][10] === null &&
    G.maps.den_a.object[3][8] === null && !G.entities.den_b.find(e => e.id === "thornmane").alive && G.maps.overworld.object[14][12] === "sign"));
} catch (e) {
  check("no crash", false, e.message);
}

check("no JavaScript errors", errors.length === 0, errors);
await browser.close();
await server.close();
console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
