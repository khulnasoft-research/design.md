/**
 * Storage Abstraction Layer
 * 
 * Defines the interface for persisting workflow state (prompts, drafts, iterations, approvals).
 * Implementations can use various backends (PostgreSQL, DynamoDB, etc.)
 */

import type {
  DesignSystemDraft,
  ApprovalRecord,
  IterationRecord,
} from '@scalify/design-core';

/**
 * Enhanced PromptRequest with ID and metadata
 */
export interface StoredPrompt {
  id: string;
  prompt: string;
  tenantId: string;
  projectId?: string;
  contextDesignSystemId?: string;
  targetScenario?: 'web' | 'mobile' | 'prototype';
  policyConstraints?: string[];
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    createdBy?: string;
    createdAt?: string;
  };
  createdAt: string;
}

/**
 * Enhanced ApprovalConfirmation for storage
 */
export interface StoredApproval {
  designSystemId: string;
  draftId: string;
  tenantId: string;
  approvalChain: ApprovalRecord[];
  status: 'approved' | 'rejected';
  approvedAt?: string;
  exportTargets?: string[];
}

/**
 * WorkflowStore defines the persistence interface for all workflow operations.
 * Implementations should enforce tenant isolation on every operation.
 */
export interface WorkflowStore {
  // ========== PROMPT STORAGE ==========

  /**
   * Save a new prompt
   */
  savePrompt(prompt: StoredPrompt): Promise<void>;

  /**
   * Retrieve a prompt by ID
   */
  getPrompt(promptId: string, tenantId: string): Promise<StoredPrompt | null>;

  /**
   * List all prompts for a tenant
   */
  listPrompts(tenantId: string): Promise<StoredPrompt[]>;

  // ========== DRAFT STORAGE ==========

  /**
   * Save a new draft
   */
  saveDraft(draft: DesignSystemDraft): Promise<void>;

  /**
   * Retrieve a draft by ID
   */
  getDraft(draftId: string, tenantId: string): Promise<DesignSystemDraft | null>;

  /**
   * Retrieve the latest draft for a prompt
   */
  getDraftByPromptId(promptId: string): Promise<DesignSystemDraft | null>;

  /**
   * List all drafts for a tenant
   */
  listDrafts(tenantId: string): Promise<DesignSystemDraft[]>;

  /**
   * Update an existing draft (for after iterations)
   */
  updateDraft(draft: DesignSystemDraft): Promise<void>;

  // ========== ITERATION STORAGE ==========

  /**
   * Get the next iteration number for a draft
   */
  getNextIterationNumber(draftId: string): Promise<number>;

  /**
   * Save an iteration record
   */
  saveIteration(draftId: string, record: IterationRecord): Promise<void>;

  /**
   * Retrieve all iterations for a draft
   */
  getIterations(draftId: string): Promise<IterationRecord[]>;

  // ========== APPROVAL STORAGE ==========

  /**
   * Save an approval or rejection
   */
  saveApproval(approval: StoredApproval, tenantId: string): Promise<void>;

  /**
   * Retrieve an approval by design system ID
   */
  getApproval(designSystemId: string, tenantId: string): Promise<StoredApproval | null>;

  /**
   * Retrieve the approval chain for a design system
   */
  getApprovalChain(designSystemId: string, tenantId: string): Promise<ApprovalRecord[]>;

  /**
   * List all approved design systems for a tenant
   */
  listApprovedSystems(tenantId: string): Promise<StoredApproval[]>;
}

/**
 * In-memory implementation for testing and development
 */
export class InMemoryWorkflowStore implements WorkflowStore {
  private prompts = new Map<string, StoredPrompt>();
  private drafts = new Map<string, DesignSystemDraft>();
  private iterations = new Map<string, IterationRecord[]>();
  private approvals = new Map<string, StoredApproval>();

  // ========== PROMPT STORAGE ==========

  async savePrompt(prompt: StoredPrompt): Promise<void> {
    this.prompts.set(prompt.id, prompt);
  }

  async getPrompt(promptId: string, tenantId: string): Promise<StoredPrompt | null> {
    const prompt = this.prompts.get(promptId);
    return prompt?.tenantId === tenantId ? prompt || null : null;
  }

  async listPrompts(tenantId: string): Promise<StoredPrompt[]> {
    return Array.from(this.prompts.values()).filter(p => p.tenantId === tenantId);
  }

  // ========== DRAFT STORAGE ==========

  async saveDraft(draft: DesignSystemDraft): Promise<void> {
    this.drafts.set(draft.id, draft);
  }

  async getDraft(draftId: string, tenantId: string): Promise<DesignSystemDraft | null> {
    const draft = this.drafts.get(draftId);
    return draft?.tenantId === tenantId ? draft || null : null;
  }

  async getDraftByPromptId(
    promptId: string
  ): Promise<DesignSystemDraft | null> {
    const drafts = Array.from(this.drafts.values()).filter(
      d => d.promptId === promptId
    );
    return drafts.length > 0 ? drafts[drafts.length - 1] || null : null;
  }

  async listDrafts(tenantId: string): Promise<DesignSystemDraft[]> {
    return Array.from(this.drafts.values()).filter(d => d.tenantId === tenantId);
  }

  async updateDraft(draft: DesignSystemDraft): Promise<void> {
    this.drafts.set(draft.id, draft);
  }

  // ========== ITERATION STORAGE ==========

  async getNextIterationNumber(draftId: string): Promise<number> {
    const iterations = this.iterations.get(draftId) || [];
    return iterations.length + 1;
  }

  async saveIteration(
    draftId: string,
    record: IterationRecord
  ): Promise<void> {
    if (!this.iterations.has(draftId)) {
      this.iterations.set(draftId, []);
    }
    this.iterations.get(draftId)!.push(record);
  }

  async getIterations(draftId: string): Promise<IterationRecord[]> {
    return this.iterations.get(draftId) || [];
  }

  // ========== APPROVAL STORAGE ==========

  async saveApproval(approval: StoredApproval, tenantId: string): Promise<void> {
    if (approval.tenantId !== tenantId) {
      throw new Error('Tenant mismatch');
    }
    this.approvals.set(approval.designSystemId, approval);
  }

  async getApproval(
    designSystemId: string,
    tenantId: string
  ): Promise<StoredApproval | null> {
    const approval = this.approvals.get(designSystemId);
    return approval?.tenantId === tenantId ? approval || null : null;
  }

  async getApprovalChain(designSystemId: string, tenantId: string): Promise<ApprovalRecord[]> {
    const approval = await this.getApproval(designSystemId, tenantId);
    return approval?.approvalChain || [];
  }

  async listApprovedSystems(tenantId: string): Promise<StoredApproval[]> {
    return Array.from(this.approvals.values()).filter(
      a => a.tenantId === tenantId && a.status === 'approved'
    );
  }
}
