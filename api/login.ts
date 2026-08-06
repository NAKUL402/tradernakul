import { createHmac, createHash } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const ownerEmail = (process.env.OWNER_EMAIL || 'nakultrader007@gmail.com').toLowerCase();
    const inputHash = createHash('sha256').update(password).digest('hex');
    
    // Default password: TraderNakul@2026 (SHA-256 hash)
    const defaultHash = createHash('sha256').update('TraderNakul@2026').digest('hex');
    const storedHash = process.env.OWNER_PASSWORD_HASH || defaultHash;

    if (email.toLowerCase() !== ownerEmail || inputHash !== storedHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate session token: base64(timestamp:email:hmac_signature)
    const sessionSecret = process.env.SESSION_SECRET || 'tn-session-key-2026-production';
    const timestamp = Date.now().toString();
    const payload = `${timestamp}:${ownerEmail}`;
    const signature = createHmac('sha256', sessionSecret).update(payload).digest('hex');
    const token = Buffer.from(`${payload}:${signature}`).toString('base64');

    return res.status(200).json({
      token,
      user: {
        email: ownerEmail,
        name: 'Nakul (Owner)',
        role: 'admin',
        isOwner: true,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
