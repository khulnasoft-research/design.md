import { describe, it, expect } from 'vitest'
import { InMemoryApprovalWorkflowStore, DefaultApprovalManager } from './index.js'
import type { ApprovalStep } from './index.js'

const singleStep: ApprovalStep[] = [
  { id: 'step-1', name: 'Design Lead Review', requiredRoles: ['designer_lead'], optional: false, requireAll: true },
]

const multiStep: ApprovalStep[] = [
  { id: 'step-1', name: 'Design Lead Review', requiredRoles: ['designer_lead'], optional: false, requireAll: true },
  { id: 'step-2', name: 'Admin Approval', requiredRoles: ['admin'], optional: false, requireAll: true },
]

describe('InMemoryApprovalWorkflowStore', () => {
  it('creates and retrieves a workflow', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const workflow = await store.createWorkflow({
      name: 'Standard Approval',
      description: 'Standard 1-step approval',
      steps: singleStep,
      isDefault: true,
    })
    expect(workflow.id).toMatch(/^workflow_/)
    const retrieved = await store.getWorkflow(workflow.id)
    expect(retrieved).not.toBeNull()
    expect(retrieved!.name).toBe('Standard Approval')
  })

  it('gets default workflow', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    await store.createWorkflow({
      name: 'Default WF',
      description: 'Default',
      steps: singleStep,
      isDefault: true,
    })
    const wf = await store.getDefaultWorkflow('any-tenant')
    expect(wf).not.toBeNull()
    expect(wf!.name).toBe('Default WF')
  })

  it('lists all workflows', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    await store.createWorkflow({ name: 'WF1', description: 'd1', steps: singleStep, isDefault: false })
    await new Promise((r) => setTimeout(r, 2))
    await store.createWorkflow({ name: 'WF2', description: 'd2', steps: singleStep, isDefault: false })
    const list = await store.listWorkflows('any')
    expect(list.length).toBe(2)
  })

  it('updates a workflow', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const wf = await store.createWorkflow({ name: 'Original', description: 'desc', steps: singleStep, isDefault: false })
    await store.updateWorkflow(wf.id, { name: 'Updated' })
    const retrieved = await store.getWorkflow(wf.id)
    expect(retrieved!.name).toBe('Updated')
  })

  it('deletes a workflow', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const wf = await store.createWorkflow({ name: 'To Delete', description: 'desc', steps: singleStep, isDefault: false })
    await store.deleteWorkflow(wf.id)
    const retrieved = await store.getWorkflow(wf.id)
    expect(retrieved).toBeNull()
  })

  it('creates an approval request', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const req = await store.createApprovalRequest({
      tenantId: 'acme',
      designSystemId: 'ds-1',
      workflowId: 'wf-1',
      requestedBy: 'user-1',
      requestedAt: new Date().toISOString(),
      currentStep: 0,
      approvals: [],
      status: 'pending',
    })
    expect(req.id).toMatch(/^approval_/)
    expect(req.status).toBe('pending')
  })

  it('adds a decision to an approval request', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const req = await store.createApprovalRequest({
      tenantId: 'acme', designSystemId: 'ds-1', workflowId: 'wf-1',
      requestedBy: 'user-1', requestedAt: new Date().toISOString(),
      currentStep: 0, approvals: [], status: 'pending',
    })
    await store.addDecision(req.id, {
      approverId: 'lead-1', decision: 'approved', decidedAt: new Date().toISOString(), stepIndex: 0,
    })
    const retrieved = await store.getApprovalRequest(req.id)
    expect(retrieved!.approvals.length).toBe(1)
    expect(retrieved!.approvals[0].decision).toBe('approved')
  })

  it('gets design system approvals', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    await store.createApprovalRequest({
      tenantId: 'acme', designSystemId: 'ds-1', workflowId: 'wf-1',
      requestedBy: 'u1', requestedAt: new Date().toISOString(),
      currentStep: 0, approvals: [], status: 'pending',
    })
    await new Promise((r) => setTimeout(r, 2))
    await store.createApprovalRequest({
      tenantId: 'acme', designSystemId: 'ds-2', workflowId: 'wf-1',
      requestedBy: 'u1', requestedAt: new Date().toISOString(),
      currentStep: 0, approvals: [], status: 'pending',
    })
    const approvals = await store.getDesignSystemApprovals('ds-1')
    expect(approvals.length).toBe(1)
  })

  it('gets pending approvals for user', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    await store.createApprovalRequest({
      tenantId: 'acme', designSystemId: 'ds-1', workflowId: 'wf-1',
      requestedBy: 'u1', requestedAt: new Date().toISOString(),
      currentStep: 0, approvals: [], status: 'pending',
    })
    const pending = await store.getPendingApprovalsForUser('lead-1', 'acme')
    expect(pending.length).toBe(1)
  })
})

describe('DefaultApprovalManager', () => {
  it('submits for approval with default workflow', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const manager = new DefaultApprovalManager(store)
    await store.createWorkflow({ name: 'Default', description: 'd', steps: singleStep, isDefault: true })
    const request = await manager.submitForApproval('ds-1', 'acme', 'user-1')
    expect(request.status).toBe('pending')
    expect(request.designSystemId).toBe('ds-1')
  })

  it('throws when no workflow exists', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const manager = new DefaultApprovalManager(store)
    await expect(manager.submitForApproval('ds-1', 'acme', 'user-1')).rejects.toThrow('No approval workflow found')
  })

  it('approves a request and completes single-step workflow', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const manager = new DefaultApprovalManager(store)
    const wf = await store.createWorkflow({ name: 'Simple', description: 'd', steps: singleStep, isDefault: true })
    const request = await manager.submitForApproval('ds-1', 'acme', 'user-1', wf.id)
    const approved = await manager.approve(request.id, 'lead-1', 'Looks good')
    expect(approved.status).toBe('approved')
  })

  it('rejects a request', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const manager = new DefaultApprovalManager(store)
    const wf = await store.createWorkflow({ name: 'Simple', description: 'd', steps: singleStep, isDefault: true })
    const request = await manager.submitForApproval('ds-1', 'acme', 'user-1', wf.id)
    const rejected = await manager.reject(request.id, 'lead-1', 'Not ready')
    expect(rejected.status).toBe('rejected')
  })

  it('requests changes and resets to step 0', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const manager = new DefaultApprovalManager(store)
    const wf = await store.createWorkflow({ name: 'Multi', description: 'd', steps: multiStep, isDefault: true })
    const request = await manager.submitForApproval('ds-1', 'acme', 'user-1', wf.id)
    await manager.approve(request.id, 'lead-1', 'Step 1 ok')
    const changed = await manager.requestChanges(request.id, 'lead-1', 'Needs redesign')
    expect(changed.status).toBe('pending')
    expect(changed.currentStep).toBe(0)
  })

  it('progresses through multi-step workflow', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const manager = new DefaultApprovalManager(store)
    const wf = await store.createWorkflow({ name: 'Multi', description: 'd', steps: multiStep, isDefault: true })
    const request = await manager.submitForApproval('ds-1', 'acme', 'user-1', wf.id)
    await manager.approve(request.id, 'lead-1', 'Design approved')
    const finalApproval = await manager.approve(request.id, 'admin-1', 'Final approval')
    expect(finalApproval.status).toBe('approved')
  })

  it('gets status of approval request', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const manager = new DefaultApprovalManager(store)
    const wf = await store.createWorkflow({ name: 'Test', description: 'd', steps: singleStep, isDefault: true })
    const request = await manager.submitForApproval('ds-1', 'acme', 'user-1', wf.id)
    const status = await manager.getStatus(request.id)
    expect(status).not.toBeNull()
    expect(status!.id).toBe(request.id)
  })

  it('gets pending approvals for user', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const manager = new DefaultApprovalManager(store)
    const wf = await store.createWorkflow({ name: 'Test', description: 'd', steps: singleStep, isDefault: true })
    await manager.submitForApproval('ds-1', 'acme', 'user-1', wf.id)
    const pending = await manager.getPendingApprovals('lead-1', 'acme')
    expect(pending.length).toBe(1)
  })

  it('checks if request is expired', async () => {
    const store = new InMemoryApprovalWorkflowStore()
    const manager = new DefaultApprovalManager(store)
    const wf = await store.createWorkflow({
      name: 'Test', description: 'd', steps: singleStep, isDefault: true, sla: -1,
    })
    const request = await manager.submitForApproval('ds-1', 'acme', 'user-1', wf.id)
    const expired = await manager.checkExpired(request.id)
    expect(expired).toBe(true)
  })

  it('throws on approve for non-existent request', async () => {
    const manager = new DefaultApprovalManager()
    await expect(manager.approve('nonexistent', 'user-1')).rejects.toThrow('Approval request not found')
  })

  it('throws on reject for non-existent request', async () => {
    const manager = new DefaultApprovalManager()
    await expect(manager.reject('nonexistent', 'user-1', 'no')).rejects.toThrow('Approval request not found')
  })

  it('throws on requestChanges for non-existent request', async () => {
    const manager = new DefaultApprovalManager()
    await expect(manager.requestChanges('nonexistent', 'user-1', 'fix it')).rejects.toThrow(
      'Approval request not found'
    )
  })

  it('creates its own InMemoryApprovalWorkflowStore by default', async () => {
    const manager = new DefaultApprovalManager()
    expect(manager).toBeInstanceOf(DefaultApprovalManager)
  })
})
