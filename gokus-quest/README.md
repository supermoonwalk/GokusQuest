# Goku's Quest — The Search for Chi Chi

Pixel-art action RPG for the browser. Vanilla JavaScript + Canvas 2D, no dependencies at runtime.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/
npm test           # plays the whole story in a headless browser (first time: npx playwright install chromium)
```

Needs a web server (scripts load as an ES module): use `npm run dev`, or serve `dist/` after a build. Opening `index.html` straight from disk no longer works.

Testing by hand (Dutch, incl. PowerShell steps and console cheats): see `TESTEN.md`.

## Gameplay

- **Town** (safe): villager, Whiskers' Market (shop), Chi Chi's cottage (enterable house with clues), Goku's hut (home base: rest, respawn, furniture with perks).
- **Whiskerwood** (forest): Alley Kitten, Scruffy Stray, Mean Mouser, Shade Prowler, Hex the Hisser, boss Tuxedo Tom.
- **Thornhollow** (side area): rescue Bramble the smith → Bramble's Forge opens in town (gear).
- **Vesper's grounds** (after Tom): shades, hexes, Brutus; rescue Hazel the carpenter → Hazel's Workshop (furniture, extra room); castle door → throne hall.
- **Chapter II — Vesper's Manor**: Brutus, Shade Prowlers, Hex, 5 caged kittens to free, final boss Madame Vesper.
- **Chapter III — Elderwood** (after Vesper, the game continues): north path from town, Master Mochi's scroll quest, Hollow Oak dungeon (lantern puzzle, Old Fang), a hidden lost kitty → Mochi's Dojo (special moves).
- **Deep Elderwood**: split the fallen giant (after the dojo), glade rune puzzle, thornmaze, overlook, Kingsroot den (arena + boss **Thornmane, the Wild King**). 3 lost kitties.
- **Zeeland** (after Thornmane): coast road south of town, tides (flats flood every 7.5 s), Biscuit's bakery, lighthouse (bells, Captain Gullbeard), sunken palace (shells, **the Tide Queen**).
- Quest chain: `... → done → ch3 → scroll → dojo → deep → zeeland → zl1 → zl2 → zl3 → vuurland`.
- Economy: coins from monsters/chests → shop (stat upgrades, special moves, treats, gear sell).
- Gear slots: claws / collar / charm, with tiers and random rolls.

Controls: WASD/arrows move · Space swipe · E interact · J/K specials · T treat · Q quest · I bag · M map · Esc close.

## Structure

| File | Role |
|---|---|
| `index.html` | DOM, HUD, panels, overlays, all CSS |
| `src/main.js` | Build entry: imports the game scripts in load order |
| `src/game/sprites.js`, `sprites2.js` | Pixel sprites as string templates, recolored per palette |
| `src/game/tiles.js`, `tiles2.js`, `tiles3.js` | 16×16 tiles baked to offscreen canvases (town, manor, forest/shop) |
| `src/game/world.js`, `world2.js` | Maps, entities, monster stats, quest steps, warps, economy |
| `src/game/world3.js` | Rescuable villagers + their town stalls, Thornhollow, Vesper's grounds, route/warp changes |
| `src/game/world4.js` | Chapter III region 1: the Elderwood (10 rooms, Hollow Oak + Kingsroot den, Thornmane), Master Mochi |
| `src/game/menu.js` | Pause menu, 3 save slots screen, settings |
| `src/game/village.js` | Market Street: villager houses (styled per owner) + interiors, Mochi's shrine temple |
| `src/game/world5.js` | Chapter III region 2: Zeeland (10 rooms, tides, lighthouse + sunken palace, the Tide Queen), Biscuit the baker |
| `src/game/engine.js` | Global state `G`, movement, AABB collision, camera, interaction, warps |
| `src/game/render.js` | Per-frame world drawing |
| `src/game/combat.js` | Real-time combat, enemy AI, specials, FX |
| `src/game/shop.js` | Shop panel |
| `src/game/ui.js` | Dialogue, HUD, menus, map, title, cutscenes, ending |
| `src/game/save.js` | Save/load to localStorage, autosave, checkpoints |
| `src/game/cutscene.js` | Scripted scenes (finale reunion) |
| `tests/playthrough.mjs` | Functional end-to-end playthrough (`npm test`) |
| `src/game/main.js` | Boot, scaling, keyboard input, fixed-timestep game loop (60 updates/s) |

Internal resolution: 256×192 (16×12 tiles), integer-scaled to the window.
Scripts are imported in order by `src/main.js` and still share globals (`G`, `Engine`, `World`, `Tiles`, `Sprites`, `Combat`, `UI`, `Shop`, `Save`); import order in `src/main.js` matters.

## Before publishing

1. **Name / IP**: "Goku" and "Chi Chi" are Dragon Ball character names (Toei / Shueisha / Bird Studio). Rename before any commercial or public storefront release.
2. **Save system**: autosaves to localStorage (`save.js`) on map changes, every ~5s of play and on tab close; Continue / New Game on the title.
3. **Touch / gamepad**: keyboard only (main.js has stubs for `#btn-attack` / `#btn-act` but no buttons exist).
4. **Fonts**: loaded from Google Fonts — self-host Press Start 2P and Pixelify Sans (both OFL) for offline/desktop builds.
5. **Audio**: none yet.
6. **Frame rate**: fixed timestep — logic runs at 60 updates/s on any monitor.

## Target platforms

- **Web (itch.io, Newgrounds, CrazyGames, Poki)**: `npm run build`, zip `dist/`, upload as HTML5 game.
- **Desktop (Steam, itch app)**: wrap with Tauri (small) or Electron (Steamworks SDK easier via steamworks.js).
- **Mobile (App Store, Google Play)**: wrap with Capacitor; requires touch controls first.

See `DESIGN.md` for the game/story plan and `CLAUDE.md` for conventions.
