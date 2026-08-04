import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMcpClient } from './_mcp.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { method, params } = req.body;
    const client = await getMcpClient();
    const result = await client.request(
      { method: 'tools/call', params: { name: method, arguments: params } },
      { onprogress: () => {} }
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
