import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    preset: "vercel",
    prerender: {
      crawlLinks: false,
      routes: [],
    },
  },
});
