import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const STITCH_API_URL = process.env.STITCH_API_URL || 'https://stitch.withgoogle.com/api/mcp';
const STITCH_API_KEY = process.env.STITCH_API_KEY || '';

let client: Client | null = null;
let transport: StreamableHTTPClientTransport | null = null;

export async function getMcpClient() {
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

export function getStitchConfig() {
  return { url: STITCH_API_URL, hasKey: !!STITCH_API_KEY };
}
