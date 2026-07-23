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
        .array(z.object({
        canonical: z.string(),
        aliases: z.array(z.string()).optional(),
    }))
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
export function loadSpecConfig(filePath) {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const yamlPath = filePath ? resolve(filePath) : resolve(currentDir, './spec-config.yaml');
    const raw = parse(readFileSync(yamlPath, 'utf-8'));
    return ConfigSchema.parse(raw);
}
let _cachedConfig;
export function getSpecConfig() {
    if (!_cachedConfig) {
        _cachedConfig = loadSpecConfig();
    }
    return _cachedConfig;
}
const config = getSpecConfig();
export const SPEC_VERSION = config.version;
export const MAX_TOKEN_NESTING_DEPTH = config.limits.max_token_nesting_depth;
export const MAX_REFERENCE_DEPTH = config.limits.max_reference_depth;
export const STANDARD_UNITS = config.units;
export const SECTIONS = config.sections;
export const TYPOGRAPHY_PROPERTIES = config.typography_properties;
export const COMPONENT_SUB_TOKENS = config.component_sub_tokens;
export const CORE_COLOR_ROLES = config.color_roles;
export const RECOMMENDED_TOKENS = config.recommended_tokens;
export const EXAMPLES = config.examples;
export const CANONICAL_ORDER = SECTIONS.map((s) => s.canonical);
export const SECTION_ALIASES = Object.fromEntries(SECTIONS.flatMap((s) => (s.aliases ?? []).map((alias) => [alias, s.canonical])));
export function resolveAlias(heading) {
    return SECTION_ALIASES[heading] ?? heading;
}
export const VALID_TYPOGRAPHY_PROPS = TYPOGRAPHY_PROPERTIES.map((p) => p.name);
export const VALID_COMPONENT_SUB_TOKENS = COMPONENT_SUB_TOKENS.map((p) => p.name);
export const SPEC_CONFIG = {
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
//# sourceMappingURL=spec-config.js.map