import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '@scalify/design-core';
import type { ToolDefinition, ToolHandler } from '../types.js';

export const READ_DEFINITION: ToolDefinition = {
  name: 'read_design_md',
  description:
    'Read and parse a DESIGN.md file, returning its raw content and frontmatter tokens as structured data.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the DESIGN.md file' },
    },
    required: ['path'],
  },
};

export const handleReadDesignMd: ToolHandler = async (id, args) => {
  const path = String(args.path);
  const content = await readFile(path, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);
  return { raw: content, frontmatter, body };
};
