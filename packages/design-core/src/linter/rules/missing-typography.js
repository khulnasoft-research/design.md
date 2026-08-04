export function missingTypography(state) {
    if (state.typography.size === 0 && state.colors.size > 0) {
        return [
            {
                path: 'typography',
                message: "No typography tokens defined. Agents will use default font choices, reducing your control over the design system's typographic identity.",
            },
        ];
    }
    return [];
}
export const missingTypographyRule = {
    name: 'missing-typography',
    severity: 'warning',
    description: 'Missing typography — warns when colors are defined but no typography tokens exist.',
    run: missingTypography,
};
//# sourceMappingURL=missing-typography.js.map