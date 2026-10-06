# Goku's Quest — The Search for Chi Chi

Pixel-art action RPG for the browser. Vanilla JavaScript + Canvas 2D, no dependencies at runtime.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/
```

Without Node: open `index.html` directly in a browser — it works as-is.

## Gameplay

- **Town** (safe): villager, Whiskers' Market (shop), Chi Chi's cottage (enterable house with clues).
- **Whiskerwood** (forest): Alley Kitten, Scruffy Stray, Mean Mouser, Shade Prowler, Hex the Hisser, boss Tuxedo Tom.
- **Chapter II — Vesper's Manor**: Brutus, Shade Prowlers, Hex, 5 caged kittens to free, final boss Madame Vesper.
- Quest chain: `start → searched → deduced → fighting → boss → tomBeaten → manor → done`.
- Economy: coins from monsters/chests → shop (stat upgrades, special moves, treats, gear sell).
- Gear slots: claws / collar / charm, with tiers and random rolls.

Controls: WASD/arrows move · Space swipe · E interact · J/K specials · T treat · Q quest · I bag · M map · Esc close.

## Structure

| File | Role |
|---|---|
| `index.html` | DOM, HUD, panels, overlays, all CSS |
| `src/game/sprites.js`, `sprites2.js` | Pixel sprites as string templates, recolored per palette |
| `src/game/tiles.js`, `tiles2.js`, `tiles3.js` | 16×16 tiles baked to offscreen canvases (town, manor, forest/shop) |
| `src/game/world.js`, `world2.js` | Maps, entities, monster stats, quest steps, warps, economy |
| `src/game/engine.js` | Global state `G`, movement, AABB collision, camera, interaction, warps |
| `src/game/render.js` | Per-frame world drawing |
| `src/game/combat.js` | Real-time combat, enemy AI, specials, FX |
| `src/game/shop.js` | Shop panel |
| `src/game/ui.js` | Dialogue, HUD, menus, map, title, cutscenes, ending |
| `src/game/main.js` | Boot, scaling, keyboard input, game loop |

Internal resolution: 256×192 (16×12 tiles), integer-scaled to the window.
Scripts are classic `<script>` tags sharing globals (`G`, `Engine`, `World`, `Tiles`, `Sprites`, `Combat`, `UI`, `Shop`); load order in `index.html` matters.

## Before publishing

1. **Name / IP**: "Goku" and "Chi Chi" are Dragon Ball character names (Toei / Shueisha / Bird Studio). Rename before any commercial or public storefront release.
2. **Save system**: none yet — progress is lost on reload.
3. **Touch / gamepad**: keyboard only (main.js has stubs for `#btn-attack` / `#btn-act` but no buttons exist).
4. **Fonts**: loaded from Google Fonts — self-host Press Start 2P and Pixelify Sans (both OFL) for offline/desktop builds.
5. **Audio**: none yet.
6. **Frame rate**: logic runs per `requestAnimationFrame`, so speed scales with monitor Hz (120/144 Hz = faster game). Needs a fixed timestep.

## Target platforms

- **Web (itch.io, Newgrounds, CrazyGames, Poki)**: `npm run build`, zip `dist/`, upload as HTML5 game.
- **Desktop (Steam, itch app)**: wrap with Tauri (small) or Electron (Steamworks SDK easier via steamworks.js).
- **Mobile (App Store, Google Play)**: wrap with Capacitor; requires touch controls first.

See `CLAUDE.md` for the work plan.
