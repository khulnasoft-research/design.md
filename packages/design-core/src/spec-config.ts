import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { z } from 'zod';

const PropertyDefSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
});

const ConfigSchema = z.object({
  version: z.string(),
  limits: z
    .object({
      max_token_nesting_depth: z.number().default(20),
      max_reference_depth: z.number().default(10),
    })
    .default({}),
  units: z.array(z.string()).min(1),
  sections: z
    .array(
      z.object({
        canonical: z.string(),
        aliases: z.array(z.string()).optional(),
      })
    )
    .min(1),
  typography_properties: z.array(PropertyDefSchema).min(1),
  component_sub_tokens: z.array(PropertyDefSchema).min(1),
  color_roles: z.array(z.string()).min(1),
  recommended_tokens: z.record(z.string(), z.array(z.string())),
  examples: z.object({
    colors: z.record(z.string(), z.string()),
    typography: z.record(z.string(), z.record(z.string(), z.union([z.string(), z.number()]))),
    components: z.record(z.string(), z.record(z.string(), z.string())),
  }),
});

export function loadSpecConfig(filePath?: string) {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const yamlPath = filePath ? resolve(filePath) : resolve(currentDir, './spec-config.yaml');
  const raw = parse(readFileSync(yamlPath, 'utf-8'));
  return ConfigSchema.parse(raw);
}

type ParsedConfig = ReturnType<typeof loadSpecConfig>;
let _cachedConfig: ParsedConfig | undefined;

export function getSpecConfig(): ParsedConfig {
  if (!_cachedConfig) {
    _cachedConfig = loadSpecConfig();
  }
  return _cachedConfig;
}

export interface SectionDef {
  canonical: string;
  aliases?: readonly string[] | undefined;
}

export interface TypographyPropertyDef {
  name: string;
  type: string;
  description?: string | undefined;
}

export interface ComponentSubTokenDef {
  name: string;
  type: string;
  description?: string | undefined;
}

const config = getSpecConfig();

export const SPEC_VERSION = config.version;
export const MAX_TOKEN_NESTING_DEPTH = config.limits.max_token_nesting_depth;
export const MAX_REFERENCE_DEPTH = config.limits.max_reference_depth;
export const STANDARD_UNITS = config.units;
export type StandardUnit = (typeof STANDARD_UNITS)[number];

export const SECTIONS = config.sections;
export const TYPOGRAPHY_PROPERTIES: readonly TypographyPropertyDef[] = config.typography_properties;
export const COMPONENT_SUB_TOKENS: readonly ComponentSubTokenDef[] = config.component_sub_tokens;
export const CORE_COLOR_ROLES = config.color_roles;
export const RECOMMENDED_TOKENS = config.recommended_tokens;
export const EXAMPLES = config.examples;

export const CANONICAL_ORDER = SECTIONS.map((s) => s.canonical);

export const SECTION_ALIASES: Record<string, string> = Object.fromEntries(
  SECTIONS.flatMap((s) => (s.aliases ?? []).map((alias) => [alias, s.canonical]))
);

export function resolveAlias(heading: string): string {
  return SECTION_ALIASES[heading] ?? heading;
}

export const VALID_TYPOGRAPHY_PROPS = TYPOGRAPHY_PROPERTIES.map((p) => p.name);
export const VALID_COMPONENT_SUB_TOKENS = COMPONENT_SUB_TOKENS.map((p) => p.name);

export interface SpecConfig {
  SPEC_VERSION: typeof SPEC_VERSION;
  MAX_TOKEN_NESTING_DEPTH: typeof MAX_TOKEN_NESTING_DEPTH;
  MAX_REFERENCE_DEPTH: typeof MAX_REFERENCE_DEPTH;
  STANDARD_UNITS: typeof STANDARD_UNITS;
  SECTIONS: typeof SECTIONS;
  TYPOGRAPHY_PROPERTIES: typeof TYPOGRAPHY_PROPERTIES;
  COMPONENT_SUB_TOKENS: typeof COMPONENT_SUB_TOKENS;
  CORE_COLOR_ROLES: typeof CORE_COLOR_ROLES;
  RECOMMENDED_TOKENS: typeof RECOMMENDED_TOKENS;
  EXAMPLES: typeof EXAMPLES;
}

export const SPEC_CONFIG: SpecConfig = {
  SPEC_VERSION,
  MAX_TOKEN_NESTING_DEPTH,
  MAX_REFERENCE_DEPTH,
  STANDARD_UNITS,
  SECTIONS,
  TYPOGRAPHY_PROPERTIES,
  COMPONENT_SUB_TOKENS,
  CORE_COLOR_ROLES,
  RECOMMENDED_TOKENS,
  EXAMPLES,
};
