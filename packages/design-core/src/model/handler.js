import { SCHEMA_KEYS } from '../parser/spec.js';
import { isValidColor, isParseableDimension, isTokenReference, parseDimensionParts, } from './spec.js';
import { parseCssColor } from './color-parser.js';
import { MAX_REFERENCE_DEPTH, MAX_TOKEN_NESTING_DEPTH } from '../spec-config.js';
const SCHEMA_KEY_SET = new Set(SCHEMA_KEYS);
export class ModelHandler {
    execute(input) {
        try {
            const findings = [];
            const symbolTable = new Map();
            const colors = new Map();
            const typography = new Map();
            const rounded = new Map();
            const spacing = new Map();
            if (input.colors) {
                forEachLeaf(input.colors, (name, raw) => {
                    if (typeof raw === 'string' && isTokenReference(raw)) {
                        symbolTable.set(`colors.${name}`, raw);
                    }
                    else if (isValidColor(raw)) {
                        const resolved = parseColor(raw);
                        colors.set(name, resolved);
                        symbolTable.set(`colors.${name}`, resolved);
                    }
                    else {
                        findings.push({
                            severity: 'error',
                            path: `colors.${name}`,
                            message: `'${raw}' is not a valid color. Expected a CSS color value (e.g., #ffffff, rgb(0 0 0), oklch(0.5 0.2 240)).`,
                        });
                        symbolTable.set(`colors.${name}`, raw);
                    }
                }, '', 0, findings, 'colors');
            }
            if (input.typography) {
                for (const [name, props] of Object.entries(input.typography)) {
                    const resolved = parseTypography(props, `typography.${name}`, findings);
                    typography.set(name, resolved);
                    symbolTable.set(`typography.${name}`, resolved);
                }
            }
            if (input.rounded) {
                forEachLeaf(input.rounded, (name, raw) => {
                    if (typeof raw === 'string') {
                        if (isParseableDimension(raw)) {
                            const resolved = parseDimension(raw);
                            if (resolved.unit !== 'px' && resolved.unit !== 'rem' && resolved.unit !== 'em') {
                                findings.push({
                                    severity: 'error',
                                    path: `rounded.${name}`,
                                    message: `'${raw}' has an invalid unit '${resolved.unit}'. Only px, rem, and em are allowed.`,
                                });
                            }
                            rounded.set(name, resolved);
                            symbolTable.set(`rounded.${name}`, resolved);
                        }
                        else if (!isTokenReference(raw)) {
                            findings.push({
                                severity: 'error',
                                path: `rounded.${name}`,
                                message: `'${raw}' is not a valid dimension.`,
                            });
                            symbolTable.set(`rounded.${name}`, raw);
                        }
                        else {
                            symbolTable.set(`rounded.${name}`, raw);
                        }
                    }
                }, '', 0, findings, 'rounded');
            }
            if (input.spacing) {
                forEachLeaf(input.spacing, (name, raw) => {
                    if (isParseableDimension(raw)) {
                        const resolved = parseDimension(raw);
                        spacing.set(name, resolved);
                        symbolTable.set(`spacing.${name}`, resolved);
                    }
                    else {
                        symbolTable.set(`spacing.${name}`, raw);
                    }
                }, '', 0, findings, 'spacing');
            }
            if (input.colors) {
                forEachLeaf(input.colors, (name, raw) => {
                    if (typeof raw === 'string' && isTokenReference(raw)) {
                        const resolved = resolveReference(symbolTable, raw.slice(1, -1), new Set());
                        if (resolved !== null &&
                            typeof resolved === 'object' &&
                            'type' in resolved &&
                            resolved.type === 'color') {
                            colors.set(name, resolved);
                            symbolTable.set(`colors.${name}`, resolved);
                        }
                    }
                });
            }
            if (input.rounded) {
                forEachLeaf(input.rounded, (name, raw) => {
                    if (typeof raw === 'string' && isTokenReference(raw)) {
                        const resolved = resolveReference(symbolTable, raw.slice(1, -1), new Set());
                        if (resolved !== null &&
                            typeof resolved === 'object' &&
                            'type' in resolved &&
                            resolved.type === 'dimension') {
                            rounded.set(name, resolved);
                            symbolTable.set(`rounded.${name}`, resolved);
                        }
                    }
                });
            }
            if (input.spacing) {
                forEachLeaf(input.spacing, (name, raw) => {
                    if (typeof raw === 'string' && isTokenReference(raw)) {
                        const resolved = resolveReference(symbolTable, raw.slice(1, -1), new Set());
                        if (resolved !== null &&
                            typeof resolved === 'object' &&
                            'type' in resolved &&
                            resolved.type === 'dimension') {
                            spacing.set(name, resolved);
                            symbolTable.set(`spacing.${name}`, resolved);
                        }
                    }
                });
            }
            const components = new Map();
            if (input.components) {
                for (const [compName, props] of Object.entries(input.components)) {
                    const properties = new Map();
                    const unresolvedRefs = [];
                    for (const [propName, rawValue] of Object.entries(props)) {
                        if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
                            properties.set(propName, rawValue);
                        }
                        else if (isTokenReference(rawValue)) {
                            const refPath = rawValue.slice(1, -1);
                            const resolved = resolveReference(symbolTable, refPath, new Set());
                            if (resolved !== null) {
                                properties.set(propName, resolved);
                            }
                            else {
                                unresolvedRefs.push(rawValue);
                                properties.set(propName, rawValue);
                            }
                        }
                        else if (isValidColor(rawValue)) {
                            properties.set(propName, parseColor(rawValue));
                        }
                        else if (isParseableDimension(rawValue)) {
                            properties.set(propName, parseDimension(rawValue));
                        }
                        else {
                            properties.set(propName, rawValue);
                        }
                    }
                    components.set(compName, { properties, unresolvedRefs });
                }
            }
            const unknownKeys = [...input.sourceMap.keys()].filter((key) => !SCHEMA_KEY_SET.has(key));
            const unknownKeyValues = {};
            if (input.rawValues) {
                for (const key of unknownKeys) {
                    if (Object.prototype.hasOwnProperty.call(input.rawValues, key)) {
                        unknownKeyValues[key] = input.rawValues[key];
                    }
                }
            }
            return {
                designSystem: {
                    name: input.name,
                    description: input.description,
                    colors,
                    typography,
                    rounded,
                    spacing,
                    components,
                    symbolTable,
                    sections: input.sections,
                    unknownKeys,
                    unknownKeyValues,
                },
                findings,
            };
        }
        catch (error) {
            return {
                designSystem: {
                    colors: new Map(),
                    typography: new Map(),
                    rounded: new Map(),
                    spacing: new Map(),
                    components: new Map(),
                    symbolTable: new Map(),
                },
                findings: [
                    {
                        severity: 'error',
                        message: `Unexpected error during model building: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
}
export function parseColor(raw) {
    const parsed = parseCssColor(raw);
    if (!parsed) {
        throw new Error(`Invalid color: ${raw}`);
    }
    return {
        type: 'color',
        ...parsed,
    };
}
function parseDimension(raw) {
    const parts = parseDimensionParts(raw);
    if (!parts) {
        throw new Error(`Invalid dimension: ${raw}`);
    }
    return {
        type: 'dimension',
        value: parts.value,
        unit: parts.unit,
    };
}
function parseTypography(props, path, findings) {
    const result = { type: 'typography' };
    if (typeof props['fontFamily'] === 'string') {
        const ff = props['fontFamily'];
        if (isValidColor(ff)) {
            findings.push({
                severity: 'error',
                path: `${path}.fontFamily`,
                message: `'${ff}' appears to be a color, not a valid font family.`,
            });
        }
        result.fontFamily = ff;
    }
    if (props['fontWeight'] !== undefined) {
        const fw = props['fontWeight'];
        let fwValue;
        if (typeof fw === 'number') {
            fwValue = fw;
        }
        else if (typeof fw === 'string') {
            const parsed = Number(fw);
            if (!isNaN(parsed)) {
                fwValue = parsed;
            }
        }
        if (fwValue === undefined) {
            findings.push({
                severity: 'error',
                path: `${path}.fontWeight`,
                message: `'${fw}' is not a valid font weight. Expected a number.`,
            });
        }
        else {
            result.fontWeight = fwValue;
        }
    }
    if (typeof props['fontFeature'] === 'string')
        result.fontFeature = props['fontFeature'];
    if (typeof props['fontVariation'] === 'string')
        result.fontVariation = props['fontVariation'];
    const dimensionProps = ['fontSize', 'lineHeight', 'letterSpacing'];
    for (const prop of dimensionProps) {
        const raw = props[prop];
        if (typeof raw === 'string') {
            if (isParseableDimension(raw)) {
                const parsed = parseDimension(raw);
                if (parsed.unit !== 'px' && parsed.unit !== 'rem' && parsed.unit !== 'em') {
                    findings.push({
                        severity: 'error',
                        path: `${path}.${prop}`,
                        message: `'${raw}' has an invalid unit '${parsed.unit}'. Only px, rem, and em are allowed.`,
                    });
                }
                result[prop] = parsed;
            }
            else if (prop === 'lineHeight' && /^\d*\.?\d+$/.test(raw)) {
                result[prop] = {
                    type: 'dimension',
                    value: parseFloat(raw),
                    unit: '',
                };
            }
            else if (!isTokenReference(raw)) {
                findings.push({
                    severity: 'error',
                    path: `${path}.${prop}`,
                    message: `'${raw}' is not a valid dimension.`,
                });
            }
        }
    }
    return result;
}
function resolveReference(symbolTable, path, visited, depth = 0) {
    if (depth > MAX_REFERENCE_DEPTH)
        return null;
    if (visited.has(path))
        return null;
    visited.add(path);
    const value = symbolTable.get(path);
    if (value === undefined)
        return null;
    if (typeof value === 'string' && isTokenReference(value)) {
        const innerPath = value.slice(1, -1);
        return resolveReference(symbolTable, innerPath, visited, depth + 1);
    }
    return value;
}
export function contrastRatio(a, b) {
    const L1 = Math.max(a.luminance, b.luminance);
    const L2 = Math.min(a.luminance, b.luminance);
    return (L1 + 0.05) / (L2 + 0.05);
}
function forEachLeaf(obj, fn, prefix = '', depth = 0, findings, rootPath) {
    if (depth > MAX_TOKEN_NESTING_DEPTH) {
        if (findings && rootPath) {
            if (!findings.some((f) => f.path === rootPath && f.message.includes('nesting depth'))) {
                findings.push({
                    severity: 'error',
                    path: rootPath,
                    message: `Token nesting depth exceeds maximum allowed depth of ${MAX_TOKEN_NESTING_DEPTH}.`,
                });
            }
        }
        return;
    }
    for (const [key, value] of Object.entries(obj)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            forEachLeaf(value, fn, fullPath, depth + 1, findings, rootPath);
        }
        else {
            fn(fullPath, value);
        }
    }
}
//# sourceMappingURL=handler.js.map