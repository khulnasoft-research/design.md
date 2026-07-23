import { readFile } from 'node:fs/promises';
import { lint } from '@scalify/cli/linter';
import type { ToolDefinition, ToolHandler } from '../types.js';

export const LINT_DEFINITION: ToolDefinition = {
  name: 'lint_design_md',
  description:
    'Validate a DESIGN.md file for structural correctness. Returns errors, warnings, and info findings.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the DESIGN.md file' },
    },
    required: ['path'],
  },
};

export const handleLintDesignMd: ToolHandler = async (id, args) => {
  const path = String(args.path);
  const content = await readFile(path, 'utf-8');
  const report = lint(content);
  return {
    findings: report.findings,
    summary: report.summary,
    sections: report.sections,
    designSystem: {
      colors: Object.fromEntries(report.designSystem.colors),
      typography: Object.fromEntries(report.designSystem.typography),
      rounded: Object.fromEntries(report.designSystem.rounded),
      spacing: Object.fromEntries(report.designSystem.spacing),
      components: Object.fromEntries(report.designSystem.components),
    },
  };
};
