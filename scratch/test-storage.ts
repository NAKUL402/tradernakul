import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("Missing Supabase credentials in env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorage() {
  const { data, error } = await supabase.storage.getBucket('trade-screenshots');
  console.log("Bucket:", data, error);
}

testStorage();
