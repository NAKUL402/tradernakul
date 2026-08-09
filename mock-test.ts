import handler from "./api/ai-coach.ts";

const originalFetch = globalThis.fetch;
let forceGroq429 = false;

globalThis.fetch = async (url, options) => {
  if (forceGroq429 && url.toString().includes("api.groq.com")) {
    return {
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      json: async () => ({ error: { message: "Mocked 429 Rate Limit" } })
    } as any;
  }
  return originalFetch(url, options);
};

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, val) {
      this.headers[key] = val;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    }
  };
  return res;
}

import fs from 'fs';

async function runTests() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.includes('=')) {
      const parts = line.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (!process.env[key]) process.env[key] = val;
    }
  });

  console.log("--- TEST 1: Normal Groq Request ---");
  forceGroq429 = false;
  let req1 = { method: "POST", headers: {}, body: { message: "Reply with the word SUCCESS" } } as any;
  let res1 = createMockRes();
  await handler(req1, res1);
  console.log("Status:", res1.statusCode);
  console.log("Body:", res1.body);

  console.log("\n--- TEST 2: Mocked Groq 429 (OpenRouter Fallback) ---");
  forceGroq429 = true;
  let req2 = { method: "POST", headers: {}, body: { message: "Reply with the word SUCCESS" } } as any;
  let res2 = createMockRes();
  await handler(req2, res2);
  console.log("Status:", res2.statusCode);
  console.log("Body:", res2.body);
}

runTests().catch(console.error);
