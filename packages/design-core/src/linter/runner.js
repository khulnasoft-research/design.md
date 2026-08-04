import { DEFAULT_RULES } from './rules/index.js';
function isDescriptorArray(rules) {
    return rules.length > 0 && typeof rules[0] === 'object' && 'run' in rules[0];
}
export function runLinter(state, rules = DEFAULT_RULES) {
    const findings = isDescriptorArray(rules)
        ? rules.flatMap((desc) => desc.run(state).map((f) => ({
            severity: f.severity ?? desc.severity,
            path: f.path,
            message: f.message,
        })))
        : rules.flatMap((rule) => rule(state));
    return {
        findings,
        summary: {
            errors: findings.filter((d) => d.severity === 'error').length,
            warnings: findings.filter((d) => d.severity === 'warning').length,
            infos: findings.filter((d) => d.severity === 'info').length,
        },
    };
}
export function preEvaluate(state, rules = DEFAULT_RULES) {
    const { findings } = runLinter(state, rules);
    const fixes = [];
    const improvements = [];
    const suggestions = [];
    for (const d of findings) {
        const entry = { path: d.path ?? '', findings: [d] };
        if (d.severity === 'error')
            fixes.push(entry);
        else if (d.severity === 'warning')
            improvements.push(entry);
        else
            suggestions.push(entry);
    }
    return { fixes, improvements, suggestions };
}
//# sourceMappingURL=runner.js.map