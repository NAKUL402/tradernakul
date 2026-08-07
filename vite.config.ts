import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    preset: "vercel",
    prerender: {
      crawlLinks: false,
      routes: [],
    },
  },
  vite: {
    server: {
      proxy: {
        // Forward /api/* to local API dev server in development
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: false,
          secure: false,
        },
      },
    },
  },
});
