import { createInterface } from 'node:readline';
import type { JsonRpcMessage } from './types.js';
import { TOOLS, TOOL_HANDLERS } from './tools/index.js';

const VERSION = '0.1.0';
const NAME = 'design.md-mcp';

function writeMessage(msg: JsonRpcMessage): void {
  const line = JSON.stringify(msg);
  process.stdout.write(line + '\n');
}

function writeError(id: unknown, code: number, message: string): void {
  writeMessage({ jsonrpc: '2.0', id: id as number | string | undefined, error: { code, message } });
}

function writeResult(id: number | string, result: unknown): void {
  writeMessage({ jsonrpc: '2.0', id, result });
}

export async function startServer(): Promise<void> {
  const rl = createInterface({ input: process.stdin });
  let pending = 0;
  let closed = false;

  function onClose(): void {
    closed = true;
    if (pending === 0) process.exit(0);
  }

  function done(): void {
    pending--;
    if (closed && pending === 0) process.exit(0);
  }

  rl.on('line', (line) => {
    try {
      const msg: JsonRpcMessage = JSON.parse(line);

      if (msg.method === 'initialize') {
        writeResult(msg.id!, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: NAME, version: VERSION },
        });
      } else if (msg.method === 'notifications/initialized') {
      } else if (msg.method === 'tools/list') {
        writeResult(msg.id!, { tools: TOOLS });
      } else if (msg.method === 'tools/call') {
        const name = msg.params?.name as string;
        const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
        const handler = TOOL_HANDLERS[name];
        if (handler) {
          pending++;
          handler(msg.id!, args)
            .then((result) => writeResult(msg.id!, result))
            .catch((e: Error) => writeError(msg.id!, -32603, e.message))
            .finally(done);
        } else {
          writeError(msg.id!, -32601, `Unknown tool: ${name}`);
        }
      } else {
        writeError(msg.id!, -32601, `Unknown method: ${msg.method}`);
      }
    } catch (e) {
      process.stderr.write(`Failed to parse message: ${(e as Error).message}\n`);
    }
  });

  rl.on('close', onClose);

  process.stderr.write(`${NAME} v${VERSION} running (MCP stdio transport)\n`);
}
