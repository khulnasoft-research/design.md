import { SCHEMA_KEYS } from '../../parser/spec.js';
import type { DesignSystemState } from '../../model/spec.js';
import type { RuleDescriptor, RuleFinding } from './types.js';
import { levenshtein } from '../../levenshtein.js';

const MAX_TYPO_DISTANCE = 2;

export function unknownKey(state: DesignSystemState): RuleFinding[] {
  const knownSet = new Set<string>(SCHEMA_KEYS);
  return (state.unknownKeys ?? []).flatMap((key) => {
    if (knownSet.has(key)) return [];

    let bestMatch: string | undefined;
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

export const unknownKeyRule: RuleDescriptor = {
  name: 'unknown-key',
  severity: 'warning',
  description:
    'Unknown key — warns when a top-level YAML key looks like a typo of a known schema key.',
  run: unknownKey,
};
