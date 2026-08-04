import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStitchConfig } from './_mcp.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const { url, hasKey } = getStitchConfig();
  res.json({ ok: true, stitchUrl: url, hasKey });
}
