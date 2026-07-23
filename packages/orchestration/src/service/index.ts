/**
 * Orchestration Service
 *
 * Coordinates the workflow from prompt intake through design-system generation,
 * iteration, approval, and export. Acts as the central hub for all workflow operations.
 *
 * Integrates enterprise controls: RBAC, audit logging, policy enforcement,
 * approval routing, and versioning — all optional for backwards compatibility.
 */

import type {
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
import type { WorkflowStore } from '../storage/index.js';
import type { ValidationService } from '../validation/index.js';
import { generateId } from '../utils.js';

import type {
  RBACManager,
  UserWithRoles,
  AuthorizationDecision,
} from '@scalify/enterprise-controls/rbac';
import type {
  AuditLogger,
} from '@scalify/enterprise-controls/audit';
import type {
  PolicyEngine,
  PolicyEnforcementResult,
} from '@scalify/enterprise-controls/policy';
import type {
  ApprovalManager,
} from '@scalify/enterprise-controls/approval';
import type {
  VersionManager,
} from '@scalify/enterprise-controls/versioning';

export interface OrchestrationServiceOptions {
  store: WorkflowStore;
  validation: ValidationService;

  /** Role-based access control manager */
  rbac?: RBACManager;
  /** Audit logging service */
  auditLogger?: AuditLogger;
  /** Policy enforcement engine */
  policyEngine?: PolicyEngine;
  /** Enterprise approval workflow manager */
  approvalManager?: ApprovalManager;
  /** Design system version manager */
  versionManager?: VersionManager;
}

export class OrchestrationService {
  private store: WorkflowStore;
  private validation: ValidationService;
  private rbac?: RBACManager;
  private auditLogger?: AuditLogger;
  private policyEngine?: PolicyEngine;
  private approvalManager?: ApprovalManager;
  private versionManager?: VersionManager;

  constructor(options: OrchestrationServiceOptions) {
    this.store = options.store;
    this.validation = options.validation;
    this.rbac = options.rbac;
    this.auditLogger = options.auditLogger;
    this.policyEngine = options.policyEngine;
    this.approvalManager = options.approvalManager;
    this.versionManager = options.versionManager;
  }

  // ── RBAC Helpers ──────────────────────────────────────────────────────────

  private async checkPermission(
    user: UserWithRoles,
    resource: string,
    action: string,
    context?: Record<string, unknown>
  ): Promise<AuthorizationDecision> {
    if (!this.rbac) {
      return { allowed: true, reason: 'RBAC not configured' };
    }
    return this.rbac.authorize({ user, resource, action, context });
  }

  private async enforcePermission(
    user: UserWithRoles,
    resource: string,
    action: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    const decision = await this.checkPermission(user, resource, action, context);
    if (!decision.allowed) {
      await this.logAudit({
        tenantId: user.tenantId,
        userId: user.userId,
        action: `${action}_denied`,
        resource,
        resourceId: context?.resourceId as string || 'unknown',
        outcome: 'failure',
        failureReason: decision.reason,
        changes: {},
      });
      throw new Error(`Authorization denied: ${decision.reason}`);
    }
  }

  // ── Audit Helpers ─────────────────────────────────────────────────────────

  private async logAudit(entry: {
    tenantId: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    outcome: 'success' | 'failure' | 'partial';
    failureReason?: string;
    changes: { before?: Record<string, unknown>; after?: Record<string, unknown> };
    duration?: number;
  }): Promise<void> {
    if (!this.auditLogger) return;
    await this.auditLogger.log(entry);
  }

  // ── Workflow Methods ──────────────────────────────────────────────────────

  /**
   * Submit a design prompt and initiate draft generation.
   * Returns immediately with a queued status; actual generation happens asynchronously.
   */
  async submitPrompt(
    request: PromptRequest,
    user?: UserWithRoles
  ): Promise<PromptAcknowledgment> {
    const startTime = Date.now();

    // RBAC: check prompt:create permission
    if (user) {
      await this.enforcePermission(user, 'prompt', 'create', {
        tenantId: request.tenantId,
      });
    }

    const promptId = generateId();

    // Store the prompt for future reference
    await this.store.savePrompt({
      id: promptId,
      ...request,
      createdAt: new Date().toISOString(),
    });

    const ack: PromptAcknowledgment = {
      promptId,
      timestamp: new Date().toISOString(),
      tenantId: request.tenantId,
      status: 'queued',
      message: 'Prompt received. Draft generation queued.',
      estimatedDraftCompletionTime: 120000,
    };

    // Audit: log prompt submission
    await this.logAudit({
      tenantId: request.tenantId,
      userId: user?.userId || request.metadata?.createdBy || 'system',
      action: 'prompt.submit',
      resource: 'prompt',
      resourceId: promptId,
      outcome: 'success',
      changes: { after: { prompt: request.prompt } },
      duration: Date.now() - startTime,
    });

    return ack;
  }

  /**
   * Get the current status of a prompt's processing.
   */
  async getPromptStatus(
    promptId: string,
    tenantId: string,
    user?: UserWithRoles
  ): Promise<PromptAcknowledgment> {
    // RBAC: check prompt:read permission
    if (user) {
      await this.enforcePermission(user, 'prompt', 'read', {
        resourceId: promptId,
      });
    }

    const prompt = await this.store.getPrompt(promptId, tenantId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    // Check if a draft exists for this prompt
    const draft = await this.store.getDraftByPromptId(promptId);

    return {
      promptId,
      timestamp: new Date().toISOString(),
      tenantId,
      status: draft ? 'draft_ready' : 'processing',
      message: draft ? 'Draft ready for review' : 'Still generating draft...',
    };
  }

  /**
   * Get a draft by ID.
   */
  async getDraft(
    draftId: string,
    tenantId: string,
    user?: UserWithRoles
  ): Promise<DesignSystemDraft> {
    // RBAC: check design_system:read permission
    if (user) {
      await this.enforcePermission(user, 'design_system', 'read', {
        resourceId: draftId,
      });
    }

    const draft = await this.store.getDraft(draftId, tenantId);
    if (!draft) {
      throw new Error(`Draft not found: ${draftId}`);
    }
    return draft;
  }

  /**
   * List all drafts for a tenant.
   */
  async listDrafts(
    tenantId: string,
    user?: UserWithRoles
  ): Promise<DesignSystemDraft[]> {
    if (user) {
      await this.enforcePermission(user, 'design_system', 'read');
    }
    return this.store.listDrafts(tenantId);
  }

  /**
   * Submit feedback to refine, regenerate, or reject a draft.
   */
  async submitFeedback(
    feedback: IterationFeedback,
    user?: UserWithRoles
  ): Promise<IterationResult> {
    const startTime = Date.now();

    // RBAC: check design_system:update permission
    if (user) {
      await this.enforcePermission(user, 'design_system', 'update', {
        resourceId: feedback.draftId,
      });
    }

    // Retrieve the current draft
    const draft = await this.getDraft(feedback.draftId, feedback.tenantId);

    // Store the feedback as an iteration record
    const iterationNumber = await this.store.getNextIterationNumber(feedback.draftId);

    // Build iteration history
    const history = await this.store.getIterations(feedback.draftId);

    const iterationRecord = {
      iterationNumber,
      feedback,
      designSystem: draft.designSystem,
      validationReport: draft.validationReport,
      timestamp: new Date().toISOString(),
    };

    await this.store.saveIteration(feedback.draftId, iterationRecord);

    // Audit: log feedback submission
    await this.logAudit({
      tenantId: feedback.tenantId,
      userId: user?.userId || 'system',
      action: 'design_system.feedback',
      resource: 'design_system',
      resourceId: feedback.draftId,
      outcome: 'success',
      changes: {
        after: {
          feedbackType: feedback.feedback.type,
          message: feedback.feedback.message,
        },
      },
      duration: Date.now() - startTime,
    });

    return {
      draftId: feedback.draftId,
      iterationNumber,
      tenantId: feedback.tenantId,
      createdAt: new Date().toISOString(),
      designSystem: draft.designSystem,
      changesSummary: {
        changedTokens: [],
        addedTokens: [],
        removedTokens: [],
        affectedComponents: [],
      },
      validationReport: draft.validationReport,
      iterationHistory: [...history, iterationRecord],
    };
  }

  /**
   * Get the iteration history for a draft.
   */
  async getIterationHistory(draftId: string) {
    return this.store.getIterations(draftId);
  }

  /**
   * Submit an approval or rejection for a draft.
   *
   * When enterprise approval manager is configured, routes through the
   * multi-step approval workflow. When policy engine is configured,
   * enforces organizational policies before approval.
   */
  async submitApproval(
    request: ApprovalRequest,
    user?: UserWithRoles
  ): Promise<ApprovalConfirmation> {
    const startTime = Date.now();

    // RBAC: check approval_request:create or approval_request:approve permission
    if (user) {
      const permission = request.action === 'reject'
        ? 'approval_request_reject'
        : 'approval_request_approve';
      await this.enforcePermission(user, 'approval_request', permission, {
        resourceId: request.draftId,
      });
    }

    // Retrieve the draft
    const draft = await this.getDraft(request.draftId, request.tenantId);

    // Validate the draft before approval
    const validationReport = await this.validation.validate(draft.designSystem);

    // Block approval if validation has errors
    if (validationReport.summary.errors > 0) {
      const errorFindings = validationReport.findings
        .filter((f) => f.severity === 'error')
        .map((f) => f.message)
        .join('; ');
      await this.logAudit({
        tenantId: request.tenantId,
        userId: user?.userId || 'system',
        action: 'approval.validation_failed',
        resource: 'design_system',
        resourceId: request.draftId,
        outcome: 'failure',
        failureReason: `Validation errors: ${errorFindings}`,
        changes: {},
        duration: Date.now() - startTime,
      });
      throw new Error(
        `Design system has validation errors: ${errorFindings}`
      );
    }

    // Policy enforcement: run policy checks before approval
    if (this.policyEngine) {
      const policyResult = await this.policyEngine.enforce(draft.designSystem);
      if (!policyResult.compliant) {
        const errors = policyResult.violations.filter(v => v.severity === 'error');
        if (errors.length > 0 && request.action !== 'reject') {
          await this.logAudit({
            tenantId: request.tenantId,
            userId: user?.userId || 'system',
            action: 'approval.policy_violation',
            resource: 'design_system',
            resourceId: request.draftId,
            outcome: 'failure',
            failureReason: `Policy violations: ${errors.map(e => e.message).join('; ')}`,
            changes: {},
            duration: Date.now() - startTime,
          });
          throw new Error(
            `Design system violates organizational policies: ${errors.map(e => e.message).join('; ')}`
          );
        }
      }
    }

    // Create a design system ID (replaces draft ID)
    const designSystemId = generateId();

    // Build approval record
    const approvalRecord = {
      user: request.metadata?.approvedBy || user?.userId || 'system',
      action: request.action,
      timestamp: new Date().toISOString(),
      notes: request.approverNotes,
    };

    // If rejecting, don't save approval
    if (request.action === 'reject') {
      // Audit: log rejection
      await this.logAudit({
        tenantId: request.tenantId,
        userId: user?.userId || 'system',
        action: 'approval.reject',
        resource: 'design_system',
        resourceId: request.draftId,
        outcome: 'success',
        changes: { after: { reason: request.approverNotes } },
        duration: Date.now() - startTime,
      });

      return {
        draftId: request.draftId,
        designSystemId,
        tenantId: request.tenantId,
        status: 'rejected',
        timestamp: new Date().toISOString(),
        approvalChain: [approvalRecord],
        designSystem: draft.designSystem,
        exportTargets: [],
        exportFormats: [],
      };
    }

    // Enterprise approval recording: delegate to approval manager if available
    if (this.approvalManager) {
      // Record the approval decision in the enterprise workflow system
      const enterpriseRequest = await this.approvalManager.submitForApproval(
        designSystemId,
        request.tenantId,
        approvalRecord.user
      );

      await this.logAudit({
        tenantId: request.tenantId,
        userId: user?.userId || 'system',
        action: 'approval.enterprise_initiated',
        resource: 'design_system',
        resourceId: request.draftId,
        outcome: 'success',
        changes: {
          after: {
            enterpriseApprovalId: enterpriseRequest.id,
            workflowId: enterpriseRequest.workflowId,
          },
        },
        duration: Date.now() - startTime,
      });
    }

    // Save approval (simple flow)
    await this.store.saveApproval(
      {
        designSystemId,
        draftId: request.draftId,
        tenantId: request.tenantId,
        approvalChain: [approvalRecord],
        status: 'approved',
        approvedAt: new Date().toISOString(),
        exportTargets: request.exportTargets || [],
      },
      request.tenantId
    );

    // Versioning: auto-version on approval
    if (this.versionManager) {
      const ds = draft.designSystem as unknown as Record<string, unknown>;
      await this.versionManager.createVersion(
        designSystemId,
        ds,
        {
          releaseDate: new Date().toISOString(),
          releaseNotes: request.approverNotes || 'Initial approval',
          releasedBy: approvalRecord.user,
        },
        []
      );
    }

    // Audit: log approval
    await this.logAudit({
      tenantId: request.tenantId,
      userId: user?.userId || 'system',
      action: 'approval.approve',
      resource: 'design_system',
      resourceId: request.draftId,
      outcome: 'success',
      changes: {
        after: { designSystemId, approvedBy: approvalRecord.user },
      },
      duration: Date.now() - startTime,
    });

    return {
      draftId: request.draftId,
      designSystemId,
      tenantId: request.tenantId,
      status: 'approved',
      timestamp: new Date().toISOString(),
      approvalChain: [approvalRecord],
      designSystem: draft.designSystem,
      exportTargets: request.exportTargets || [],
      exportFormats: [
        { format: 'tailwind-v4' as const, url: `/api/export/${designSystemId}/tailwind-v4` },
        { format: 'tailwind-v3' as const, url: `/api/export/${designSystemId}/tailwind-v3` },
        { format: 'dtcg' as const, url: `/api/export/${designSystemId}/dtcg` },
        { format: 'css' as const, url: `/api/export/${designSystemId}/css` },
      ],
    };
  }

  /**
   * Export a published design system to a target format.
   */
  async exportDesignSystem(
    request: ExportRequest,
    user?: UserWithRoles
  ): Promise<WorkflowExportResult> {
    const startTime = Date.now();

    // RBAC: check design_system:export permission
    if (user) {
      await this.enforcePermission(user, 'design_system', 'export', {
        resourceId: request.designSystemId,
      });
    }

    // Retrieve the design system
    const approval = await this.store.getApproval(request.designSystemId, request.tenantId);
    if (!approval) {
      throw new Error(`Design system not found: ${request.designSystemId}`);
    }

    const exportId = generateId();

    // Audit: log export
    await this.logAudit({
      tenantId: request.tenantId,
      userId: user?.userId || request.metadata?.exportedBy || 'system',
      action: 'design_system.export',
      resource: 'design_system',
      resourceId: request.designSystemId,
      outcome: 'success',
      changes: { after: { format: request.format, exportId } },
      duration: Date.now() - startTime,
    });

    return {
      designSystemId: request.designSystemId,
      exportId,
      format: request.format,
      timestamp: new Date().toISOString(),
      content: '/* Export content would be generated by design-core export module */',
      auditTrail: {
        promptId: '',
        iterationCount: 0,
        approvalChain: approval.approvalChain?.map(r => r.user) || [],
        exportedAt: new Date().toISOString(),
        exportedBy: user?.userId || request.metadata?.exportedBy || 'system',
      },
    };
  }

  /**
   * Get a published design system.
   */
  async getPublishedDesignSystem(
    designSystemId: string,
    tenantId: string,
    user?: UserWithRoles
  ): Promise<PublishedDesignSystem | null> {
    if (user) {
      await this.enforcePermission(user, 'design_system', 'read', {
        resourceId: designSystemId,
      });
    }

    const approval = await this.store.getApproval(designSystemId, tenantId);
    if (!approval) {
      return null;
    }

    const draft = await this.getDraft(approval.draftId, tenantId);

    return {
      id: designSystemId,
      tenantId,
      name: draft.designSystem.name || 'Unnamed Design System',
      version: draft.version,
      designSystem: draft.designSystem,
      promptId: draft.promptId,
      draftId: approval.draftId,
      approvalChain: approval.approvalChain || [],
      createdAt: draft.createdAt,
      approvedAt: approval.approvedAt || new Date().toISOString(),
      status: 'published',
    };
  }

  // ── Enterprise-Specific Methods ───────────────────────────────────────────

  /**
   * Enforce organizational policies on a design system.
   * Returns policy violations without modifying state.
   */
  async enforcePolicies(
    designSystemId: string,
    tenantId: string,
    user?: UserWithRoles
  ): Promise<PolicyEnforcementResult> {
    if (!this.policyEngine) {
      return {
        compliant: true,
        violations: [],
        summary: { errors: 0, warnings: 0, infos: 0 },
      };
    }

    if (user) {
      await this.enforcePermission(user, 'design_system', 'read', {
        resourceId: designSystemId,
      });
    }

    const approval = await this.store.getApproval(designSystemId, tenantId);
    if (!approval) {
      throw new Error(`Design system not found: ${designSystemId}`);
    }

    const draft = await this.getDraft(approval.draftId, tenantId);
    return this.policyEngine.enforce(draft.designSystem);
  }

  /**
   * Get the version history for a design system.
   */
  async getVersionHistory(
    designSystemId: string,
    user?: UserWithRoles
  ) {
    if (!this.versionManager) return [];

    if (user) {
      await this.enforcePermission(user, 'design_system', 'read', {
        resourceId: designSystemId,
      });
    }

    return this.versionManager.listVersions(designSystemId);
  }

  /**
   * Generate a changelog for a design system between versions.
   */
  async generateChangelog(
    designSystemId: string,
    fromVersion?: string,
    toVersion?: string,
    user?: UserWithRoles
  ): Promise<string> {
    if (!this.versionManager) {
      throw new Error('Version manager not configured');
    }

    if (user) {
      await this.enforcePermission(user, 'design_system', 'read', {
        resourceId: designSystemId,
      });
    }

    return this.versionManager.generateChangelog(
      designSystemId,
      fromVersion,
      toVersion
    );
  }

  /**
   * Get audit log entries for a tenant.
   */
  async getAuditLog(params: {
    tenantId: string;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    if (!this.auditLogger) return [];

    return this.auditLogger.query(params);
  }

  /**
   * Generate an audit report for a tenant.
   */
  async generateAuditReport(params: {
    tenantId: string;
    startDate: string;
    endDate: string;
    groupBy?: 'action' | 'user' | 'resource';
  }) {
    if (!this.auditLogger) {
      return {
        period: { start: params.startDate, end: params.endDate },
        totalEntries: 0,
        successRate: 100,
        breakdown: {},
        notableEvents: [],
      };
    }

    return this.auditLogger.generateReport(params);
  }
}
