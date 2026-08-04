import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMcpClient } from './_mcp.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const client = await getMcpClient();
    const result = await client.listTools();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
