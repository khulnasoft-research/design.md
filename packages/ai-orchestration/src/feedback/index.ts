import type { DesignSystemDraft, IterationFeedback, IterationResult } from '@scalify/design-core';

/**
 * Feedback processing request
 */
export interface FeedbackProcessingRequest {
  /** Current design system draft */
  draft: DesignSystemDraft;

  /** User feedback */
  feedback: IterationFeedback;

  /** Model to use for refinement */
  model: string;

  /** Temperature for generation */
  temperature?: number;
}

/**
 * Feedback processing result
 */
export interface FeedbackProcessingResult {
  /** Updated design system draft */
  updatedDraft: DesignSystemDraft;

  /** Iteration result */
  iterationResult: IterationResult;

  /** Processing metadata */
  metadata: {
    /** ISO timestamp of processing */
    processedAt: string;

    /** Processing time in milliseconds */
    duration: number;

    /** Changes made */
    changes: {
      colorsModified: number;
      typographyModified: number;
      spacingModified: number;
      componentsModified: number;
      componentsAdded: number;
    };

    /** Any notes or warnings */
    notes?: string[];
  };
}

/**
 * Service for processing user feedback and refining design systems
 */
export interface FeedbackProcessor {
  /**
   * Process feedback and return updated draft
   */
  processFeedback(request: FeedbackProcessingRequest): Promise<FeedbackProcessingResult>;
}

/**
 * Default feedback processor implementation
 */
export class DefaultFeedbackProcessor implements FeedbackProcessor {
  async processFeedback(request: FeedbackProcessingRequest): Promise<FeedbackProcessingResult> {
    const startTime = Date.now();
    const updatedDraft = JSON.parse(JSON.stringify(request.draft)) as DesignSystemDraft;
    const changes = {
      colorsModified: 0,
      typographyModified: 0,
      spacingModified: 0,
      componentsModified: 0,
      componentsAdded: 0,
    };

    // Process proposed changes from feedback
    const proposed = request.feedback.proposedChanges;
    if (proposed) {
      if (proposed.colors) {
        Object.entries(proposed.colors).forEach(([key, hexValue]: [string, string]) => {
          updatedDraft.designSystem.colors.set(key, {
            type: 'color',
            hex: hexValue,
            r: 0,
            g: 0,
            b: 0,
            a: 1,
            luminance: 0.5,
          });
          changes.colorsModified++;
        });
      }

      if (proposed.typography) {
        Object.entries(proposed.typography).forEach(([key]: [string, Record<string, unknown>]) => {
          updatedDraft.designSystem.typography.set(key, {
            type: 'typography',
          });
          changes.typographyModified++;
        });
      }

      if (proposed.components) {
        Object.entries(proposed.components).forEach(([key]: [string, Record<string, unknown>]) => {
          if (updatedDraft.designSystem.components.has(key)) {
            changes.componentsModified++;
          } else {
            changes.componentsAdded++;
          }
        });
      }
    }

    // Process feedback message for general refactoring
    if (request.feedback.feedback.message) {
      const message = request.feedback.feedback.message;
      // Simple pattern matching for common adjustments
      if (message.toLowerCase().includes('darker')) {
        changes.colorsModified++;
      }
      if (message.toLowerCase().includes('larger')) {
        changes.typographyModified++;
      }
      if (message.toLowerCase().includes('spacing')) {
        changes.spacingModified++;
      }
    }

    // Build iteration result
    const iterationResult: IterationResult = {
      draftId: updatedDraft.id,
      iterationNumber: 1,
      tenantId: request.feedback.tenantId,
      createdAt: new Date().toISOString(),
      designSystem: updatedDraft.designSystem,
      validationReport: updatedDraft.validationReport,
      changesSummary: {
        changedTokens: [],
        addedTokens: [],
        removedTokens: [],
        affectedComponents: [],
      },
      iterationHistory: [],
    };

    const duration = Date.now() - startTime;

    return {
      updatedDraft,
      iterationResult,
      metadata: {
        processedAt: new Date().toISOString(),
        duration,
        changes,
        notes: [
          'Mock feedback processing - integrate with Vercel AI SDK for intelligent refinement',
        ],
      },
    };
  }
}

/**
 * Factory for creating feedback processor
 */
export function createFeedbackProcessor(): FeedbackProcessor {
  return new DefaultFeedbackProcessor();
}
