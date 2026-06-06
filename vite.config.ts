import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest.json";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: {
    port: 5173,
    strictPort: true,
    // Required for remote dev (Cursor/WSL): forwards port 5173 to your machine
    host: true,
    hmr: {
      port: 5173,
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
