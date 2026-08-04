export interface DesignToken {
  name: string;
  value: string | number | boolean;
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface ColorToken extends DesignToken {
  value: string;
  contrast?: number;
}

export interface TypographyToken extends DesignToken {
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontFamily?: string;
}

export interface SpacingToken extends DesignToken {
  value: number;
  unit?: 'px' | 'rem' | 'em';
}

export interface DesignSystem {
  name?: string;
  version?: string;
  colors: Record<string, ColorToken>;
  typography: Record<string, TypographyToken>;
  spacing: Record<string, SpacingToken>;
  rounded?: Record<string, unknown>;
  components?: Record<string, ComponentDef>;
}

export interface ComponentDef {
  name: string;
  tokens: Record<string, string>;
  states?: Record<string, Record<string, string>>;
  description?: string;
}

export interface LintFinding {
  level: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  line?: number;
  column?: number;
  path?: string;
}

export interface LintReport {
  findings: LintFinding[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  designSystem?: DesignSystem;
}

export interface TokenDiff {
  added: string[];
  removed: string[];
  changed: string[];
  unchanged: string[];
}

export interface DesignDiffReport {
  colors: TokenDiff;
  typography: TokenDiff;
  spacing: TokenDiff;
  components: TokenDiff;
  regressions: LintFinding[];
}

export interface ExportOptions {
  format: 'tailwind-v3' | 'tailwind-v4' | 'dtcg' | 'json';
  includeMetadata?: boolean;
  minify?: boolean;
}

export interface ExportResult {
  format: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface MergeDiffOptions {
  strategy?: 'override' | 'combine' | 'interactive';
  conflictHandler?: (key: string, values: unknown[]) => unknown;
}

export interface MergeResult {
  merged: DesignSystem;
  conflicts?: Array<{
    key: string;
    values: unknown[];
  }>;
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Enterprise Workflow Types (Phase 1+)
export type {
  PromptRequest,
  PromptAcknowledgment,
  DesignSystemDraft,
  ValidationReport,
  IterationFeedback,
  IterationResult,
  IterationRecord,
  ApprovalRequest,
  ApprovalConfirmation,
  ApprovalRecord,
  PublishedDesignSystem,
  ExportRequest,
  WorkflowExportResult,
  WorkflowStep,
  WorkflowState,
  WorkflowError,
} from './enterprise-workflow.js';
