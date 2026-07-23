/**
 * @scalify/orchestration
 *
 * Workflow orchestration service for prompt-to-design-system transformation.
 * Exports the main service and utilities for building design-system workflows.
 * Includes optional enterprise controls: RBAC, audit, policy, approval, versioning.
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

// Re-export enterprise controls for convenience
export type {
  RBACManager,
  UserWithRoles,
  AuthorizationContext,
  AuthorizationDecision,
} from '@scalify/enterprise-controls/rbac';
export {
  SYSTEM_ROLES,
  SYSTEM_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  DefaultRBACManager,
} from '@scalify/enterprise-controls/rbac';

export type {
  AuditLogger,
  AuditLogEntry,
  AuditLogQuery,
  AuditReport,
} from '@scalify/enterprise-controls/audit';
export {
  InMemoryAuditLogStore,
  DefaultAuditLogger,
} from '@scalify/enterprise-controls/audit';

export type {
  PolicyEngine,
  PolicyEnforcementResult,
  Policy,
  PolicyViolation,
} from '@scalify/enterprise-controls/policy';
export {
  STANDARD_POLICIES,
  DefaultPolicyEngine,
} from '@scalify/enterprise-controls/policy';

export type {
  ApprovalManager,
  ApprovalRequest as EnterpriseApprovalRequest,
  ApprovalDecision,
  ApprovalWorkflow,
} from '@scalify/enterprise-controls/approval';
export {
  InMemoryApprovalWorkflowStore,
  DefaultApprovalManager,
} from '@scalify/enterprise-controls/approval';

export type {
  VersionManager,
  DesignSystemVersion,
  VersionDiff,
  ChangeEntry,
} from '@scalify/enterprise-controls/versioning';
export {
  VersionComparator,
  DefaultVersionManager,
} from '@scalify/enterprise-controls/versioning';
