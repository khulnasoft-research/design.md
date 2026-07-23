import { readFile } from 'node:fs/promises';
import { lint } from '@scalify/cli/linter';
import type { ToolDefinition, ToolHandler } from '../types.js';

export const EXPORT_DEFINITION: ToolDefinition = {
  name: 'export_design_md',
  description:
    'Export DESIGN.md tokens to Tailwind v3 JSON, Tailwind v4 CSS, or W3C DTCG format.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the DESIGN.md file' },
      format: {
        type: 'string',
        enum: ['json-tailwind', 'css-tailwind', 'dtcg'],
        description:
          'Export format: json-tailwind (Tailwind v3), css-tailwind (Tailwind v4 CSS), dtcg (W3C Design Tokens)',
      },
    },
    required: ['path', 'format'],
  },
};

export const handleExportDesignMd: ToolHandler = async (id, args) => {
  const { path, format } = args as { path: string; format: string };
  const content = await readFile(path, 'utf-8');
  const report = lint(content);
  const fmt = format as string;

  if (fmt === 'css-tailwind') {
    const { TailwindV4EmitterHandler, serializeTailwindV4 } =
      await import('@scalify/cli/linter');
    const handler = new TailwindV4EmitterHandler();
    const result = handler.execute(report.designSystem);
    if (!result.success) throw new Error(result.error.message);
    return {
      format: 'css-tailwind',
      output: serializeTailwindV4(result.data.theme),
    };
  } else if (fmt === 'json-tailwind' || fmt === 'tailwind') {
    const { TailwindEmitterHandler } = await import('@scalify/cli/linter');
    const handler = new TailwindEmitterHandler();
    const result = handler.execute(report.designSystem);
    if (!result.success) throw new Error(result.error.message);
    return {
      format: 'json-tailwind',
      output: JSON.stringify(result.data, null, 2),
    };
  } else if (fmt === 'dtcg') {
    const { DtcgEmitterHandler } = await import('@scalify/cli/linter');
    const handler = new DtcgEmitterHandler();
    const result = handler.execute(report.designSystem);
    if (!result.success) throw new Error(result.error.message);
    return { format: 'dtcg', output: JSON.stringify(result.data, null, 2) };
  }

  throw new Error(`Invalid format "${fmt}". Valid: json-tailwind, css-tailwind, dtcg`);
};
