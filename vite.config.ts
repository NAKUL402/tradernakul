import { defineConfig } from "@lovable.dev/vite-tanstack-config";

console.log("====================================================");
console.log("VERCEL BUILD-TIME ENV DIAGNOSTIC LOG:");
console.log("SUPABASE_URL length:", (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABACE_URL || process.env.VITE_SUPABACE_URL || "").length);
console.log("VITE_SUPABASE_ANON_KEY length:", (process.env.VITE_SUPABASE_ANON_KEY || "").length);
console.log("====================================================");

export default defineConfig({
  define: {
    "process.env.SUPABASE_URL": JSON.stringify(
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABACE_URL ||
      process.env.VITE_SUPABACE_URL ||
      ""
    ),
    "process.env.SUPABASE_ANON_KEY": JSON.stringify(
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABACE_ANON_KEY ||
      process.env.VITE_SUPABACE_ANON_KEY ||
      ""
    ),
  },
  nitro: {
    preset: "vercel",
    prerender: {
      crawlLinks: false,
      routes: [],
    },
  },
});
