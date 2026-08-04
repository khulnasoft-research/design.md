import { contrastRatio } from '../../model/handler.js';
const WCAG_AA_MINIMUM = 4.5;
export function contrastCheck(state) {
    const findings = [];
    for (const [compName, comp] of state.components) {
        const bgValue = comp.properties.get('backgroundColor');
        const textValue = comp.properties.get('textColor');
        if (!bgValue || !textValue)
            continue;
        const bgColor = resolveToColor(bgValue);
        const textColor = resolveToColor(textValue);
        if (!bgColor || !textColor)
            continue;
        const ratio = contrastRatio(bgColor, textColor);
        if (ratio < WCAG_AA_MINIMUM) {
            findings.push({
                path: `components.${compName}`,
                message: `textColor (${textColor.hex}) on backgroundColor (${bgColor.hex}) has contrast ratio ${ratio.toFixed(2)}:1, below WCAG AA minimum of ${WCAG_AA_MINIMUM}:1.`,
            });
        }
    }
    return findings;
}
function resolveToColor(value) {
    if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'color') {
        return value;
    }
    return null;
}
export const contrastCheckRule = {
    name: 'contrast-ratio',
    severity: 'warning',
    description: 'WCAG contrast ratio — warns when component backgroundColor/textColor pairs fall below the AA minimum of 4.5:1.',
    run: contrastCheck,
};
//# sourceMappingURL=contrast-ratio.js.map