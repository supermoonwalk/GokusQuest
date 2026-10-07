import { defineConfig } from "vite";

// relative asset paths so dist/ works from any folder (itch.io, a sub-path, ...)
export default defineConfig({ base: "./" });
