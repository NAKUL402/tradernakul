import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  define: {
    "process.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ""),
    "process.env.SUPABASE_ANON_KEY": JSON.stringify(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""),
  },
  nitro: {
    preset: "vercel",
    prerender: {
      crawlLinks: false,
      routes: [],
    },
  },
});
