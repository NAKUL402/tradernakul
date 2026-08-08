import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
// CRITICAL: We MUST use the service role key to bypass RLS and securely write the token
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";



export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const code = url.searchParams.get("code");

    if (!code) {
      return res.status(400).json({ error: "No authorization code provided by Upstox." });
    }

    const clientId = process.env.UPSTOX_API_KEY;
    const clientSecret = process.env.UPSTOX_API_SECRET;
    
    // The redirect URI must match exactly what was configured in Upstox Developer Portal
    // Determine dynamically based on host
    const redirectUri = `https://${req.headers.host}/api/upstox-callback`;
    // For local dev it would be http://localhost:5173/api/upstox-callback, but Upstox requires https usually.
    // In actual production implementation, we'd ensure this is HTTPS.

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Upstox credentials are not configured in environment variables." });
    }

    // Call Upstox to exchange code for token
    const tokenResponse = await fetch("https://api.upstox.com/v2/login/authorization/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.text();
      console.error("[upstox-callback] Failed to get token:", errData);
      return res.status(tokenResponse.status).json({ error: "Upstox Token Exchange Failed", details: errData });
    }

    interface UpstoxTokenResponse {
      access_token?: string;
    }
    const data = (await tokenResponse.json()) as UpstoxTokenResponse;
    
    // Securely store token server-side in Supabase using the service role key
    if (data.access_token) {
      if (supabaseUrl && supabaseServiceKey) {
        // Initialize client with SERVICE ROLE KEY to bypass RLS
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // 1. Delete old tokens (keep it single-row for simplicity)
        await supabase.from("upstox_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all
        
        // 2. Insert new token
        const { error: insertError } = await supabase.from("upstox_tokens").insert({
          access_token: data.access_token,
          updated_at: new Date().toISOString()
        });

        if (insertError) {
          console.error("[upstox-callback] Supabase Insert Error:", insertError);
        } else {
          console.log("[upstox-callback] Successfully secured Upstox access token in Supabase DB via Service Role.");
        }
      } else {
        console.warn("[upstox-callback] SUPABASE_SERVICE_ROLE_KEY not configured in .env, token not persisted.");
      }
    }

    // Redirect the user back to the Market dashboard
    res.setHeader("Location", "/market");
    res.status(302).end();

  } catch (err) {
    console.error("[upstox-callback] Error:", err);
    res.status(500).json({ error: "Internal Server Error during OAuth callback." });
  }
}
