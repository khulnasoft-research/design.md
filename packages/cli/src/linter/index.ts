export { lint } from './lint.js';
export type { LintReport, LintOptions } from './lint.js';

export type {
  DesignSystemState,
  ResolvedColor,
  ResolvedDimension,
  ResolvedTypography,
  ResolvedValue,
  ComponentDef,
} from '@scalify/design-core';
export type { Finding, Severity } from '@scalify/design-core';
export type { TailwindEmitterResult, TailwindThemeExtend } from './tailwind/spec.js';
export type { TailwindV4EmitterResult, TailwindV4ThemeData } from './tailwind/v4/spec.js';
export type { DtcgEmitterResult, DtcgTokenFile } from './dtcg/spec.js';

export { runLinter, preEvaluate } from '@scalify/design-core';
export { DEFAULT_RULES } from '@scalify/design-core';
export type { LintRule } from '@scalify/design-core';
export type { GradedTokenEdits, TokenEditEntry } from '@scalify/design-core';
export {
  brokenRef,
  missingPrimary,
  contrastCheck,
  orphanedTokens,
  tokenSummary,
  missingSections,
  missingTypography,
  unknownKey,
  tokenLikeIgnored,
} from '@scalify/design-core';
export { contrastRatio } from '@scalify/design-core';
export { TailwindEmitterHandler } from './tailwind/handler.js';
export { TailwindV4EmitterHandler } from './tailwind/v4/handler.js';
export { serializeToCss as serializeTailwindV4 } from './tailwind/v4/serialize.js';
export { DtcgEmitterHandler } from './dtcg/handler.js';
export { fixSectionOrder } from '@scalify/design-core';
export type { FixerInput, FixerResult } from '@scalify/design-core';
