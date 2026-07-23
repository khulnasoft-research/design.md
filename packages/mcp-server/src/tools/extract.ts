import { readFile } from 'node:fs/promises';
import { lint } from '@google/design.md/linter';
import type { ToolDefinition, ToolHandler } from '../types.js';

export const EXTRACT_DEFINITION: ToolDefinition = {
  name: 'extract_token_reference',
  description: "Extract a specific token value from DESIGN.md by path (e.g., 'colors.primary').",
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the DESIGN.md file' },
      tokenPath: {
        type: 'string',
        description: "Dot-notation path to token (e.g., 'colors.primary', 'typography.heading')",
      },
    },
    required: ['path', 'tokenPath'],
  },
};

export const handleExtractTokenReference: ToolHandler = async (id, args) => {
  const { path, tokenPath } = args as { path: string; tokenPath: string };
  const content = await readFile(path, 'utf-8');
  const report = lint(content);
  const keys = tokenPath.split('.');
  let value: unknown = report.designSystem;
  for (const key of keys) {
    if (typeof value === 'object' && value !== null && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      throw new Error(`Token path "${tokenPath}" not found`);
    }
  }
  return { tokenPath, value, resolved: JSON.stringify(value) };
};
