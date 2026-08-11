import handler from "./api/ai-coach.ts";

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
    },
  };
  return res;
}

import fs from "fs";

async function testPrompt(prompt) {
  const req = {
    method: "POST",
    headers: {},
    body: {
      message: prompt,
      history: [],
      tradeContext: "Current Weekly Rule: Process Over Outcome. Win Rate: 78%. Overall Grade: A.",
    },
  };
  const res = createMockRes();
  await handler(req, res);
  console.log(`\nQ: ${prompt}`);
  console.log(`A: ${res.body?.reply || res.body?.error}`);
}

async function runTests() {
  const envContent = fs.readFileSync(".env", "utf-8");
  envContent.split("\n").forEach((line) => {
    if (line.includes("=")) {
      const parts = line.split("=");
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      if (!process.env[key]) process.env[key] = val;
    }
  });

  await testPrompt("1+1");
  await testPrompt("2+2 kya hota hai?");
  await testPrompt("Liquidity sweep kya hota hai?");
  await testPrompt("Mera aaj 2 trade loss hua, ab kya karu?");
  await testPrompt("Explain Order Block in simple words.");
  await testPrompt("What is BOS?");
}

runTests().catch(console.error);
