/* ============================================================
   main.js  —  Build entry. Loads the game scripts in order; each
   still registers its global (G, Engine, World, ...) on window.
   Order matters: later files use the globals of earlier ones.
   ============================================================ */
import "./game/sprites.js";
import "./game/sprites2.js";
import "./game/tiles.js";
import "./game/tiles2.js";
import "./game/tiles3.js";
import "./game/world.js";
import "./game/world2.js";
import "./game/world3.js";
import "./game/world4.js";
import "./game/world5.js";
import "./game/engine.js";
import "./game/render.js";
import "./game/combat.js";
import "./game/shop.js";
import "./game/ui.js";
import "./game/menu.js";
import "./game/save.js";
import "./game/cutscene.js";
import "./game/main.js";

// test helpers in the browser console (cheat.help()); dev server only, never in a build
if (import.meta.env.DEV) import("./game/cheats.js");
