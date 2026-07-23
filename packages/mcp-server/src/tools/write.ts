import { readFile, writeFile } from 'node:fs/promises';
import { lint } from '@scalify/cli/linter';
import { serializeFrontmatter } from '@scalify/design-core';
import type { ToolDefinition, ToolHandler } from '../types.js';

export const WRITE_DEFINITION: ToolDefinition = {
  name: 'write_design_md',
  description: 'Write or update a DESIGN.md file with new content. Auto-lints after write.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the DESIGN.md file' },
      frontmatter: { type: 'object', description: 'YAML frontmatter object' },
      body: { type: 'string', description: 'Markdown body content' },
    },
    required: ['path', 'body'],
  },
};

export const handleWriteDesignMd: ToolHandler = async (id, args) => {
  const { path, frontmatter, body } = args as {
    path: string;
    frontmatter?: Record<string, unknown>;
    body: string;
  };
  const yaml = frontmatter ? serializeFrontmatter(frontmatter) : '';
  const content = yaml ? `---\n${yaml}---\n${body}` : body;
  await writeFile(path, content, 'utf-8');
  const report = lint(content);
  return { success: true, path, findings: report.findings, summary: report.summary };
};
