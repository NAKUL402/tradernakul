const fs = require('fs');

async function validateOpenRouter() {
  console.log("Starting OpenRouter Validation...");
  
  // 1. Load env vars safely
  let openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    try {
      const envContent = fs.readFileSync('.env', 'utf-8');
      envContent.split('\n').forEach(line => {
        if (line.includes('=')) {
          const parts = line.split('=');
          const key = parts[0].trim();
          if (key === 'OPENROUTER_API_KEY') {
            openRouterKey = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, "").trim();
          }
        }
      });
    } catch (err) {
      console.error("Could not read .env file");
      process.exit(1);
    }
  }

  if (!openRouterKey) {
    console.error("OPENROUTER_API_KEY not found.");
    process.exit(1);
  }

  console.log(`Key loaded: YES (length: ${openRouterKey.length} chars)`);

  // 2. Perform ONE minimal free inference test
  const body = JSON.stringify({
    model: "openrouter/free",
    messages: [{ role: "user", content: "Reply with the word SUCCESS only." }],
    temperature: 0.1,
    max_tokens: 10
  });

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://tradernakul.com",
        "X-Title": "TraderNakul-AI-Coach"
      },
      body
    });

    console.log(`HTTP Status: ${res.status}`);

    if (res.ok) {
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      console.log("Authentication: SUCCESS");
      console.log("Free inference: SUCCESS");
      console.log("Model used:", data.model);
    } else {
      console.log("Authentication/Inference: FAILED");
      const err = await res.text();
      console.log("Error body:", err);
    }
  } catch (err) {
    console.error("Network Error:", err.message);
  }
}

validateOpenRouter();
