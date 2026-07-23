export declare function loadSpecConfig(filePath?: string): {
  version: string;
  limits: {
    max_token_nesting_depth: number;
    max_reference_depth: number;
  };
  units: string[];
  sections: {
    canonical: string;
    aliases?: string[] | undefined;
  }[];
  typography_properties: {
    type: string;
    name: string;
    description?: string | undefined;
  }[];
  component_sub_tokens: {
    type: string;
    name: string;
    description?: string | undefined;
  }[];
  color_roles: string[];
  recommended_tokens: Record<string, string[]>;
  examples: {
    colors: Record<string, string>;
    typography: Record<string, Record<string, string | number>>;
    components: Record<string, Record<string, string>>;
  };
};
type ParsedConfig = ReturnType<typeof loadSpecConfig>;
export declare function getSpecConfig(): ParsedConfig;
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
export declare const SPEC_VERSION: string;
export declare const MAX_TOKEN_NESTING_DEPTH: number;
export declare const MAX_REFERENCE_DEPTH: number;
export declare const STANDARD_UNITS: string[];
export type StandardUnit = (typeof STANDARD_UNITS)[number];
export declare const SECTIONS: {
  canonical: string;
  aliases?: string[] | undefined;
}[];
export declare const TYPOGRAPHY_PROPERTIES: readonly TypographyPropertyDef[];
export declare const COMPONENT_SUB_TOKENS: readonly ComponentSubTokenDef[];
export declare const CORE_COLOR_ROLES: string[];
export declare const RECOMMENDED_TOKENS: Record<string, string[]>;
export declare const EXAMPLES: {
  colors: Record<string, string>;
  typography: Record<string, Record<string, string | number>>;
  components: Record<string, Record<string, string>>;
};
export declare const CANONICAL_ORDER: string[];
export declare const SECTION_ALIASES: Record<string, string>;
export declare function resolveAlias(heading: string): string;
export declare const VALID_TYPOGRAPHY_PROPS: string[];
export declare const VALID_COMPONENT_SUB_TOKENS: string[];
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
export declare const SPEC_CONFIG: SpecConfig;
export {};
//# sourceMappingURL=spec-config.d.ts.map
