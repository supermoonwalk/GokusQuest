# CLAUDE.md — Goku's Quest

Browser pixel-art action RPG. Vanilla JS + Canvas 2D. Read README.md first.

## Conventions
- Keep it dependency-light. No game engine migration unless asked.
- Pixel art stays crisp: `imageSmoothingEnabled = false`, `image-rendering: pixelated`, integer scaling only.
- Internal resolution 256×192, tile size 16. UI sizes in `cqmin` units relative to #viewport.
- Palette (CSS vars in index.html): ink #3b2f25, ink2 #5a4636, parch #f6e7c4, parch2 #fbf2da, parchEdge #e6d2a3, accent #c96d6d, good #5fb85f, gold #e0b54a, coin #f0c64a.
- Fonts: Press Start 2P (labels, numbers), Pixelify Sans (body/dialogue).
- Game state lives in global `G` (engine.js). `G.state`: title | play | dialogue | menu | map | shop | cutscene | ending.
- Monster stats in `World.MONSTERS` (world.js); quest steps in `World.QUEST` (world.js + world2.js).

## Roadmap to release (do in order, one PR each)
1. Convert classic scripts to ES modules (`import`/`export`), entry `src/main.js`, keep behaviour identical.
2. Fixed-timestep loop (60 updates/s, render decoupled) so speed doesn't depend on refresh rate.
3. ~~Save/load~~ (done — `save.js`; bump `VERSION` there when the save shape changes): serialize relevant parts of `G` (cur, player pos/hp, coins, treats, flags, quest, upgrades, gear, specials, entity alive/caged/opened states) to localStorage; Continue option on title.
4. Input abstraction: keyboard + Gamepad API + on-screen touch controls (d-pad, swipe, interact, J/K).
5. Audio: SFX + music per map (`map.music` already defined), with volume settings.
6. Pause/settings menu (volume, fullscreen, key rebinding).
7. Self-host fonts in `public/fonts/`.
8. Rename characters/title (IP — see README).
9. Platform builds: Tauri (desktop), Capacitor (mobile), itch.io zip of `dist/`.
