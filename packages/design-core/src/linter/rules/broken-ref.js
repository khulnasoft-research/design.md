import { VALID_COMPONENT_SUB_TOKENS } from '../../model/spec.js';
export function brokenRef(state) {
    const findings = [];
    for (const [compName, comp] of state.components) {
        for (const ref of comp.unresolvedRefs) {
            findings.push({
                path: `components.${compName}`,
                message: `Reference ${ref} does not resolve to any defined token.`,
            });
        }
        for (const [propName] of comp.properties) {
            if (!VALID_COMPONENT_SUB_TOKENS.includes(propName)) {
                findings.push({
                    severity: 'warning',
                    path: `components.${compName}.${propName}`,
                    message: `'${propName}' is not a recognized component sub-token. Valid sub-tokens: ${VALID_COMPONENT_SUB_TOKENS.join(', ')}.`,
                });
            }
        }
    }
    return findings;
}
export const brokenRefRule = {
    name: 'broken-ref',
    severity: 'error',
    description: 'Broken/circular references and unknown component sub-tokens.',
    run: brokenRef,
};
//# sourceMappingURL=broken-ref.js.map