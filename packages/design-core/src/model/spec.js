import { z } from 'zod';
import { STANDARD_UNITS as _STANDARD_UNITS, VALID_TYPOGRAPHY_PROPS as _VALID_TYPOGRAPHY_PROPS, VALID_COMPONENT_SUB_TOKENS as _VALID_COMPONENT_SUB_TOKENS, } from '../spec-config.js';
import { parseCssColor } from './color-parser.js';
export const SeveritySchema = z.enum(['error', 'warning', 'info']);
export const VALID_TYPOGRAPHY_PROPS = _VALID_TYPOGRAPHY_PROPS;
export const VALID_COMPONENT_SUB_TOKENS = _VALID_COMPONENT_SUB_TOKENS;
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
const STANDARD_UNITS = new Set(_STANDARD_UNITS);
const CSS_UNITS = new Set([
    'px', 'cm', 'mm', 'in', 'pt', 'pc',
    'em', 'rem', 'ex', 'ch', 'cap', 'ic', 'lh', 'rlh',
    'vh', 'vw', 'vmin', 'vmax',
    'dvh', 'dvw', 'dvmin', 'dvmax', 'svh', 'svw', 'svmin', 'svmax', 'lvh', 'lvw', 'lvmin', 'lvmax',
    'cqw', 'cqh', 'cqi', 'cqb', 'cqmin', 'cqmax',
    '%',
]);
export function parseDimensionParts(raw) {
    if (typeof raw !== 'string')
        return null;
    const match = raw.match(/^(-?\d*\.?\d+)([a-zA-Z%]+)$/);
    if (!match)
        return null;
    const value = parseFloat(match[1]);
    return Number.isNaN(value) ? null : { value, unit: match[2] };
}
export function isValidColor(raw) {
    return parseCssColor(raw) !== null;
}
export function isStandardDimension(raw) {
    const parts = parseDimensionParts(raw);
    return parts !== null && STANDARD_UNITS.has(parts.unit);
}
export function isParseableDimension(raw) {
    const parts = parseDimensionParts(raw);
    return parts !== null && CSS_UNITS.has(parts.unit);
}
export const isValidDimension = isStandardDimension;
export function isTokenReference(raw) {
    return /^\{[a-zA-Z0-9._-]+\}$/.test(raw);
}
//# sourceMappingURL=spec.js.map