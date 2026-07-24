/**
 * Orchestration Service
 *
 * Coordinates the full workflow from prompt intake through AI-powered
 * design-system generation, iteration, approval, and export.
 *
 * Integrates:
 * - AI orchestration (prompt analysis + draft generation + feedback processing)
 * - Enterprise controls (RBAC, audit, policy, approval, versioning)
 * - Real export pipeline (Tailwind v3/v4, DTCG, CSS)
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

import type { AIGenerationService, GenerationRequest } from '@scalify/ai-orchestration/generation';
import type {
  FeedbackProcessor,
  FeedbackProcessingRequest,
} from '@scalify/ai-orchestration/feedback';
import { analyzePrompt } from '@scalify/ai-orchestration/analyzer';

import type {
  RBACManager,
  UserWithRoles,
  AuthorizationDecision,
} from '@scalify/enterprise-controls/rbac';
import type { AuditLogger } from '@scalify/enterprise-controls/audit';
import type { PolicyEngine, PolicyEnforcementResult } from '@scalify/enterprise-controls/policy';
import type { ApprovalManager } from '@scalify/enterprise-controls/approval';
import type { VersionManager } from '@scalify/enterprise-controls/versioning';

export interface OrchestrationServiceOptions {
  store: WorkflowStore;
  validation: ValidationService;

  /** AI generation service for draft creation */
  aiGeneration?: AIGenerationService;
  /** Feedback processor for draft refinement */
  feedbackProcessor?: FeedbackProcessor;

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
  private aiGeneration?: AIGenerationService;
  private feedbackProcessor?: FeedbackProcessor;
  private rbac?: RBACManager;
  private auditLogger?: AuditLogger;
  private policyEngine?: PolicyEngine;
  private approvalManager?: ApprovalManager;
  private versionManager?: VersionManager;

  constructor(options: OrchestrationServiceOptions) {
    this.store = options.store;
    this.validation = options.validation;
    this.aiGeneration = options.aiGeneration;
    this.feedbackProcessor = options.feedbackProcessor;
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
        resourceId: (context?.resourceId as string) || 'unknown',
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
   * Submit a design prompt and automatically generate a draft.
   *
   * Full pipeline: analyze prompt → generate design system → validate → store draft.
   * When aiGeneration is not configured, returns queued status for async processing.
   */
  async submitPrompt(request: PromptRequest, user?: UserWithRoles): Promise<PromptAcknowledgment> {
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

    // If AI generation is available, run the full pipeline synchronously
    if (this.aiGeneration) {
      try {
        // Step 1: Analyze the prompt
        const analysis = await analyzePrompt(request);

        // Step 2: Generate a design system draft
        const generationRequest: GenerationRequest = {
          analyzedPrompt: analysis,
          originalPrompt: request,
          config: {
            model: 'default',
            temperature: 0.7,
            maxTokens: 4000,
          },
        };

        const result = await this.aiGeneration.generate(generationRequest);

        // Step 3: Validate the generated draft
        const validationReport = await this.validation.validate(result.draft.designSystem);

        // Step 4: Store the draft
        const draft: DesignSystemDraft = {
          ...result.draft,
          id: generateId(),
          promptId,
          tenantId: request.tenantId,
          validationReport,
        };

        await this.store.saveDraft(draft);

        // Audit: log successful generation
        await this.logAudit({
          tenantId: request.tenantId,
          userId: user?.userId || request.metadata?.createdBy || 'system',
          action: 'prompt.generate',
          resource: 'prompt',
          resourceId: promptId,
          outcome: 'success',
          changes: {
            after: {
              draftId: draft.id,
              model: result.metadata.model,
              duration: result.metadata.duration,
            },
          },
          duration: Date.now() - startTime,
        });

        return {
          promptId,
          timestamp: new Date().toISOString(),
          tenantId: request.tenantId,
          status: 'draft_ready',
          message: 'Draft generated and ready for review.',
          estimatedDraftCompletionTime: Date.now() - startTime,
        };
      } catch (error) {
        // Audit: log generation failure
        await this.logAudit({
          tenantId: request.tenantId,
          userId: user?.userId || request.metadata?.createdBy || 'system',
          action: 'prompt.generate',
          resource: 'prompt',
          resourceId: promptId,
          outcome: 'failure',
          failureReason: error instanceof Error ? error.message : String(error),
          changes: {},
          duration: Date.now() - startTime,
        });

        return {
          promptId,
          timestamp: new Date().toISOString(),
          tenantId: request.tenantId,
          status: 'error',
          message: `Draft generation failed: ${error instanceof Error ? error.message : String(error)}`,
          estimatedDraftCompletionTime: 0,
        };
      }
    }

    // No AI generation configured — return queued status
    const ack: PromptAcknowledgment = {
      promptId,
      timestamp: new Date().toISOString(),
      tenantId: request.tenantId,
      status: 'queued',
      message: 'Prompt received. Draft generation queued.',
      estimatedDraftCompletionTime: 120000,
    };

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
    if (user) {
      await this.enforcePermission(user, 'prompt', 'read', {
        resourceId: promptId,
      });
    }

    const prompt = await this.store.getPrompt(promptId, tenantId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

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
  async listDrafts(tenantId: string, user?: UserWithRoles): Promise<DesignSystemDraft[]> {
    if (user) {
      await this.enforcePermission(user, 'design_system', 'read');
    }
    return this.store.listDrafts(tenantId);
  }

  /**
   * Submit feedback to refine, regenerate, or reject a draft.
   *
   * When feedbackProcessor is configured, applies intelligent refinement
   * to the design system. Otherwise, records the feedback as an iteration.
   */
  async submitFeedback(
    feedback: IterationFeedback,
    user?: UserWithRoles
  ): Promise<IterationResult> {
    const startTime = Date.now();

    if (user) {
      await this.enforcePermission(user, 'design_system', 'update', {
        resourceId: feedback.draftId,
      });
    }

    const draft = await this.getDraft(feedback.draftId, feedback.tenantId);
    const iterationNumber = await this.store.getNextIterationNumber(feedback.draftId);
    const history = await this.store.getIterations(feedback.draftId);

    let updatedDesignSystem = draft.designSystem;
    let changesSummary = {
      changedTokens: [] as string[],
      addedTokens: [] as string[],
      removedTokens: [] as string[],
      affectedComponents: [] as string[],
    };

    // If feedback processor is available, apply intelligent refinement
    if (this.feedbackProcessor) {
      try {
        const processorRequest: FeedbackProcessingRequest = {
          draft,
          feedback,
          model: 'default',
        };

        const result = await this.feedbackProcessor.processFeedback(processorRequest);
        updatedDesignSystem = result.updatedDraft.designSystem;

        // Build changes summary from processor metadata
        const c = result.metadata.changes;
        if (c.colorsModified > 0) changesSummary.changedTokens.push(`colors(${c.colorsModified})`);
        if (c.typographyModified > 0)
          changesSummary.changedTokens.push(`typography(${c.typographyModified})`);
        if (c.spacingModified > 0)
          changesSummary.changedTokens.push(`spacing(${c.spacingModified})`);
        if (c.componentsAdded > 0)
          changesSummary.addedTokens.push(`components(${c.componentsAdded})`);
        if (c.componentsModified > 0)
          changesSummary.changedTokens.push(`components(${c.componentsModified})`);
      } catch {
        // Fall through to basic iteration recording
      }
    }

    // Re-validate after feedback
    const validationReport = await this.validation.validate(updatedDesignSystem);

    // Update the draft with the refined design system
    const updatedDraft: DesignSystemDraft = {
      ...draft,
      designSystem: updatedDesignSystem,
      validationReport,
    };
    await this.store.updateDraft(updatedDraft);

    // Store the iteration record
    const iterationRecord = {
      iterationNumber,
      feedback,
      designSystem: updatedDesignSystem,
      validationReport,
      timestamp: new Date().toISOString(),
    };
    await this.store.saveIteration(feedback.draftId, iterationRecord);

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
          iterationNumber,
        },
      },
      duration: Date.now() - startTime,
    });

    return {
      draftId: feedback.draftId,
      iterationNumber,
      tenantId: feedback.tenantId,
      createdAt: new Date().toISOString(),
      designSystem: updatedDesignSystem,
      changesSummary,
      validationReport,
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
   * Validates the draft, enforces policies, and records the approval.
   * When approvalManager is configured, delegates to enterprise workflow.
   * When versionManager is configured, auto-versions on approval.
   */
  async submitApproval(
    request: ApprovalRequest,
    user?: UserWithRoles
  ): Promise<ApprovalConfirmation> {
    const startTime = Date.now();

    if (user) {
      const permission =
        request.action === 'reject' ? 'approval_request_reject' : 'approval_request_approve';
      await this.enforcePermission(user, 'approval_request', permission, {
        resourceId: request.draftId,
      });
    }

    const draft = await this.getDraft(request.draftId, request.tenantId);

    // Validate the draft before approval
    const validationReport = await this.validation.validate(draft.designSystem);

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
      throw new Error(`Design system has validation errors: ${errorFindings}`);
    }

    // Policy enforcement
    if (this.policyEngine) {
      const policyResult = await this.policyEngine.enforce(draft.designSystem);
      if (!policyResult.compliant) {
        const errors = policyResult.violations.filter((v: { severity: string }) => v.severity === 'error');
        if (errors.length > 0 && request.action !== 'reject') {
          await this.logAudit({
            tenantId: request.tenantId,
            userId: user?.userId || 'system',
            action: 'approval.policy_violation',
            resource: 'design_system',
            resourceId: request.draftId,
            outcome: 'failure',
            failureReason: `Policy violations: ${errors.map((e: { message: string }) => e.message).join('; ')}`,
            changes: {},
            duration: Date.now() - startTime,
          });
          throw new Error(
            `Design system violates organizational policies: ${errors.map((e: { message: string }) => e.message).join('; ')}`
          );
        }
      }
    }

    const designSystemId = generateId();

    const approvalRecord = {
      user: request.metadata?.approvedBy || user?.userId || 'system',
      action: request.action,
      timestamp: new Date().toISOString(),
      notes: request.approverNotes,
    };

    if (request.action === 'reject') {
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

    // Enterprise approval recording
    if (this.approvalManager) {
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

    // Save approval
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
   *
   * Uses the CLI linter emitters to produce real Tailwind v3/v4,
   * DTCG, or CSS output from the design system tokens.
   */
  async exportDesignSystem(
    request: ExportRequest,
    user?: UserWithRoles
  ): Promise<WorkflowExportResult> {
    const startTime = Date.now();

    if (user) {
      await this.enforcePermission(user, 'design_system', 'export', {
        resourceId: request.designSystemId,
      });
    }

    const approval = await this.store.getApproval(request.designSystemId, request.tenantId);
    if (!approval) {
      throw new Error(`Design system not found: ${request.designSystemId}`);
    }

    const draft = await this.store.getDraft(approval.draftId, request.tenantId);
    if (!draft) {
      throw new Error(`Draft not found: ${approval.draftId}`);
    }

    const exportId = generateId();
    const designSystem = draft.designSystem;

    // Generate real export content using CLI linter emitters
    let content: string;

    switch (request.format) {
      case 'tailwind-v4': {
        const { TailwindV4EmitterHandler, serializeTailwindV4 } =
          await import('@scalify/cli/linter');
        const handler = new TailwindV4EmitterHandler();
        const result = handler.execute(designSystem);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        content = serializeTailwindV4(result.data.theme);
        break;
      }

      case 'tailwind-v3': {
        const { TailwindEmitterHandler } = await import('@scalify/cli/linter');
        const handler = new TailwindEmitterHandler();
        const result = handler.execute(designSystem);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        content = JSON.stringify(result.data, null, 2);
        break;
      }

      case 'dtcg': {
        const { DtcgEmitterHandler } = await import('@scalify/cli/linter');
        const handler = new DtcgEmitterHandler();
        const result = handler.execute(designSystem);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        content = JSON.stringify(result.data, null, 2);
        break;
      }

      case 'css': {
        // Generate CSS custom properties from design tokens
        const lines: string[] = [':root {'];

        for (const [name, color] of designSystem.colors) {
          lines.push(`  --color-${name}: ${color.hex};`);
        }

        for (const [name, typo] of designSystem.typography) {
          const props = Object.entries(typo)
            .filter(([k]) => k !== 'type')
            .map(([k, v]) => `  --typography-${name}-${k}: ${v};`);
          lines.push(...props);
        }

        for (const [name, dim] of designSystem.rounded) {
          lines.push(`  --rounded-${name}: ${dim.value}${dim.unit};`);
        }

        for (const [name, dim] of designSystem.spacing) {
          lines.push(`  --spacing-${name}: ${dim.value}${dim.unit};`);
        }

        lines.push('}');
        content = lines.join('\n');
        break;
      }

      default:
        throw new Error(`Unsupported export format: ${request.format}`);
    }

    await this.logAudit({
      tenantId: request.tenantId,
      userId: user?.userId || request.metadata?.exportedBy || 'system',
      action: 'design_system.export',
      resource: 'design_system',
      resourceId: request.designSystemId,
      outcome: 'success',
      changes: { after: { format: request.format, exportId, contentLength: content.length } },
      duration: Date.now() - startTime,
    });

    return {
      designSystemId: request.designSystemId,
      exportId,
      format: request.format,
      timestamp: new Date().toISOString(),
      content,
      auditTrail: {
        promptId: draft.promptId,
        iterationCount: (await this.store.getIterations(approval.draftId)).length,
        approvalChain: approval.approvalChain?.map((r) => r.user) || [],
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
  async getVersionHistory(designSystemId: string, user?: UserWithRoles) {
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

    return this.versionManager.generateChangelog(designSystemId, fromVersion, toVersion);
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
