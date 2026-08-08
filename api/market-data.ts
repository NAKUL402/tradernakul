import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
// CRITICAL: We MUST use the service role key to bypass RLS and securely read the token
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";



// In-memory cache to prevent Finnhub/Upstox rate limits (60/min) on Vercel
const CACHE_TTL = 60000; // 60 seconds
let cache: { data: any; timestamp: number } | null = null;

const FINNHUB_SYMBOLS = [
  { id: "EUR/USD", symbol: "OANDA:EUR_USD" },
  { id: "GBP/USD", symbol: "OANDA:GBP_USD" },
  { id: "USD/JPY", symbol: "OANDA:USD_JPY" },
  { id: "USD/CAD", symbol: "OANDA:USD_CAD" },
  { id: "USD/CHF", symbol: "OANDA:USD_CHF" },
  { id: "AUD/USD", symbol: "OANDA:AUD_USD" },
  { id: "NZD/USD", symbol: "OANDA:NZD_USD" },
  { id: "XAU/USD", symbol: "OANDA:XAU_USD" },
];

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    
    // Serve from cache if valid
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return res.status(200).json(cache.data);
    }

    // 1. Fetch Forex from Finnhub
    let forexData: any = { status: "unconfigured", message: "Live market data credentials are not configured.", data: null };
    if (finnhubKey) {
      try {
        const forexResults = await Promise.all(
          FINNHUB_SYMBOLS.map(async (f) => {
            const fRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${f.symbol}&token=${finnhubKey}`);
            if (!fRes.ok) throw new Error("Finnhub error");
            interface FinnhubQuote {
              c: number;
              pc: number;
              d: number;
              dp: number;
            }
            const data = (await fRes.json()) as FinnhubQuote;
            // Finnhub response: { c: current, d: change, dp: percent, h: high, l: low, o: open, pc: prev close }
            return {
              symbol: f.id,
              price: data.c,
              prevClose: data.pc,
              change: data.d,
              changePct: data.dp,
            };
          })
        );
        forexData = {
          status: "live",
          data: {
            instruments: forexResults,
            lastUpdated: new Date().toLocaleTimeString(),
            marketStatus: "OPEN"
          }
        };
      } catch (err) {
        forexData = { status: "error", message: "Finnhub rate limit or connection error.", data: null };
      }
    }

    // 2. Fetch Indian Market from Upstox V3
    let indianData: any = { status: "unconfigured", message: "Upstox OAuth Login Required.", data: null };
    
    let dbToken: string | null = null;
    if (supabaseUrl && supabaseServiceKey) {
      // Initialize client with SERVICE ROLE KEY to bypass RLS
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: tokenData, error: dbError } = await supabase
        .from("upstox_tokens")
        .select("access_token")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
        
      if (!dbError && tokenData) {
        dbToken = tokenData.access_token;
      }
    }

    if (dbToken) {
      try {
        const upstoxSymbols = "NSE_INDEX|Nifty 50,NSE_INDEX|Nifty Bank,BSE_INDEX|SENSEX,NSE_INDEX|India VIX";
        const uRes = await fetch(`https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(upstoxSymbols)}`, {
          headers: {
            "Authorization": `Bearer ${dbToken}`,
            "Accept": "application/json"
          }
        });
        
        if (uRes.ok) {
          interface UpstoxQuote {
            last_price: number;
            ohlc: { close: number; };
          }
          interface UpstoxResponse {
            data: Record<string, UpstoxQuote>;
          }
          const json = (await uRes.json()) as UpstoxResponse;
          const instruments = Object.keys(json.data).map(key => {
            const quote = json.data[key];
            return {
              symbol: key.split("|")[1] || key,
              price: quote.last_price,
              prevClose: quote.ohlc.close,
              change: quote.last_price - quote.ohlc.close,
              changePct: ((quote.last_price - quote.ohlc.close) / quote.ohlc.close) * 100,
            };
          });
          
          indianData = {
            status: "live",
            data: {
              instruments,
              lastUpdated: new Date().toLocaleTimeString(),
              marketStatus: "LIVE"
            }
          };
        } else {
          indianData = { status: "error", message: "Upstox API token expired or invalid.", data: null };
        }
      } catch (err) {
        indianData = { status: "error", message: "Upstox connection error.", data: null };
      }
    }

    const payload = { indianMarket: indianData, forexMarket: forexData };
    
    // Update cache
    cache = { data: payload, timestamp: Date.now() };

    return res.status(200).json(payload);
    
  } catch (error) {
    console.error("[market-data] API Error:", error);
    return res.status(500).json({
      indianMarket: { status: "error", message: "Live market data temporarily unavailable.", data: null },
      forexMarket: { status: "error", message: "Live market data temporarily unavailable.", data: null }
    });
  }
}
