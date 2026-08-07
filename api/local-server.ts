/**
 * Local API Development Server for TraderNakul
 * =============================================
 * Serves Vercel serverless functions locally on port 3001.
 * Vite dev server proxies /api/* → http://localhost:3001
 *
 * Usage:
 *   npm run dev:api   (Terminal 1)
 *   npm run dev       (Terminal 2)
 *
 * Or combined:
 *   npm run dev:full
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;

// ── Load .env ─────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) {
    console.warn("[api-server] WARNING: No .env file found at project root.");
    console.warn("[api-server] Create .env from .env.example and add your GEMINI_API_KEY.");
    return;
  }
  const content = fs.readFileSync(envPath, "utf8");
  let loaded = 0;
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const raw = trimmed.slice(eqIdx + 1).trim();
    const val = raw.replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = val;
      loaded++;
    }
  }
  console.log(`[api-server] Loaded ${loaded} env vars from .env`);
}

// ── Parse request body ────────────────────────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(data.trim() ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

// ── Mock Vercel response object ───────────────────────────────────────────────
function createMockResponse(res) {
  let statusCode = 200;
  const headers = {};

  return {
    setHeader(key, value) {
      headers[key] = value;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      const body = JSON.stringify(data);
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = String(Buffer.byteLength(body));
      res.writeHead(statusCode, headers);
      res.end(body);
    },
    end() {
      res.writeHead(statusCode, headers);
      res.end();
    },
  };
}

// ── Route map: path → handler file ───────────────────────────────────────────
const ROUTES = {
  "/api/ai-coach": "./ai-coach.ts",
  "/api/health": "./health.ts",
  "/api/send-otp": "./send-otp.ts",
  "/api/approve-user": "./approve-user.ts",
  "/api/send-approval": "./send-approval.ts",
  "/api/send-status-email": "./send-status-email.ts",
};

// Cache for loaded modules
const moduleCache = new Map();

// ── Main request handler ──────────────────────────────────────────────────────
async function handleRequest(req, res) {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const handlerFile = ROUTES[pathname];
  if (!handlerFile) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: `Unknown API route: ${pathname}. Available: ${Object.keys(ROUTES).join(", ")}`,
      })
    );
    return;
  }

  try {
    const body = req.method === "POST" ? await parseBody(req) : {};
    const mockReq = { method: req.method, body, headers: req.headers, url: req.url };
    const mockRes = createMockResponse(res);

    // Dynamic import - use file:// URL for Windows ESM compatibility
    const modulePath = path.resolve(__dirname, handlerFile);
    const moduleUrl = pathToFileURL(modulePath).href;

    // Cache module (restart server to pick up API handler changes)
    let mod = moduleCache.get(modulePath);
    if (!mod) {
      mod = await import(moduleUrl);
      moduleCache.set(modulePath, mod);
    }

    const handler = mod.default;
    await handler(mockReq, mockRes);
    console.log(`[api-server] ${req.method} ${pathname} -> OK`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[api-server] ERROR ${pathname}:`, msg);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Local API server error: ${msg}` }));
    }
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
loadEnv();

const server = http.createServer(handleRequest);

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n[api-server] Local API server started on http://localhost:${PORT}`);
  console.log(`[api-server] Available routes:`);
  for (const route of Object.keys(ROUTES)) {
    console.log(`[api-server]   ${route}`);
  }
  const keySet = !!process.env["GEMINI_API_KEY"] || !!process.env["VITE_GEMINI_API_KEY"];
  console.log(
    `[api-server] GEMINI_API_KEY: ${keySet ? "SET (AI Coach ready)" : "MISSING (add to .env file)"}\n`
  );
});

server.on("error", (err) => {
  console.error("[api-server] Server error:", err.message);
  const errWithCode = err;
  if (errWithCode.code === "EADDRINUSE") {
    console.error(`[api-server] Port ${PORT} already in use. Kill the other process.`);
    process.exit(1);
  }
});
