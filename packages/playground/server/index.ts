import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const STITCH_API_URL = process.env.STITCH_API_URL || 'https://stitch.withgoogle.com/api/mcp';
const STITCH_API_KEY = process.env.STITCH_API_KEY || '';
const PORT = parseInt(process.env.PORT || '3030');

interface MCPRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

let client: Client | null = null;
let transport: StreamableHTTPClientTransport | null = null;

async function getClient() {
  if (client) return client;
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

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (url.pathname === '/api/health') {
    return Response.json(
      { ok: true, stitchUrl: STITCH_API_URL, hasKey: !!STITCH_API_KEY },
      { headers }
    );
  }

  if (url.pathname === '/api/tools') {
    try {
      const c = await getClient();
      const result = await c.listTools();
      return Response.json(result, { headers });
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 500, headers });
    }
  }

  if (url.pathname === '/api/call' && req.method === 'POST') {
    try {
      const body: MCPRequest = await req.json();
      const c = await getClient();
      const result = await c.request(
        { method: 'tools/call', params: { name: body.method, arguments: body.params } },
        { onprogress: () => {} }
      );
      return Response.json(result, { headers });
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 500, headers });
    }
  }

  return Response.json({ error: 'not found' }, { status: 404, headers });
}

Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

console.log(`Stitch Playground API running on http://localhost:${PORT}`);
console.log(`Stitch API URL: ${STITCH_API_URL}`);
console.log(`Auth: ${STITCH_API_KEY ? 'API key configured' : 'NO API KEY - set STITCH_API_KEY'}`);
