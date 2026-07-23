import type { DesignSystemState } from '../../model/spec.js';
import type { RuleDescriptor, RuleFinding } from './types.js';

function colorFamily(name: string): string {
  let n = name;
  n = n.replace(/^on-/, '');
  n = n.replace(/^inverse-/, '');
  n = n.replace(/^on-/, '');
  n = n.replace(/-container.*$/, '');
  n = n.replace(/-fixed.*$/, '');
  n = n.replace(/-(dim|bright|tint|variant)$/, '');
  return n;
}

const MD3_STANDARD_FAMILIES = new Set([
  'primary',
  'secondary',
  'tertiary',
  'error',
  'surface',
  'background',
  'outline',
]);

export function orphanedTokens(state: DesignSystemState): RuleFinding[] {
  if (state.components.size === 0) return [];

  const referencedPaths = new Set<string>();
  for (const [, comp] of state.components) {
    for (const [, value] of comp.properties) {
      if (typeof value === 'object' && value !== null && 'type' in value) {
        for (const [key, symValue] of state.symbolTable) {
          if (symValue === value) {
            referencedPaths.add(key);
          }
        }
      }
    }
  }

  const referencedFamilies = new Set<string>();
  for (const path of referencedPaths) {
    if (path.startsWith('colors.')) {
      referencedFamilies.add(colorFamily(path.slice('colors.'.length)));
    }
  }

  const findings: RuleFinding[] = [];
  for (const [name] of state.colors) {
    const path = `colors.${name}`;
    if (referencedPaths.has(path)) continue;
    const family = colorFamily(name);
    if (referencedFamilies.has(family)) continue;
    if (MD3_STANDARD_FAMILIES.has(family)) continue;
    findings.push({
      path,
      message: `'${name}' is defined but never referenced by any component.`,
    });
  }
  return findings;
}

export const orphanedTokensRule: RuleDescriptor = {
  name: 'orphaned-tokens',
  severity: 'warning',
  description: 'Orphaned tokens — tokens defined but never referenced by any component.',
  run: orphanedTokens,
};
