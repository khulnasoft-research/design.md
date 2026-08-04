import { SCHEMA_KEYS } from '../../parser/spec.js';
import { levenshtein } from '../../levenshtein.js';
const MAX_TYPO_DISTANCE = 2;
export function unknownKey(state) {
    const knownSet = new Set(SCHEMA_KEYS);
    return (state.unknownKeys ?? []).flatMap((key) => {
        if (knownSet.has(key))
            return [];
        let bestMatch;
        let bestDist = Infinity;
        for (const known of SCHEMA_KEYS) {
            const dist = levenshtein(key.toLowerCase(), known.toLowerCase());
            if (dist < bestDist) {
                bestDist = dist;
                bestMatch = known;
            }
        }
        if (bestDist <= MAX_TYPO_DISTANCE && bestMatch) {
            return [
                {
                    path: key,
                    message: `Unknown key "${key}" — did you mean "${bestMatch}"?`,
                },
            ];
        }
        return [];
    });
}
export const unknownKeyRule = {
    name: 'unknown-key',
    severity: 'warning',
    description: 'Unknown key — warns when a top-level YAML key looks like a typo of a known schema key.',
    run: unknownKey,
};
//# sourceMappingURL=unknown-key.js.map