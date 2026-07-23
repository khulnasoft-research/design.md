import { readFile } from 'node:fs/promises';
import { lint } from '@google/design.md/linter';
import type { ToolDefinition, ToolHandler } from '../types.js';

export const DIFF_DEFINITION: ToolDefinition = {
  name: 'diff_design_md',
  description:
    'Compare two DESIGN.md files and report token changes (colors, typography, rounded, spacing, components) and regression detection.',
  inputSchema: {
    type: 'object',
    properties: {
      before: { type: 'string', description: "Path to the 'before' DESIGN.md" },
      after: { type: 'string', description: "Path to the 'after' DESIGN.md" },
    },
    required: ['before', 'after'],
  },
};

function diffMaps(
  before: Map<string, unknown>,
  after: Map<string, unknown>
): { added: string[]; removed: string[]; changed: string[]; unchanged: string[] } {
  const beforeKeys = new Set(before.keys());
  const afterKeys = new Set(after.keys());
  const added = [...afterKeys].filter((k) => !beforeKeys.has(k));
  const removed = [...beforeKeys].filter((k) => !afterKeys.has(k));
  const common = [...beforeKeys].filter((k) => afterKeys.has(k));
  const changed = common.filter(
    (k) => JSON.stringify(before.get(k)) !== JSON.stringify(after.get(k))
  );
  const unchanged = common.filter((k) => !changed.includes(k));
  return { added, removed, changed, unchanged };
}

export const handleDiffDesignMd: ToolHandler = async (id, args) => {
  const { before, after } = args as { before: string; after: string };
  const beforeContent = await readFile(before, 'utf-8');
  const afterContent = await readFile(after, 'utf-8');
  const beforeReport = lint(beforeContent);
  const afterReport = lint(afterContent);

  return {
    tokens: {
      colors: diffMaps(beforeReport.designSystem.colors, afterReport.designSystem.colors),
      typography: diffMaps(
        beforeReport.designSystem.typography,
        afterReport.designSystem.typography
      ),
      rounded: diffMaps(beforeReport.designSystem.rounded, afterReport.designSystem.rounded),
      spacing: diffMaps(beforeReport.designSystem.spacing, afterReport.designSystem.spacing),
    },
    findings: {
      before: beforeReport.summary,
      after: afterReport.summary,
      delta: {
        errors: afterReport.summary.errors - beforeReport.summary.errors,
        warnings: afterReport.summary.warnings - beforeReport.summary.warnings,
      },
    },
    regression:
      afterReport.summary.errors > beforeReport.summary.errors ||
      afterReport.summary.warnings > beforeReport.summary.warnings,
  };
};
