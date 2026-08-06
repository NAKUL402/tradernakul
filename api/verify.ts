import { createHmac } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token } = req.body || {};

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = Buffer.from(token, 'base64').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const [timestamp, email, signature] = parts;
    const sessionSecret = process.env.SESSION_SECRET || 'tn-session-key-2026-production';
    const expectedSig = createHmac('sha256', sessionSecret).update(`${timestamp}:${email}`).digest('hex');

    if (signature !== expectedSig) {
      return res.status(401).json({ error: 'Invalid token signature' });
    }

    // Check token expiry: 7 days
    const tokenAge = Date.now() - parseInt(timestamp!, 10);
    if (isNaN(tokenAge) || tokenAge > 7 * 24 * 60 * 60 * 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }

    const ownerEmail = (process.env.OWNER_EMAIL || 'nakultrader007@gmail.com').toLowerCase();

    return res.status(200).json({
      valid: true,
      user: {
        email: ownerEmail,
        name: 'Nakul (Owner)',
        role: 'admin',
        isOwner: true,
      },
    });
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
