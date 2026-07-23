/**
 * Policy Engine
 *
 * Enforces organizational policies on design systems (e.g., color constraints,
 * naming conventions, component restrictions, etc.)
 */

import type { DesignSystemState } from '@scalify/design-core';

/**
 * Policy violation with details
 */
export interface PolicyViolation {
  /** Policy ID that was violated */
  policyId: string;
  /** Policy name */
  policyName: string;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** Violation message */
  message: string;
  /** Affected tokens or components */
  affectedItems?: string[];
}

/**
 * Policy enforcement result
 */
export interface PolicyEnforcementResult {
  /** Did the design system pass all policies? */
  compliant: boolean;
  /** List of violations */
  violations: PolicyViolation[];
  /** Summary statistics */
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

/**
 * Policy constraint definition
 */
export interface Policy {
  /** Unique policy identifier */
  id: string;
  /** Policy name */
  name: string;
  /** Policy description */
  description: string;
  /** Is this policy enabled? */
  enabled: boolean;
  /** Severity if violated */
  severity: 'error' | 'warning' | 'info';
  /** Policy type */
  type: 'color' | 'typography' | 'spacing' | 'component' | 'naming' | 'custom';
  /** Policy-specific configuration */
  config: Record<string, unknown>;
  /** Is this an organizational policy (tenant-wide) */
  isOrganizationPolicy: boolean;
}

/**
 * Policy engine interface
 */
export interface PolicyEngine {
  /** Check a design system against all policies */
  enforce(designSystem: DesignSystemState): Promise<PolicyEnforcementResult>;

  /** Add a policy */
  addPolicy(policy: Policy): Promise<void>;

  /** Remove a policy */
  removePolicy(policyId: string): Promise<void>;

  /** Get all active policies */
  getPolicies(): Promise<Policy[]>;

  /** Enable/disable a policy */
  setPolicy(policyId: string, enabled: boolean): Promise<void>;
}

/**
 * Predefined organizational policies
 */
export const STANDARD_POLICIES = {
  // Color policies
  COLOR_PALETTE_LIMIT: {
    id: 'color_palette_limit',
    name: 'Color Palette Limit',
    description: 'Limit the number of colors in the palette',
    type: 'color' as const,
    config: { maxColors: 12 },
  },
  WCAG_AA_COMPLIANCE: {
    id: 'wcag_aa_compliance',
    name: 'WCAG AA Compliance',
    description: 'Ensure color contrasts meet WCAG AA standards',
    type: 'color' as const,
    config: { minContrast: 4.5 },
  },
  COLOR_NAMING_CONVENTION: {
    id: 'color_naming_convention',
    name: 'Color Naming Convention',
    description: 'Color tokens must follow naming pattern: color-[intent]-[shade]',
    type: 'naming' as const,
    config: { pattern: '^color-' },
  },

  // Typography policies
  TYPOGRAPHY_SCALE_LIMIT: {
    id: 'typography_scale_limit',
    name: 'Typography Scale Limit',
    description: 'Limit the number of typography scales',
    type: 'typography' as const,
    config: { maxScales: 8 },
  },
  TYPOGRAPHY_SIZING_STANDARD: {
    id: 'typography_sizing_standard',
    name: 'Typography Sizing Standard',
    description: 'Typography sizes must use standard scale (8px, 12px, 16px, etc.)',
    type: 'typography' as const,
    config: { baseSize: 4, allowedMultiples: [2, 3, 4, 5, 6] },
  },

  // Spacing policies
  SPACING_SCALE_CONSISTENCY: {
    id: 'spacing_scale_consistency',
    name: 'Spacing Scale Consistency',
    description: 'Spacing must follow a consistent scale',
    type: 'spacing' as const,
    config: { baseUnit: '4px', maxScales: 12 },
  },

  // Component policies
  COMPONENT_REQUIRED: {
    id: 'component_required',
    name: 'Required Components',
    description: 'Design system must include core components',
    type: 'component' as const,
    config: { required: ['Button', 'Card', 'Input', 'Typography'] },
  },
  COMPONENT_TOKEN_USAGE: {
    id: 'component_token_usage',
    name: 'Component Token Usage',
    description: 'Components must use design tokens, not hardcoded values',
    type: 'component' as const,
    config: { allowHardcodedValues: false },
  },
};

/**
 * Default policy engine implementation
 */
export class DefaultPolicyEngine implements PolicyEngine {
  private policies: Map<string, Policy> = new Map();
  private organizationPolicies: Set<string> = new Set();

  constructor(defaultPolicies?: Policy[]) {
    if (defaultPolicies) {
      for (const policy of defaultPolicies) {
        this.policies.set(policy.id, policy);
        if (policy.isOrganizationPolicy) {
          this.organizationPolicies.add(policy.id);
        }
      }
    }
  }

  async enforce(designSystem: DesignSystemState): Promise<PolicyEnforcementResult> {
    const violations: PolicyViolation[] = [];

    for (const [, policy] of this.policies) {
      if (!policy.enabled) {
        continue;
      }

      const policyViolations = await this.checkPolicy(policy, designSystem);
      violations.push(...policyViolations);
    }

    // Sort by severity
    const severityOrder = { error: 0, warning: 1, info: 2 };
    violations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      compliant: violations.some((v) => v.severity === 'error') === false,
      violations,
      summary: {
        errors: violations.filter((v) => v.severity === 'error').length,
        warnings: violations.filter((v) => v.severity === 'warning').length,
        infos: violations.filter((v) => v.severity === 'info').length,
      },
    };
  }

  private async checkPolicy(
    policy: Policy,
    designSystem: DesignSystemState
  ): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    switch (policy.type) {
      case 'color':
        violations.push(...this.checkColorPolicy(policy, designSystem));
        break;
      case 'typography':
        violations.push(...this.checkTypographyPolicy(policy, designSystem));
        break;
      case 'spacing':
        violations.push(...this.checkSpacingPolicy(policy, designSystem));
        break;
      case 'component':
        violations.push(...this.checkComponentPolicy(policy, designSystem));
        break;
      case 'naming':
        violations.push(...this.checkNamingPolicy(policy, designSystem));
        break;
      // custom policies would be handled by tenant-specific logic
    }

    return violations;
  }

  private checkColorPolicy(policy: Policy, designSystem: DesignSystemState): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const colorCount = designSystem.colors.size;

    if (policy.id === 'color_palette_limit') {
      const maxColors = policy.config.maxColors as number;
      if (colorCount > maxColors) {
        violations.push({
          policyId: policy.id,
          policyName: policy.name,
          severity: 'warning',
          message: `Color palette exceeds limit (${colorCount} > ${maxColors})`,
          affectedItems: Array.from(designSystem.colors.keys()),
        });
      }
    }

    return violations;
  }

  private checkTypographyPolicy(
    policy: Policy,
    designSystem: DesignSystemState
  ): PolicyViolation[] {
    const violations: PolicyViolation[] = [];

    if (policy.id === 'typography_scale_limit') {
      const maxScales = policy.config.maxScales as number;
      const typographyCount = designSystem.typography.size;

      if (typographyCount > maxScales) {
        violations.push({
          policyId: policy.id,
          policyName: policy.name,
          severity: 'warning',
          message: `Typography scales exceed limit (${typographyCount} > ${maxScales})`,
          affectedItems: Array.from(designSystem.typography.keys()),
        });
      }
    }

    return violations;
  }

  private checkSpacingPolicy(policy: Policy, designSystem: DesignSystemState): PolicyViolation[] {
    const violations: PolicyViolation[] = [];

    if (policy.id === 'spacing_scale_consistency') {
      const maxScales = policy.config.maxScales as number;
      const spacingCount = designSystem.spacing.size;

      if (spacingCount > maxScales) {
        violations.push({
          policyId: policy.id,
          policyName: policy.name,
          severity: 'info',
          message: `Spacing tokens exceed recommended limit (${spacingCount} > ${maxScales})`,
          affectedItems: Array.from(designSystem.spacing.keys()),
        });
      }
    }

    return violations;
  }

  private checkComponentPolicy(policy: Policy, designSystem: DesignSystemState): PolicyViolation[] {
    const violations: PolicyViolation[] = [];

    if (policy.id === 'component_required') {
      const required = policy.config.required as string[];
      const componentNames = new Set(designSystem.components.keys());

      const missing = required.filter((name) => !componentNames.has(name));

      if (missing.length > 0) {
        violations.push({
          policyId: policy.id,
          policyName: policy.name,
          severity: 'error',
          message: `Missing required components: ${missing.join(', ')}`,
          affectedItems: missing,
        });
      }
    }

    return violations;
  }

  private checkNamingPolicy(policy: Policy, designSystem: DesignSystemState): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const pattern = policy.config.pattern as string;
    const regex = new RegExp(pattern);

    let nonCompliantTokens: string[] = [];

    // Check colors
    for (const [name] of designSystem.colors) {
      if (!regex.test(name)) {
        nonCompliantTokens.push(`color:${name}`);
      }
    }

    // Check typography
    for (const [name] of designSystem.typography) {
      if (!regex.test(name)) {
        nonCompliantTokens.push(`typography:${name}`);
      }
    }

    if (nonCompliantTokens.length > 0) {
      violations.push({
        policyId: policy.id,
        policyName: policy.name,
        severity: 'warning',
        message: `Tokens do not follow naming convention "${pattern}"`,
        affectedItems: nonCompliantTokens,
      });
    }

    return violations;
  }

  async addPolicy(policy: Policy): Promise<void> {
    this.policies.set(policy.id, policy);
    if (policy.isOrganizationPolicy) {
      this.organizationPolicies.add(policy.id);
    }
  }

  async removePolicy(policyId: string): Promise<void> {
    this.policies.delete(policyId);
    this.organizationPolicies.delete(policyId);
  }

  async getPolicies(): Promise<Policy[]> {
    return Array.from(this.policies.values());
  }

  async setPolicy(policyId: string, enabled: boolean): Promise<void> {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.enabled = enabled;
    }
  }
}
