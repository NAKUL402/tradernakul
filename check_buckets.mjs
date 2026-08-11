import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const raw = trimmed.slice(eqIdx + 1).trim();
    const val = raw.replace(/^["']|["']$/g, "");
    if (key) process.env[key] = val;
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBucket(bucketName) {
  try {
    const { data, error } = await supabase.storage.from(bucketName).list();
    if (error) {
      if (error.message.includes("Bucket not found") || error.statusCode === 404 || error.message.includes("Object not found") || error.message.includes("The resource was not found")) {
        console.log(`[!] Bucket '${bucketName}' does NOT exist (Error: ${error.message})`);
      } else {
         console.log(`[?] Bucket '${bucketName}' check returned error: ${error.message} (Bucket MIGHT exist but RLS blocked list)`);
      }
    } else {
      console.log(`[+] Bucket '${bucketName}' EXISTS (listed ${data?.length || 0} items)`);
    }
  } catch (err) {
    console.log(`[!] Bucket '${bucketName}' check threw error:`, err.message);
  }
}

async function main() {
  console.log("Checking remote Supabase connection...");
  console.log("URL:", supabaseUrl);
  
  await checkBucket("profile-avatars");
  await checkBucket("trade-screenshots");
}

main();
