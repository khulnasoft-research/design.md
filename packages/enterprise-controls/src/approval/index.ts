/**
 * Approval Workflows
 *
 * Manages design system approval processes with configurable routing,
 * multi-level approvals, and compliance tracking.
 */

/**
 * Approval step in a workflow
 */
export interface ApprovalStep {
  /** Step ID */
  id: string;
  /** Step name */
  name: string;
  /** Required role(s) for approval */
  requiredRoles: string[];
  /** Is this step optional? */
  optional: boolean;
  /** Should all approvers approve or just one? */
  requireAll: boolean;
  /** Notification message */
  notificationMessage?: string;
}

/**
 * Approval workflow definition
 */
export interface ApprovalWorkflow {
  /** Workflow ID */
  id: string;
  /** Workflow name */
  name: string;
  /** Workflow description */
  description: string;
  /** Approval steps in order */
  steps: ApprovalStep[];
  /** SLA (hours) for approval */
  sla?: number;
  /** Is this the default workflow? */
  isDefault: boolean;
}

/**
 * Approval request
 */
export interface ApprovalRequest {
  /** Unique request ID */
  id: string;
  /** Tenant ID */
  tenantId: string;
  /** Design system ID being approved */
  designSystemId: string;
  /** Workflow being used */
  workflowId: string;
  /** Who requested approval */
  requestedBy: string;
  /** Request timestamp */
  requestedAt: string;
  /** Current step index */
  currentStep: number;
  /** Approval history */
  approvals: ApprovalDecision[];
  /** Overall status */
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  /** When request expires (SLA deadline) */
  expiresAt?: string;
}

/**
 * Approval decision
 */
export interface ApprovalDecision {
  /** Approver user ID */
  approverId: string;
  /** Decision */
  decision: 'approved' | 'rejected' | 'needs-changes';
  /** Comments */
  comments?: string;
  /** Timestamp */
  decidedAt: string;
  /** Approval step index */
  stepIndex: number;
}

/**
 * Approval workflow store interface
 */
export interface ApprovalWorkflowStore {
  /** Create a workflow */
  createWorkflow(workflow: Omit<ApprovalWorkflow, 'id'>): Promise<ApprovalWorkflow>;

  /** Get workflow by ID */
  getWorkflow(id: string): Promise<ApprovalWorkflow | null>;

  /** Get default workflow for tenant */
  getDefaultWorkflow(tenantId: string): Promise<ApprovalWorkflow | null>;

  /** List all workflows for tenant */
  listWorkflows(tenantId: string): Promise<ApprovalWorkflow[]>;

  /** Update workflow */
  updateWorkflow(id: string, updates: Partial<ApprovalWorkflow>): Promise<void>;

  /** Delete workflow */
  deleteWorkflow(id: string): Promise<void>;

  /** Create approval request */
  createApprovalRequest(request: Omit<ApprovalRequest, 'id'>): Promise<ApprovalRequest>;

  /** Get approval request */
  getApprovalRequest(id: string): Promise<ApprovalRequest | null>;

  /** Add approval decision */
  addDecision(requestId: string, decision: ApprovalDecision): Promise<void>;

  /** Get approval requests for a design system */
  getDesignSystemApprovals(designSystemId: string): Promise<ApprovalRequest[]>;

  /** Get pending approvals for a user */
  getPendingApprovalsForUser(userId: string, tenantId: string): Promise<ApprovalRequest[]>;
}

/**
 * Approval manager interface
 */
export interface ApprovalManager {
  /** Submit design system for approval */
  submitForApproval(
    designSystemId: string,
    tenantId: string,
    requestedBy: string,
    workflowId?: string
  ): Promise<ApprovalRequest>;

  /** Approve a design system (move to next step or complete) */
  approve(requestId: string, approverId: string, comments?: string): Promise<ApprovalRequest>;

  /** Reject a design system */
  reject(requestId: string, approverId: string, reason: string): Promise<ApprovalRequest>;

  /** Request changes (send back to designer) */
  requestChanges(requestId: string, approverId: string, feedback: string): Promise<ApprovalRequest>;

  /** Get current approval status */
  getStatus(requestId: string): Promise<ApprovalRequest | null>;

  /** Get pending approvals for user */
  getPendingApprovals(userId: string, tenantId: string): Promise<ApprovalRequest[]>;

  /** Check if approval is expired */
  checkExpired(requestId: string): Promise<boolean>;
}

/**
 * Default in-memory approval workflow store
 */
export class InMemoryApprovalWorkflowStore implements ApprovalWorkflowStore {
  private workflows: Map<string, ApprovalWorkflow> = new Map();
  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  private defaultWorkflows: Map<string, string> = new Map();

  async createWorkflow(workflow: Omit<ApprovalWorkflow, 'id'>): Promise<ApprovalWorkflow> {
    const id = `workflow_${Date.now()}`;
    const newWorkflow: ApprovalWorkflow = { ...workflow, id };
    this.workflows.set(id, newWorkflow);

    if (workflow.isDefault) {
      this.defaultWorkflows.set(workflow.name, id);
    }

    return newWorkflow;
  }

  async getWorkflow(id: string): Promise<ApprovalWorkflow | null> {
    return this.workflows.get(id) || null;
  }

  async getDefaultWorkflow(tenantId: string): Promise<ApprovalWorkflow | null> {
    const defaultId = this.defaultWorkflows.get(tenantId);
    if (defaultId) {
      return this.workflows.get(defaultId) || null;
    }
    // Return first default workflow
    for (const workflow of this.workflows.values()) {
      if (workflow.isDefault) {
        return workflow;
      }
    }
    return null;
  }

  async listWorkflows(_tenantId: string): Promise<ApprovalWorkflow[]> {
    return Array.from(this.workflows.values());
  }

  async updateWorkflow(id: string, updates: Partial<ApprovalWorkflow>): Promise<void> {
    const workflow = this.workflows.get(id);
    if (workflow) {
      this.workflows.set(id, { ...workflow, ...updates });
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    this.workflows.delete(id);
  }

  async createApprovalRequest(request: Omit<ApprovalRequest, 'id'>): Promise<ApprovalRequest> {
    const id = `approval_${Date.now()}`;
    const newRequest: ApprovalRequest = { ...request, id };
    this.approvalRequests.set(id, newRequest);
    return newRequest;
  }

  async getApprovalRequest(id: string): Promise<ApprovalRequest | null> {
    return this.approvalRequests.get(id) || null;
  }

  async addDecision(requestId: string, decision: ApprovalDecision): Promise<void> {
    const request = this.approvalRequests.get(requestId);
    if (request) {
      request.approvals.push(decision);
    }
  }

  async getDesignSystemApprovals(designSystemId: string): Promise<ApprovalRequest[]> {
    return Array.from(this.approvalRequests.values()).filter(
      (req) => req.designSystemId === designSystemId
    );
  }

  async getPendingApprovalsForUser(userId: string, _tenantId: string): Promise<ApprovalRequest[]> {
    return Array.from(this.approvalRequests.values()).filter(
      (req) =>
        req.tenantId === _tenantId &&
        req.status === 'pending' &&
        !req.approvals.some((a) => a.approverId === userId)
    );
  }
}

/**
 * Default approval manager implementation
 */
export class DefaultApprovalManager implements ApprovalManager {
  private store: ApprovalWorkflowStore;

  constructor(store: ApprovalWorkflowStore = new InMemoryApprovalWorkflowStore()) {
    this.store = store;
  }

  async submitForApproval(
    designSystemId: string,
    tenantId: string,
    requestedBy: string,
    workflowId?: string
  ): Promise<ApprovalRequest> {
    // Get workflow
    let workflow = workflowId
      ? await this.store.getWorkflow(workflowId)
      : await this.store.getDefaultWorkflow(tenantId);

    if (!workflow) {
      throw new Error('No approval workflow found');
    }

    // Calculate expiry
    const expiresAt = workflow.sla
      ? new Date(Date.now() + workflow.sla * 60 * 60 * 1000).toISOString()
      : undefined;

    return this.store.createApprovalRequest({
      tenantId,
      designSystemId,
      workflowId: workflow.id,
      requestedBy,
      requestedAt: new Date().toISOString(),
      currentStep: 0,
      approvals: [],
      status: 'pending',
      expiresAt,
    });
  }

  async approve(
    requestId: string,
    approverId: string,
    comments?: string
  ): Promise<ApprovalRequest> {
    const request = await this.store.getApprovalRequest(requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    const workflow = await this.store.getWorkflow(request.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${request.workflowId}`);
    }

    // Add decision
    const decision: ApprovalDecision = {
      approverId,
      decision: 'approved',
      comments,
      decidedAt: new Date().toISOString(),
      stepIndex: request.currentStep,
    };

    await this.store.addDecision(requestId, decision);

    // Check if we can move to next step
    const currentStep = workflow.steps[request.currentStep];
    if (!currentStep) {
      throw new Error('Invalid step index');
    }

    // Determine if step is complete
    const stepApprovals = request.approvals.filter((a) => a.stepIndex === request.currentStep);
    const stepComplete = currentStep.requireAll
      ? stepApprovals.length >= currentStep.requiredRoles.length
      : stepApprovals.length >= 1;

    if (stepComplete) {
      request.currentStep += 1;

      // Check if all steps are complete
      if (request.currentStep >= workflow.steps.length) {
        request.status = 'approved';
      }
    }

    return request;
  }

  async reject(requestId: string, approverId: string, reason: string): Promise<ApprovalRequest> {
    const request = await this.store.getApprovalRequest(requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    const decision: ApprovalDecision = {
      approverId,
      decision: 'rejected',
      comments: reason,
      decidedAt: new Date().toISOString(),
      stepIndex: request.currentStep,
    };

    await this.store.addDecision(requestId, decision);
    request.status = 'rejected';

    return request;
  }

  async requestChanges(
    requestId: string,
    approverId: string,
    feedback: string
  ): Promise<ApprovalRequest> {
    const request = await this.store.getApprovalRequest(requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    const decision: ApprovalDecision = {
      approverId,
      decision: 'needs-changes',
      comments: feedback,
      decidedAt: new Date().toISOString(),
      stepIndex: request.currentStep,
    };

    await this.store.addDecision(requestId, decision);
    // Reset to beginning when changes are needed
    request.currentStep = 0;

    return request;
  }

  async getStatus(requestId: string): Promise<ApprovalRequest | null> {
    return this.store.getApprovalRequest(requestId);
  }

  async getPendingApprovals(userId: string, tenantId: string): Promise<ApprovalRequest[]> {
    return this.store.getPendingApprovalsForUser(userId, tenantId);
  }

  async checkExpired(requestId: string): Promise<boolean> {
    const request = await this.store.getApprovalRequest(requestId);
    if (!request || !request.expiresAt) {
      return false;
    }

    const isExpired = new Date(request.expiresAt) < new Date();
    if (isExpired && request.status === 'pending') {
      request.status = 'expired';
      await this.store.updateWorkflow(request.workflowId, {});
    }

    return isExpired;
  }
}
