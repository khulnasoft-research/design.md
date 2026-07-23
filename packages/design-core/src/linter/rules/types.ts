import type { DesignSystemState } from '../../model/spec.js';
import type { Finding, Severity } from '../spec.js';

export interface RuleFinding {
  path?: string;
  message: string;
  severity?: Severity;
}

export type LintRule = (state: DesignSystemState) => Finding[];

export interface RuleDescriptor {
  name: string;
  severity: Severity;
  description: string;
  run: (state: DesignSystemState) => RuleFinding[];
}
