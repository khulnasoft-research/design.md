import type { DesignSystemState } from '../model/spec.js';
export type { Finding, Severity } from '../model/spec.js';
import type { Finding } from '../model/spec.js';
export interface LintResult {
  findings: Finding[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}
export interface GradedTokenEdits {
  fixes: TokenEditEntry[];
  improvements: TokenEditEntry[];
  suggestions: TokenEditEntry[];
}
export interface TokenEditEntry {
  path: string;
  currentValue?: string;
  suggestedValue?: string;
  findings: Finding[];
}
export interface LinterSpec {
  lint(state: DesignSystemState): LintResult;
  preEvaluate(state: DesignSystemState): GradedTokenEdits;
}
//# sourceMappingURL=spec.d.ts.map
