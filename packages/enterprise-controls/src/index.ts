/**
 * Enterprise Controls
 * 
 * Complete governance, RBAC, audit logging, and approval workflow system
 * for the design.md enterprise platform.
 */

// RBAC exports
export type { 
  Permission, 
  Role, 
  UserWithRoles, 
  AuthorizationContext, 
  AuthorizationDecision, 
  RBACManager 
} from './rbac/index.js';
export {
  SYSTEM_ROLES,
  SYSTEM_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  DefaultRBACManager,
} from './rbac/index.js';

// Policy Engine exports
export type { 
  PolicyViolation, 
  PolicyEnforcementResult, 
  Policy, 
  PolicyEngine 
} from './policy/index.js';
export {
  STANDARD_POLICIES,
  DefaultPolicyEngine,
} from './policy/index.js';

// Audit Logging exports
export type {
  AuditLogEntry,
  AuditLogQuery,
  AuditLogStore,
  AuditLogger,
  AuditReport,
} from './audit/index.js';
export {
  InMemoryAuditLogStore,
  DefaultAuditLogger,
} from './audit/index.js';

// Approval Workflow exports
export type {
  ApprovalStep,
  ApprovalWorkflow,
  ApprovalRequest,
  ApprovalDecision,
  ApprovalWorkflowStore,
  ApprovalManager,
} from './approval/index.js';
export {
  InMemoryApprovalWorkflowStore,
  DefaultApprovalManager,
} from './approval/index.js';

// Versioning exports
export type {
  SemanticVersion,
  VersionMetadata,
  DesignSystemVersion,
  ChangeEntry,
  VersionDiff,
  VersionManager,
} from './versioning/index.js';
export {
  VersionComparator,
  DefaultVersionManager,
} from './versioning/index.js';
