import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png"],
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2}"],
        // Revista do login desktop (ADR-104): código e fontes só descem quando a coluna aparece, nunca no pré-cache do celular.
        globIgnores: ["**/LoginMagazine-*.js", "**/magazine-*.woff2"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
