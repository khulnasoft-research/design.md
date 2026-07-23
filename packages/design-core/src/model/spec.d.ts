import { z } from 'zod';
import type { ParsedDesignSystem } from '../parser/spec.js';
export declare const SeveritySchema: z.ZodEnum<['error', 'warning', 'info']>;
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
export declare const VALID_TYPOGRAPHY_PROPS: string[];
export declare const VALID_COMPONENT_SUB_TOKENS: string[];
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
export declare const ModelErrorCode: z.ZodEnum<
  [
    'INVALID_COLOR',
    'INVALID_DIMENSION',
    'INVALID_TYPOGRAPHY_PROP',
    'UNRESOLVED_REFERENCE',
    'CIRCULAR_REFERENCE',
    'REFERENCE_TO_NON_PRIMITIVE',
    'NESTING_DEPTH_EXCEEDED',
    'UNKNOWN_ERROR',
  ]
>;
export interface ModelResult {
  designSystem: DesignSystemState;
  findings: Finding[];
}
export interface ModelSpec {
  execute(input: ParsedDesignSystem): ModelResult;
}
export declare function parseDimensionParts(raw: string): {
  value: number;
  unit: string;
} | null;
export declare function isValidColor(raw: string): boolean;
export declare function isStandardDimension(raw: string): boolean;
export declare function isParseableDimension(raw: string): boolean;
export declare const isValidDimension: typeof isStandardDimension;
export declare function isTokenReference(raw: string): boolean;
//# sourceMappingURL=spec.d.ts.map
