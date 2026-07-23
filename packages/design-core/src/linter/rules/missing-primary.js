export function missingPrimary(state) {
    if (state.colors.size > 0 && !state.colors.has('primary')) {
        return [
            {
                path: 'colors',
                message: "No 'primary' color defined. The agent will auto-generate key colors, reducing your control over the palette.",
            },
        ];
    }
    return [];
}
export const missingPrimaryRule = {
    name: 'missing-primary',
    severity: 'warning',
    description: "Missing primary color — warns when colors are defined but no 'primary' exists.",
    run: missingPrimary,
};
//# sourceMappingURL=missing-primary.js.map