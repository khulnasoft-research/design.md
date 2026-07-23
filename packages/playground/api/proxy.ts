import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const STITCH_API_URL = process.env.STITCH_API_URL || 'https://stitch.withgoogle.com/api/mcp';
const STITCH_API_KEY = process.env.STITCH_API_KEY || '';

let client: Client | null = null;
let transport: StreamableHTTPClientTransport | null = null;

async function getClient() {
  if (client && transport) return client;
  transport = new StreamableHTTPClientTransport(new URL(STITCH_API_URL), {
    headers: {
      'Content-Type': 'application/json',
      ...(STITCH_API_KEY ? { 'X-Goog-Api-Key': STITCH_API_KEY } : {}),
    },
  });
  client = new Client({ name: 'stitch-playground', version: '0.1.0' });
  await client.connect(transport);
  return client;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { path } = req.query;

  try {
    if (req.url === '/api/proxy?health' || req.url?.includes('health')) {
      return res.json({ ok: true, stitchUrl: STITCH_API_URL, hasKey: !!STITCH_API_KEY });
    }

    if (req.url === '/api/proxy?tools' || req.url?.includes('tools')) {
      const c = await getClient();
      const result = await c.listTools();
      return res.json(result);
    }

    if (req.method === 'POST' && (req.url === '/api/proxy?call' || req.url?.includes('call'))) {
      const { method, params } = req.body;
      const c = await getClient();
      const result = await c.request(
        { method: 'tools/call', params: { name: method, arguments: params } },
        { onprogress: () => {} }
      );
      return res.json(result);
    }

    return res.status(404).json({ error: 'not found' });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}
