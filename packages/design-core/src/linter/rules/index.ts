import type { LintRule, RuleDescriptor } from './types.js';
import type { DesignSystemState } from '../../model/spec.js';
import type { Finding } from '../spec.js';
import { brokenRefRule } from './broken-ref.js';
import { missingPrimaryRule } from './missing-primary.js';
import { contrastCheckRule } from './contrast-ratio.js';
import { orphanedTokensRule } from './orphaned-tokens.js';
import { tokenSummaryRule } from './token-summary.js';
import { missingSectionsRule } from './missing-sections.js';
import { sectionOrderRule } from './section-order.js';
import { missingTypographyRule } from './missing-typography.js';
import { unknownKeyRule } from './unknown-key.js';
import { tokenLikeIgnoredRule } from './token-like-ignored.js';

export const DEFAULT_RULE_DESCRIPTORS: RuleDescriptor[] = [
  brokenRefRule,
  missingPrimaryRule,
  contrastCheckRule,
  orphanedTokensRule,
  tokenSummaryRule,
  missingSectionsRule,
  missingTypographyRule,
  sectionOrderRule,
  unknownKeyRule,
  tokenLikeIgnoredRule,
];

function toLintRule(descriptor: RuleDescriptor): LintRule {
  return (state: DesignSystemState): Finding[] =>
    descriptor.run(state).map((finding) => ({
      severity: finding.severity ?? descriptor.severity,
      path: finding.path,
      message: finding.message,
    }));
}

export const DEFAULT_RULES: LintRule[] = DEFAULT_RULE_DESCRIPTORS.map(toLintRule);

export { brokenRef } from './broken-ref.js';
export { missingPrimary } from './missing-primary.js';
export { contrastCheck } from './contrast-ratio.js';
export { orphanedTokens } from './orphaned-tokens.js';
export { tokenSummary } from './token-summary.js';
export { missingSections } from './missing-sections.js';
export { missingTypography } from './missing-typography.js';
export { unknownKey } from './unknown-key.js';
export { sectionOrder } from './section-order.js';
export { tokenLikeIgnored } from './token-like-ignored.js';
export type { LintRule } from './types.js';
