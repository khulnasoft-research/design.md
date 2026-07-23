import { z } from 'zod';

export const ParserInputSchema = z.object({
  content: z.string().min(1, 'Content must not be empty'),
});
export type ParserInput = z.infer<typeof ParserInputSchema>;

export const ParserErrorCode = z.enum([
  'EMPTY_CONTENT',
  'NO_YAML_FOUND',
  'YAML_PARSE_ERROR',
  'DUPLICATE_SECTION',
  'UNKNOWN_ERROR',
]);

export interface SourceLocation {
  line: number;
  column: number;
  block: 'frontmatter' | number;
}

export interface ParsedDesignSystem {
  version?: string | undefined;
  name?: string | undefined;
  description?: string | undefined;
  colors?: Record<string, any> | undefined;
  typography?: Record<string, Record<string, any>> | undefined;
  rounded?: Record<string, any> | undefined;
  spacing?: Record<string, any> | undefined;
  components?: Record<string, Record<string, any>> | undefined;
  sourceMap: Map<string, SourceLocation>;
  sections?: string[] | undefined;
  documentSections?: Array<{ heading: string; content: string }> | undefined;
  rawValues?: Record<string, unknown> | undefined;
}

export const SCHEMA_KEYS = [
  'version',
  'name',
  'description',
  'colors',
  'typography',
  'rounded',
  'spacing',
  'components',
] as const;

export type SchemaKey = (typeof SCHEMA_KEYS)[number];

export type ParserResult =
  | { success: true; data: ParsedDesignSystem }
  | {
      success: false;
      error: {
        code: z.infer<typeof ParserErrorCode>;
        message: string;
        recoverable: boolean;
      };
    };

export interface ParserSpec {
  execute(input: ParserInput): ParserResult;
}
