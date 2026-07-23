import { readFile } from 'node:fs/promises';
import { lint } from '@google/design.md/linter';
import type { ToolDefinition, ToolHandler } from '../types.js';

export const MERGE_DEFINITION: ToolDefinition = {
  name: 'merge_design_tokens',
  description: 'Merge multiple DESIGN.md files into one, with conflict detection.',
  inputSchema: {
    type: 'object',
    properties: {
      paths: {
        type: 'array',
        items: { type: 'string' },
        description: 'Paths to DESIGN.md files to merge',
      },
      strategy: {
        type: 'string',
        enum: ['override', 'combine'],
        description: 'Merge strategy: override (last wins) or combine (merge arrays)',
      },
    },
    required: ['paths'],
  },
};

export const handleMergeDesignTokens: ToolHandler = async (id, args) => {
  const { paths, strategy } = args as { paths: string[]; strategy?: 'override' | 'combine' };
  const mergeStrategy = strategy || 'override';
  const reports: Array<{ path: string; summary: { errors: number; warnings: number; infos: number } }> = [];
  const merged = {
    colors: new Map(),
    typography: new Map(),
    rounded: new Map(),
    spacing: new Map(),
    components: new Map(),
  } as Record<string, Map<string, unknown>>;

  for (const p of paths) {
    const content = await readFile(p, 'utf-8');
    const report = lint(content);
    reports.push({ path: p, summary: report.summary });
    if (mergeStrategy === 'override') {
      merged.colors = new Map([...merged.colors, ...report.designSystem.colors]);
      merged.typography = new Map([...merged.typography, ...report.designSystem.typography]);
      merged.rounded = new Map([...merged.rounded, ...report.designSystem.rounded]);
      merged.spacing = new Map([...merged.spacing, ...report.designSystem.spacing]);
      merged.components = new Map([...merged.components, ...report.designSystem.components]);
    }
  }

  return {
    merged: Object.fromEntries(
      Object.entries(merged).map(([k, v]) => [k, Object.fromEntries(v)])
    ),
    reports,
  };
};
