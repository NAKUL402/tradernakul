const fetch = require("node-fetch");
const assert = require("assert");

async function runTests() {
  console.log("Running AI Coach Test Matrix...");
  let passed = 0, failed = 0;
  
  const testMsg = async (msg, expectedStr) => {
    try {
      const res = await fetch("http://localhost:3001/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: [] })
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(`❌ FAILED: ${msg} | Expected ${expectedStr} but got error:`, data);
        failed++;
        return;
      }
      if (data.reply) {
        console.log(`✅ PASSED: ${msg}`);
        passed++;
      } else {
        console.log(`❌ FAILED: ${msg} | No reply in data`, data);
        failed++;
      }
    } catch(err) {
      console.log(`❌ FAILED: ${msg} | Network error`, err.message);
      failed++;
    }
  };

  await testMsg("2+2 kya hai?", "Dynamic Math response");
  await testMsg("Liquidity sweep kya hota hai?", "SMC response");
  
  console.log(`\nTests finished. Passed: ${passed}, Failed: ${failed}`);
}

runTests();
