import { readFile } from 'node:fs/promises';
import { lint } from '@scalify/cli/linter';
import type { ToolDefinition, ToolHandler } from '../types.js';

export const VALIDATE_DEFINITION: ToolDefinition = {
  name: 'validate_component_tokens',
  description: 'Validate component token properties and check for missing references.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the DESIGN.md file' },
      component: { type: 'string', description: 'Component name to validate' },
    },
    required: ['path', 'component'],
  },
};

export const handleValidateComponentTokens: ToolHandler = async (id, args) => {
  const { path, component } = args as { path: string; component: string };
  const content = await readFile(path, 'utf-8');
  const report = lint(content);
  const componentToken = (report.designSystem.components as Map<string, unknown>).get(component);
  if (!componentToken) {
    throw new Error(`Component "${component}" not found`);
  }
  const props = componentToken as Record<string, unknown>;
  const missing: string[] = [];
  for (const [key, val] of Object.entries(props)) {
    const ref = String(val);
    if (ref.includes('{') || ref.includes('$')) {
      const refPath = ref.replace(/[{}$]/g, '');
      let refValue: unknown = report.designSystem;
      for (const part of refPath.split('.')) {
        if (typeof refValue === 'object' && refValue !== null && part in refValue) {
          refValue = (refValue as Record<string, unknown>)[part];
        } else {
          missing.push(`${key}: ${refPath}`);
          break;
        }
      }
    }
  }
  return {
    component,
    properties: props,
    missingReferences: missing,
    valid: missing.length === 0,
  };
};
