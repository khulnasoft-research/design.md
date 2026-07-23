import type { DesignSystemState } from '../model/spec.js';
import type { LintResult, GradedTokenEdits } from './spec.js';
import type { LintRule, RuleDescriptor } from './rules/types.js';
export declare function runLinter(state: DesignSystemState, rules?: LintRule[] | RuleDescriptor[]): LintResult;
export declare function preEvaluate(state: DesignSystemState, rules?: LintRule[] | RuleDescriptor[]): GradedTokenEdits;
//# sourceMappingURL=runner.d.ts.map