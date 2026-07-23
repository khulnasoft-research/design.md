import type { DesignSystemState } from '../model/spec.js';
import type { LintResult, Finding, GradedTokenEdits, TokenEditEntry } from './spec.js';
import type { LintRule, RuleDescriptor } from './rules/types.js';
import { DEFAULT_RULES, DEFAULT_RULE_DESCRIPTORS } from './rules/index.js';

function isDescriptorArray(rules: LintRule[] | RuleDescriptor[]): rules is RuleDescriptor[] {
  return rules.length > 0 && typeof rules[0] === 'object' && 'run' in rules[0];
}

export function runLinter(
  state: DesignSystemState,
  rules: LintRule[] | RuleDescriptor[] = DEFAULT_RULES
): LintResult {
  const findings: Finding[] = isDescriptorArray(rules)
    ? rules.flatMap((desc) =>
        desc.run(state).map((f) => ({
          severity: f.severity ?? desc.severity,
          path: f.path,
          message: f.message,
        }))
      )
    : rules.flatMap((rule) => rule(state));
  return {
    findings,
    summary: {
      errors: findings.filter((d) => d.severity === 'error').length,
      warnings: findings.filter((d) => d.severity === 'warning').length,
      infos: findings.filter((d) => d.severity === 'info').length,
    },
  };
}

export function preEvaluate(
  state: DesignSystemState,
  rules: LintRule[] | RuleDescriptor[] = DEFAULT_RULES
): GradedTokenEdits {
  const { findings } = runLinter(state, rules);
  const fixes: TokenEditEntry[] = [];
  const improvements: TokenEditEntry[] = [];
  const suggestions: TokenEditEntry[] = [];

  for (const d of findings) {
    const entry: TokenEditEntry = { path: d.path ?? '', findings: [d] };
    if (d.severity === 'error') fixes.push(entry);
    else if (d.severity === 'warning') improvements.push(entry);
    else suggestions.push(entry);
  }

  return { fixes, improvements, suggestions };
}
