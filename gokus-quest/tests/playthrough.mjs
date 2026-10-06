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
  check("game starts in town", (await state()).cur === "overworld");

  // collisions: the market stall and Whiskers block movement
  await ev(() => { G.player.px = 8 * 16; G.player.py = 8 * 16; });
  await page.keyboard.down("s"); await wait(1200); await page.keyboard.up("s");
  check("can't walk through the market stall", (await ev(() => G.player.py)) < 162);

  await useAt(6, 8, "down");
  check("Whiskers talks", (await state()).state === "dialogue");
  await skipDialogue(); await wait(3000);
  check("Whiskers walks into his shop", await ev(() => G.flags.shopMoved));

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

  // forest + Tom
  await ev(() => Engine.warpTo("forest", 2, 9, "right")); await skipDialogue();
  check("entering forest -> quest 'fighting'", (await state()).quest === "fighting");
  await wait(1200);
  check("Tom waits in his clearing", await ev(() => G.entities.forest.find(e => e.id === "boss").dormant));
  await ev(() => { G.upgrades.atk = 8; G.upgrades.hp = 8; G.upgrades.spd = 6; Engine.recalcPlayer(false); G.player.hp = G.player.maxHp; });
  await ev(() => { G.player.px = 21 * 16; G.player.py = 9 * 16; }); await wait(100);
  check("Tom wakes with a confrontation", (await state()).state === "dialogue" && (await state()).quest === "boss");
  await skipDialogue();
  check("Tom defeated", await fight("forest", "boss", 150));
  await wait(900); await skipDialogue();
  check("quest 'tomBeaten', manor gate open", (await state()).quest === "tomBeaten" && await ev(() => G.maps.forest.object[9][26] === "dgate"));

  // save + continue in the middle of the story
  await ev(() => Save.save());
  await page.reload(); await wait(500);
  check("CONTINUE offered after reload", await page.isVisible("#opt-continue"));
  await page.keyboard.press("Enter"); await wait(200); await skipDialogue();
  check("continue restores progress", (await state()).quest === "tomBeaten" && await ev(() => G.maps.forest.object[9][26] === "dgate"));
  await ev(() => { G.upgrades.atk = 8; G.upgrades.hp = 8; Engine.recalcPlayer(false); G.player.hp = G.player.maxHp; });

  // manor
  await ev(() => Engine.warpTo("manor", 10, 16, "up")); await wait(600);
  check("chapter II card", (await state()).state === "cutscene");
  await page.keyboard.press("Enter"); await wait(100); await skipDialogue();
  check("learned 180 Door Slam", await ev(() => G.specials.includes("slam")));
  await wait(1200);
  check("Vesper stays on her throne", await ev(() => G.entities.manor.find(e => e.id === "vesper").dormant));
  const k = await ev(() => { const k = G.entities.manor.find(e => e.id === "k_mittens"); return [k.x, k.y]; });
  await useAt(k[0], k[1] - 1, "down"); await skipDialogue();
  check("freeing a kitten", (await ev(() => Engine.freedCount())) === 1);
  await ev(() => { G.player.px = 10 * 16; G.player.py = 6 * 16; }); await wait(100);
  check("Vesper wakes in the throne hall", (await state()).state === "dialogue");
  await skipDialogue();
  check("Vesper defeated", await fight("manor", "vesper", 300));

  // finale scene -> ending card
  for (let i = 0; i < 400 && (await ev(() => G.state)) !== "ending"; i++) {
    if ((await ev(() => G.state)) === "dialogue") { await page.keyboard.press("Enter"); await wait(30); await page.keyboard.press("Enter"); }
    await wait(50);
  }
  check("reunion plays and ends on the ending card", (await state()).state === "ending");
  check("Chi Chi out of her cage", await ev(() => !G.entities.manor.find(e => e.id === "chichi2").caged));
  check("save cleared after finishing", !(await ev(() => Save.has())));
} catch (e) {
  check("no crash", false, e.message);
}

check("no JavaScript errors", errors.length === 0, errors);
await browser.close();
await server.close();
console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
