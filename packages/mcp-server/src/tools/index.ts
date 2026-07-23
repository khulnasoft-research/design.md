import type { ToolDefinition, ToolHandler } from '../types.js';
import { handleLintDesignMd, LINT_DEFINITION } from './lint.js';
import { handleExportDesignMd, EXPORT_DEFINITION } from './export.js';
import { handleDiffDesignMd, DIFF_DEFINITION } from './diff.js';
import { handleReadDesignMd, READ_DEFINITION } from './read.js';
import { handleWriteDesignMd, WRITE_DEFINITION } from './write.js';
import { handleExtractTokenReference, EXTRACT_DEFINITION } from './extract.js';
import { handleValidateComponentTokens, VALIDATE_DEFINITION } from './validate.js';
import { handleMergeDesignTokens, MERGE_DEFINITION } from './merge.js';

export const TOOLS: ToolDefinition[] = [
  LINT_DEFINITION,
  EXPORT_DEFINITION,
  DIFF_DEFINITION,
  READ_DEFINITION,
  WRITE_DEFINITION,
  EXTRACT_DEFINITION,
  VALIDATE_DEFINITION,
  MERGE_DEFINITION,
];

export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  lint_design_md: handleLintDesignMd,
  export_design_md: handleExportDesignMd,
  diff_design_md: handleDiffDesignMd,
  read_design_md: handleReadDesignMd,
  write_design_md: handleWriteDesignMd,
  extract_token_reference: handleExtractTokenReference,
  validate_component_tokens: handleValidateComponentTokens,
  merge_design_tokens: handleMergeDesignTokens,
};
