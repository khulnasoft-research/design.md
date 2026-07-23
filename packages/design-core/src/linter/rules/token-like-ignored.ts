import type { DesignSystemState } from '../../model/spec.js';
import type { RuleDescriptor, RuleFinding } from './types.js';

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const CSS_DIMENSION_RE = /^-?\d*\.?\d+[a-zA-Z%]+$/;

const TYPOGRAPHY_PROPS = new Set([
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
]);

function isTokenLikeMap(value: unknown): boolean {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return hasTokenLikeContent(obj);
}

function hasTokenLikeContent(obj: Record<string, unknown>): boolean {
  for (const [key, val] of Object.entries(obj)) {
    if (TYPOGRAPHY_PROPS.has(key)) return true;

    if (typeof val === 'string') {
      if (HEX_COLOR_RE.test(val) || CSS_DIMENSION_RE.test(val)) return true;
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      if (hasTokenLikeContent(val as Record<string, unknown>)) return true;
    }
  }
  return false;
}

export function tokenLikeIgnored(state: DesignSystemState): RuleFinding[] {
  const unknownKeys = state.unknownKeys ?? [];
  const unknownKeyValues = state.unknownKeyValues ?? {};
  const findings: RuleFinding[] = [];

  for (const key of unknownKeys) {
    const value = unknownKeyValues[key];
    if (isTokenLikeMap(value)) {
      findings.push({
        path: key,
        message:
          `"${key}" looks like a design-token map but is not a recognized schema key ` +
          `(colors, typography, spacing, rounded, components). ` +
          `It will be silently ignored by export commands. ` +
          `Rename it to a supported key or move its values under a recognized section.`,
      });
    }
  }

  return findings;
}

export const tokenLikeIgnoredRule: RuleDescriptor = {
  name: 'token-like-ignored',
  severity: 'warning',
  description:
    'Warns when a top-level YAML key looks like a design-token map but is not ' +
    'part of the recognized export schema and will be silently ignored.',
  run: tokenLikeIgnored,
};
