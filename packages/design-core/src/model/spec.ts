import { z } from 'zod';
import type { ParsedDesignSystem } from '../parser/spec.js';
import {
  STANDARD_UNITS as _STANDARD_UNITS,
  VALID_TYPOGRAPHY_PROPS as _VALID_TYPOGRAPHY_PROPS,
  VALID_COMPONENT_SUB_TOKENS as _VALID_COMPONENT_SUB_TOKENS,
} from '../spec-config.js';
import { parseCssColor } from './color-parser.js';

export const SeveritySchema = z.enum(['error', 'warning', 'info']);
export type Severity = z.infer<typeof SeveritySchema>;

export interface Finding {
  severity: Severity;
  path?: string;
  message: string;
}

export interface ResolvedColor {
  type: 'color';
  hex: string;
  r: number;
  g: number;
  b: number;
  a?: number;
  luminance: number;
}

export interface ResolvedDimension {
  type: 'dimension';
  value: number;
  unit: string;
}

export interface ResolvedTypography {
  type: 'typography';
  fontFamily?: string | undefined;
  fontSize?: ResolvedDimension | undefined;
  fontWeight?: number | undefined;
  lineHeight?: ResolvedDimension | undefined;
  letterSpacing?: ResolvedDimension | undefined;
  fontFeature?: string | undefined;
  fontVariation?: string | undefined;
}

export type ResolvedValue =
  ResolvedColor | ResolvedDimension | ResolvedTypography | string | number | boolean;

export const VALID_TYPOGRAPHY_PROPS = _VALID_TYPOGRAPHY_PROPS;
export const VALID_COMPONENT_SUB_TOKENS = _VALID_COMPONENT_SUB_TOKENS;

export interface DesignSystemState {
  name?: string | undefined;
  description?: string | undefined;
  colors: Map<string, ResolvedColor>;
  typography: Map<string, ResolvedTypography>;
  rounded: Map<string, ResolvedDimension>;
  spacing: Map<string, ResolvedDimension>;
  components: Map<string, ComponentDef>;
  symbolTable: Map<string, ResolvedValue>;
  sections?: string[] | undefined;
  unknownKeys?: string[] | undefined;
  unknownKeyValues?: Record<string, unknown> | undefined;
}

export interface ComponentDef {
  properties: Map<string, ResolvedValue>;
  unresolvedRefs: string[];
}

export const ModelErrorCode = z.enum([
  'INVALID_COLOR',
  'INVALID_DIMENSION',
  'INVALID_TYPOGRAPHY_PROP',
  'UNRESOLVED_REFERENCE',
  'CIRCULAR_REFERENCE',
  'REFERENCE_TO_NON_PRIMITIVE',
  'NESTING_DEPTH_EXCEEDED',
  'UNKNOWN_ERROR',
]);

export interface ModelResult {
  designSystem: DesignSystemState;
  findings: Finding[];
}

export interface ModelSpec {
  execute(input: ParsedDesignSystem): ModelResult;
}

const STANDARD_UNITS: Set<string> = new Set(_STANDARD_UNITS);

const CSS_UNITS = new Set([
  'px',
  'cm',
  'mm',
  'in',
  'pt',
  'pc',
  'em',
  'rem',
  'ex',
  'ch',
  'cap',
  'ic',
  'lh',
  'rlh',
  'vh',
  'vw',
  'vmin',
  'vmax',
  'dvh',
  'dvw',
  'dvmin',
  'dvmax',
  'svh',
  'svw',
  'svmin',
  'svmax',
  'lvh',
  'lvw',
  'lvmin',
  'lvmax',
  'cqw',
  'cqh',
  'cqi',
  'cqb',
  'cqmin',
  'cqmax',
  '%',
]);

export function parseDimensionParts(raw: string): { value: number; unit: string } | null {
  if (typeof raw !== 'string') return null;
  const match = raw.match(/^(-?\d*\.?\d+)([a-zA-Z%]+)$/);
  if (!match) return null;
  const value = parseFloat(match[1]!);
  return Number.isNaN(value) ? null : { value, unit: match[2]! };
}

export function isValidColor(raw: string): boolean {
  return parseCssColor(raw) !== null;
}

export function isStandardDimension(raw: string): boolean {
  const parts = parseDimensionParts(raw);
  return parts !== null && STANDARD_UNITS.has(parts.unit);
}

export function isParseableDimension(raw: string): boolean {
  const parts = parseDimensionParts(raw);
  return parts !== null && CSS_UNITS.has(parts.unit);
}

export const isValidDimension = isStandardDimension;

export function isTokenReference(raw: string): boolean {
  return /^\{[a-zA-Z0-9._-]+\}$/.test(raw);
}
