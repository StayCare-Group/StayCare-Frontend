import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Mismo alias que vite.config.js — necesario para que Vitest resuelva @/...
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // jsdom simula el navegador para componentes Vue
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    reporter: "verbose",
  },
});
