import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Querying database schema for 'trades'...");
  // Let's select one row or inspect metadata via a query
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error reading trades:", error);
    return;
  }
  
  console.log("Success! Sample row:", data);
}

test();
