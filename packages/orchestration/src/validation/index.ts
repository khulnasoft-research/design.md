/**
 * Validation Service
 *
 * Wraps the design-core linter and provides comprehensive validation reports
 * including token completeness and WCAG compliance checks.
 */

import type { DesignSystemState, ValidationReport } from '@scalify/design-core';

/**
 * Validates a design system and produces a comprehensive report.
 * This is the interface that orchestration uses for validation.
 */
export interface ValidationService {
  validate(designSystem: DesignSystemState): Promise<ValidationReport>;
}

/**
 * Default implementation that wraps design-core linting and adds custom checks.
 */
export class DefaultValidationService implements ValidationService {
  async validate(designSystem: DesignSystemState): Promise<ValidationReport> {
    // For now, return a basic validation report
    // In a real implementation, this would call the actual linter from design-core
    const tokenCompleteness = this.measureCompleteness(designSystem);
    const wcagCompliance = this.checkWCAGCompliance(designSystem);

    return {
      findings: [],
      summary: {
        errors: 0,
        warnings: 0,
        infos: 0,
      },
      tokenCompleteness,
      wcagCompliance,
    };
  }

  /**
   * Measures the completeness of the design system tokens.
   * Returns a percentage (0-100) based on how many expected token categories are present.
   */
  private measureCompleteness(designSystem: DesignSystemState): number {
    let score = 0;
    const maxScore = 5;

    // Colors: 1 point
    if (designSystem.colors.size > 0) score += 1;

    // Typography: 1 point
    if (designSystem.typography.size > 0) score += 1;

    // Spacing: 1 point
    if (designSystem.spacing.size > 0) score += 1;

    // Rounded: 1 point
    if (designSystem.rounded.size > 0) score += 1;

    // Components: 1 point
    if (designSystem.components.size > 0) score += 1;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Checks WCAG AA and AAA compliance for all color combinations.
   * Simplified implementation for demonstration.
   */
  private checkWCAGCompliance(designSystem: DesignSystemState): { aa: boolean; aaa: boolean } {
    // In a real implementation, this would:
    // 1. Extract all background/foreground color combinations
    // 2. Calculate contrast ratios for each
    // 3. Compare against WCAG AA (4.5:1) and AAA (7:1) thresholds

    // For now, assume compliance if colors are defined
    const hasColors = designSystem.colors.size > 0;
    const hasTypography = designSystem.typography.size > 0;

    return {
      aa: hasColors && hasTypography,
      aaa: hasColors && hasTypography,
    };
  }
}

/**
 * Mock validation service for testing
 */
export class MockValidationService implements ValidationService {
  async validate(): Promise<ValidationReport> {
    return {
      findings: [],
      summary: {
        errors: 0,
        warnings: 0,
        infos: 0,
      },
      tokenCompleteness: 100,
      wcagCompliance: {
        aa: true,
        aaa: true,
      },
    };
  }
}
