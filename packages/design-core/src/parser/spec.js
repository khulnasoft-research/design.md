import { z } from 'zod';
export const ParserInputSchema = z.object({
    content: z.string().min(1, 'Content must not be empty'),
});
export const ParserErrorCode = z.enum([
    'EMPTY_CONTENT',
    'NO_YAML_FOUND',
    'YAML_PARSE_ERROR',
    'DUPLICATE_SECTION',
    'UNKNOWN_ERROR',
]);
export const SCHEMA_KEYS = [
    'version',
    'name',
    'description',
    'colors',
    'typography',
    'rounded',
    'spacing',
    'components',
];
//# sourceMappingURL=spec.js.map