/**
 * Orchestration Service
 * 
 * Coordinates the workflow from prompt intake through design-system generation,
 * iteration, approval, and export. Acts as the central hub for all workflow operations.
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

export interface OrchestrationServiceOptions {
  store: WorkflowStore;
  validation: ValidationService;
}

export class OrchestrationService {
  private store: WorkflowStore;
  // private validation: ValidationService;

  constructor(options: OrchestrationServiceOptions) {
    this.store = options.store;
    // this.validation = options.validation;
  }

  /**
   * Submit a design prompt and initiate draft generation.
   * Returns immediately with a queued status; actual generation happens asynchronously.
   */
  async submitPrompt(request: PromptRequest): Promise<PromptAcknowledgment> {
    const promptId = generateId();

    // Store the prompt for future reference
    await this.store.savePrompt({
      id: promptId,
      ...request,
      createdAt: new Date().toISOString(),
    });

    // Return acknowledgment
    return {
      promptId,
      timestamp: new Date().toISOString(),
      tenantId: request.tenantId,
      status: 'queued',
      message: 'Prompt received. Draft generation queued.',
      estimatedDraftCompletionTime: 120000, // 2 minutes
    };
  }

  /**
   * Get the current status of a prompt's processing.
   */
  async getPromptStatus(promptId: string, tenantId: string): Promise<PromptAcknowledgment> {
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
  async getDraft(draftId: string, tenantId: string): Promise<DesignSystemDraft> {
    const draft = await this.store.getDraft(draftId, tenantId);
    if (!draft) {
      throw new Error(`Draft not found: ${draftId}`);
    }
    return draft;
  }

  /**
   * List all drafts for a tenant.
   */
  async listDrafts(tenantId: string): Promise<DesignSystemDraft[]> {
    return this.store.listDrafts(tenantId);
  }

  /**
   * Submit feedback to refine, regenerate, or reject a draft.
   */
  async submitFeedback(feedback: IterationFeedback): Promise<IterationResult> {
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
   */
  async submitApproval(request: ApprovalRequest): Promise<ApprovalConfirmation> {
    // Retrieve the draft
    const draft = await this.getDraft(request.draftId, request.tenantId);

    // Create a design system ID (replaces draft ID)
    const designSystemId = generateId();

    // Build approval record
    const approvalRecord = {
      user: request.metadata?.approvedBy || 'system',
      action: request.action,
      timestamp: new Date().toISOString(),
      notes: request.approverNotes,
    };

    // If rejecting, don't save approval
    if (request.action === 'reject') {
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
  async exportDesignSystem(request: ExportRequest): Promise<WorkflowExportResult> {
    // Retrieve the design system
    const approval = await this.store.getApproval(request.designSystemId, request.tenantId);
    if (!approval) {
      throw new Error(`Design system not found: ${request.designSystemId}`);
    }

    // Export using the existing design-core export functionality
    const exportId = generateId();

    return {
      designSystemId: request.designSystemId,
      exportId,
      format: request.format,
      timestamp: new Date().toISOString(),
      content: '/* Export content would be generated by design-core export module */',
      auditTrail: {
        promptId: '', // Would be retrieved from approval chain
        iterationCount: 0,
        approvalChain: approval.approvalChain?.map(r => r.user) || [],
        exportedAt: new Date().toISOString(),
        exportedBy: request.metadata?.exportedBy || 'system',
      },
    };
  }

  /**
   * Get a published design system.
   */
  async getPublishedDesignSystem(
    designSystemId: string,
    tenantId: string
  ): Promise<PublishedDesignSystem | null> {
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
}
