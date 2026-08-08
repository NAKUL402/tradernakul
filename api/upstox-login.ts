export default function handler(req: any, res: any) {
  try {
    const clientId = process.env.UPSTOX_API_KEY;
    
    if (!clientId) {
      return res.status(500).json({ error: "UPSTOX_API_KEY is not configured on the server." });
    }

    // Determine the host to dynamically set redirect URI
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "tradernakul.vercel.app";
    const redirectUri = `${protocol}://${host}/api/upstox-callback`;

    // Construct the Upstox OAuth authorization URL
    // https://upstox.com/developer/api-documentation/authentication
    const upstoxAuthUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    // Redirect the user to Upstox to authorize
    res.setHeader("Location", upstoxAuthUrl);
    res.status(302).end();
  } catch (err) {
    console.error("[upstox-login] Error:", err);
    res.status(500).json({ error: "Internal Server Error during Upstox Login redirect." });
  }
}
