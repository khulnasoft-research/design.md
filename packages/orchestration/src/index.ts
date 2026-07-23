/**
 * @scalify/orchestration
 * 
 * Workflow orchestration service for prompt-to-design-system transformation.
 * Exports the main service and utilities for building design-system workflows.
 */

export { OrchestrationService } from './service/index.js';
export type { OrchestrationServiceOptions } from './service/index.js';

export { InMemoryWorkflowStore } from './storage/index.js';
export type { WorkflowStore, StoredPrompt, StoredApproval } from './storage/index.js';

export { DefaultValidationService, MockValidationService } from './validation/index.js';
export type { ValidationService } from './validation/index.js';

export { generateId, hashDesignSystem, isValidTenantId, isValidPrompt } from './utils.js';
export { extractIntentions, extractConstraints, estimateGenerationTime } from './utils.js';
export { formatDuration } from './utils.js';

// Re-export types from design-core for convenience
export type {
  PromptRequest,
  PromptAcknowledgment,
  DesignSystemDraft,
  IterationFeedback,
  IterationResult,
  ApprovalRequest,
  ApprovalConfirmation,
  ExportRequest,
  WorkflowExportResult,
  PublishedDesignSystem,
} from '@scalify/design-core';
