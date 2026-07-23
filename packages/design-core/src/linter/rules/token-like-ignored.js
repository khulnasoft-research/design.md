const HEX_COLOR_RE = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const CSS_DIMENSION_RE = /^-?\d*\.?\d+[a-zA-Z%]+$/;
const TYPOGRAPHY_PROPS = new Set([
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
]);
function isTokenLikeMap(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const obj = value;
    return hasTokenLikeContent(obj);
}
function hasTokenLikeContent(obj) {
    for (const [key, val] of Object.entries(obj)) {
        if (TYPOGRAPHY_PROPS.has(key))
            return true;
        if (typeof val === 'string') {
            if (HEX_COLOR_RE.test(val) || CSS_DIMENSION_RE.test(val))
                return true;
        }
        else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
            if (hasTokenLikeContent(val))
                return true;
        }
    }
    return false;
}
export function tokenLikeIgnored(state) {
    const unknownKeys = state.unknownKeys ?? [];
    const unknownKeyValues = state.unknownKeyValues ?? {};
    const findings = [];
    for (const key of unknownKeys) {
        const value = unknownKeyValues[key];
        if (isTokenLikeMap(value)) {
            findings.push({
                path: key,
                message: `"${key}" looks like a design-token map but is not a recognized schema key ` +
                    `(colors, typography, spacing, rounded, components). ` +
                    `It will be silently ignored by export commands. ` +
                    `Rename it to a supported key or move its values under a recognized section.`,
            });
        }
    }
    return findings;
}
export const tokenLikeIgnoredRule = {
    name: 'token-like-ignored',
    severity: 'warning',
    description: 'Warns when a top-level YAML key looks like a design-token map but is not ' +
        'part of the recognized export schema and will be silently ignored.',
    run: tokenLikeIgnored,
};
//# sourceMappingURL=token-like-ignored.js.map