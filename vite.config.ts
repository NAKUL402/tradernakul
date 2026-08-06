import { defineConfig } from "@lovable.dev/vite-tanstack-config";

console.log("====================================================");
console.log("VERCEL BUILD-TIME ENV DIAGNOSTIC LOG:");
console.log("SUPABASE_URL length:", (process.env.SUPABASE_URL || "").length);
console.log("VITE_SUPABASE_URL length:", (process.env.VITE_SUPABASE_URL || "").length);
console.log("VITE_SUPABASE_ANON_KEY length:", (process.env.VITE_SUPABASE_ANON_KEY || "").length);
console.log("VITE_SITE_URL length:", (process.env.VITE_SITE_URL || "").length);
console.log("Found env keys:", Object.keys(process.env).filter(k => k.includes("SUPABASE") || k.includes("VITE") || k.includes("SITE")));
console.log("====================================================");

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
