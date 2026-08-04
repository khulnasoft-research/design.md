# Phase 2: Foundation Layer

## Overview

Phase 2 establishes the foundational orchestration service and storage layer that coordinates the entire prompt-to-design workflow. This phase focuses on building robust, testable abstractions that can be extended with enterprise features in later phases.

---

## What Was Delivered

### 1. **Orchestration Service** (`packages/orchestration/src/service/`)

The central hub for all workflow operations. Implements the business logic for:
- Prompt submission and status tracking
- Draft generation coordination
- Iteration and refinement management
- Approval workflows
- Design-system export

```typescript
// Core service interface
export class OrchestrationService {
  async submitPrompt(request: PromptRequest): Promise<PromptAcknowledgment>;
  async getDraft(draftId: string, tenantId: string): Promise<DesignSystemDraft>;
  async submitFeedback(feedback: IterationFeedback): Promise<IterationResult>;
  async submitApproval(request: ApprovalRequest): Promise<ApprovalConfirmation>;
  async exportDesignSystem(request: ExportRequest): Promise<ExportResult>;
}
```

**Key Design Decisions**:
- Service is stateless; all state is persisted via WorkflowStore
- Methods are async to support integration with external systems (AI, storage)
- Tenant ID is required on all operations for security
- Returns standardized contract types from enterprise-workflow.ts

### 2. **Storage Abstraction** (`packages/orchestration/src/storage/`)

Interface-based storage layer with in-memory implementation for testing.

```typescript
export interface WorkflowStore {
  // Prompt management
  savePrompt(prompt: StoredPrompt): Promise<void>;
  getPrompt(promptId: string, tenantId: string): Promise<StoredPrompt | null>;
  listPrompts(tenantId: string): Promise<StoredPrompt[]>;

  // Draft management
  saveDraft(draft: DesignSystemDraft): Promise<void>;
  getDraft(draftId: string, tenantId: string): Promise<DesignSystemDraft | null>;
  getDraftByPromptId(promptId: string, tenantId: string): Promise<DesignSystemDraft | null>;
  listDrafts(tenantId: string): Promise<DesignSystemDraft[]>;
  updateDraft(draft: DesignSystemDraft): Promise<void>;

  // Iteration management
  getNextIterationNumber(draftId: string, tenantId: string): Promise<number>;
  saveIteration(draftId: string, record: IterationRecord, tenantId: string): Promise<void>;
  getIterations(draftId: string, tenantId: string): Promise<IterationRecord[]>;

  // Approval management
  saveApproval(approval: StoredApproval, tenantId: string): Promise<void>;
  getApproval(designSystemId: string, tenantId: string): Promise<StoredApproval | null>;
  getApprovalChain(designSystemId: string, tenantId: string): Promise<ApprovalRecord[]>;
  listApprovedSystems(tenantId: string): Promise<StoredApproval[]>;
}
```

**Key Features**:
- **Tenant Isolation**: Every operation filters by `tenantId` for security
- **Interface-Based**: Supports multiple backend implementations (PostgreSQL, DynamoDB, etc.)
- **In-Memory Reference**: `InMemoryWorkflowStore` for testing without external dependencies

### 3. **Validation Service** (`packages/orchestration/src/validation/`)

Wraps design-core linting and provides comprehensive validation reports.

```typescript
export interface ValidationService {
  validate(designSystem: DesignSystemState): Promise<ValidationReport>;
}

export class DefaultValidationService implements ValidationService {
  // Runs linter
  // Measures token completeness
  // Checks WCAG compliance
  async validate(designSystem: DesignSystemState): Promise<ValidationReport>;
}
```

**Metrics Tracked**:
- Finding severity counts (errors, warnings, infos)
- Token completeness percentage (0-100%)
- WCAG AA and AAA compliance status

### 4. **Utility Functions** (`packages/orchestration/src/utils.ts`)

Helper functions for IDs, hashing, validation, and extraction:
- `generateId()` — Creates unique workflow identifiers
- `hashDesignSystem()` — Enables reproducibility tracking
- `isValidTenantId()` — Validates tenant ID format
- `isValidPrompt()` — Validates prompt length and content
- `extractIntentions()` — Extracts design intentions from prompts
- `extractConstraints()` — Identifies WCAG, accessibility, mode constraints
- `estimateGenerationTime()` — Predicts draft generation duration

### 5. **Type Definitions** (imported from design-core)

All workflow contracts are exported from `packages/design-core/src/types/enterprise-workflow.ts` and re-exported by orchestration for convenience:

```typescript
export type {
  PromptRequest,
  PromptAcknowledgment,
  DesignSystemDraft,
  ValidationReport,
  IterationFeedback,
  IterationResult,
  IterationRecord,
  ApprovalRequest,
  ApprovalConfirmation,
  ApprovalRecord,
  PublishedDesignSystem,
  ExportRequest,
  ExportResult,
  WorkflowStep,
  WorkflowState,
  WorkflowError,
} from '@scalify/design-core/types';
```

---

## Directory Structure

```
packages/orchestration/
├── src/
│   ├── service/
│   │   └── index.ts          # Main OrchestrationService
│   ├── storage/
│   │   └── index.ts          # WorkflowStore interface + InMemoryWorkflowStore
│   ├── validation/
│   │   └── index.ts          # ValidationService
│   ├── utils.ts              # Utility functions
│   └── index.ts              # Main exports
├── tsconfig.json
├── package.json
└── README.md                 # (To be created)
```

---

## Integration Points

### With Design-Core

The orchestration service coordinates with design-core components:

```typescript
// In orchestration service
import { ParserHandler } from '@scalify/design-core/parser';
import { ModelHandler } from '@scalify/design-core/model';
import { lint } from '@scalify/design-core/linter';

async function generateDraft(prompt: PromptRequest): Promise<DesignSystemDraft> {
  // 1. AI generates DESIGN.md from prompt (Phase 3)
  const designMdContent = await generateDesignMd(prompt);
  
  // 2. Parse with existing parser
  const parser = new ParserHandler();
  const parseResult = parser.execute({ content: designMdContent });
  
  // 3. Build model
  const model = new ModelHandler();
  const modelResult = model.execute(parseResult.data);
  
  // 4. Validate
  const findings = lint(modelResult.designSystem);
  
  // 5. Return draft with validation report
  return {
    id: generateId(),
    promptId: prompt.id,
    designSystem: modelResult.designSystem,
    validationReport: await validation.validate(modelResult.designSystem),
    createdAt: new Date().toISOString(),
  };
}
```

### With Playground

The playground UI will call orchestration service methods via HTTP routes:

```typescript
// In playground server routes
import { OrchestrationService } from '@scalify/orchestration';

export async function POST /api/workflows/prompt {
  const request = await readBody<PromptRequest>();
  const ack = await orchestration.submitPrompt(request);
  return json(ack);
}

export async function POST /api/workflows/:draftId/feedback {
  const feedback = await readBody<IterationFeedback>();
  const result = await orchestration.submitFeedback(feedback);
  return json(result);
}

export async function POST /api/workflows/:draftId/approve {
  const request = await readBody<ApprovalRequest>();
  const confirmation = await orchestration.submitApproval(request);
  return json(confirmation);
}
```

### With CLI

The CLI can use the orchestration service directly or via HTTP:

```typescript
// In CLI
import { OrchestrationService, InMemoryWorkflowStore } from '@scalify/orchestration';

const orchestration = new OrchestrationService({
  store: new InMemoryWorkflowStore(),
  validation: new DefaultValidationService(),
});

export async function promptCommand(args: string[]) {
  const prompt = args.join(' ');
  const ack = await orchestration.submitPrompt({
    prompt,
    tenantId: 'cli-user',
  });
  console.log(`Prompt submitted: ${ack.promptId}`);
}
```

---

## How to Use Phase 2

### 1. Create an Orchestration Service

```typescript
import { 
  OrchestrationService,
  InMemoryWorkflowStore,
  DefaultValidationService,
} from '@scalify/orchestration';

const store = new InMemoryWorkflowStore();
const validation = new DefaultValidationService();

const orchestration = new OrchestrationService({
  store,
  validation,
});
```

### 2. Submit a Prompt

```typescript
const ack = await orchestration.submitPrompt({
  prompt: 'Create a minimalist SaaS design system',
  tenantId: 'my-org',
  targetScenario: 'web',
  metadata: {
    title: 'SaaS Design System v1',
    createdBy: 'user@example.com',
  },
});

console.log(`Draft generation started: ${ack.promptId}`);
console.log(`Status: ${ack.status}`);
console.log(`Estimated time: ${ack.estimatedDraftCompletionTime}ms`);
```

### 3. Get Draft Status

```typescript
const status = await orchestration.getPromptStatus(promptId, tenantId);
if (status.status === 'draft_ready') {
  const draft = await orchestration.getDraft(draftId, tenantId);
  console.log(`Draft tokens: ${draft.designSystem.colors.size} colors`);
  console.log(`Validation: ${draft.validationReport.summary.errors} errors`);
}
```

### 4. Iterate with Feedback

```typescript
const result = await orchestration.submitFeedback({
  draftId,
  tenantId,
  feedback: {
    type: 'refine',
    message: 'Make the accent color more vibrant and add a secondary palette',
    targetArea: 'colors',
  },
});

console.log(`Iteration ${result.iterationNumber} complete`);
console.log(`History: ${result.iterationHistory.length} total iterations`);
```

### 5. Approve and Export

```typescript
const confirmation = await orchestration.submitApproval({
  draftId,
  tenantId,
  action: 'approve',
  approverNotes: 'Approved for production use',
  exportTargets: ['web', 'mobile'],
  metadata: {
    approvedBy: 'design-lead@example.com',
  },
});

console.log(`Design system approved: ${confirmation.designSystemId}`);

// Export to Tailwind v4
const export result = await orchestration.exportDesignSystem({
  designSystemId: confirmation.designSystemId,
  tenantId,
  format: 'tailwind-v4',
});

console.log(export.content); // Tailwind v4 CSS theme
```

---

## Testing Phase 2

### Unit Tests

Test individual service methods with mocked store and validation:

```typescript
describe('OrchestrationService', () => {
  let orchestration: OrchestrationService;
  let store: InMemoryWorkflowStore;
  let validation: MockValidationService;

  beforeEach(() => {
    store = new InMemoryWorkflowStore();
    validation = new MockValidationService();
    orchestration = new OrchestrationService({ store, validation });
  });

  it('should submit a prompt and return acknowledgment', async () => {
    const ack = await orchestration.submitPrompt({
      prompt: 'Test prompt',
      tenantId: 'test-org',
    });

    expect(ack.promptId).toBeDefined();
    expect(ack.status).toBe('queued');
    expect(ack.tenantId).toBe('test-org');
  });

  it('should enforce tenant isolation', async () => {
    const promptId = 'test-prompt-id';
    await store.savePrompt({
      id: promptId,
      prompt: 'Test',
      tenantId: 'org-a',
    });

    const result = await store.getPrompt(promptId, 'org-b');
    expect(result).toBeNull();
  });
});
```

### Integration Tests

Test full workflows:

```typescript
describe('Orchestration Workflows', () => {
  it('should complete full workflow: prompt → draft → feedback → approval', async () => {
    // 1. Submit prompt
    const ack = await orchestration.submitPrompt({
      prompt: 'Minimalist design system',
      tenantId: 'test-org',
    });

    // 2. Simulate draft generation (Phase 3)
    const draftId = generateId();
    await store.saveDraft({
      id: draftId,
      promptId: ack.promptId,
      tenantId: 'test-org',
      version: '1.0.0-draft',
      designSystem: createMockDesignSystem(),
      validationReport: createMockValidationReport(),
      createdAt: new Date().toISOString(),
    });

    // 3. Submit feedback
    const feedbackResult = await orchestration.submitFeedback({
      draftId,
      tenantId: 'test-org',
      feedback: { type: 'refine', message: 'Add vibrant colors' },
    });

    expect(feedbackResult.iterationNumber).toBe(1);

    // 4. Approve
    const confirmation = await orchestration.submitApproval({
      draftId,
      tenantId: 'test-org',
      action: 'approve',
    });

    expect(confirmation.status).toBe('approved');
    expect(confirmation.designSystemId).toBeDefined();
  });
});
```

---

## Performance Targets (Phase 2)

- **Prompt Submission**: <100ms (just storage write)
- **Retrieval**: <50ms per operation
- **Iteration Save**: <200ms
- **Validation**: <500ms (with linting)
- **Approval**: <100ms (just storage write)

---

## Security Checklist

- [x] Tenant ID validation on all storage operations
- [x] Tenant ID filtering on all retrieval operations
- [x] Interface-based storage for implementation flexibility
- [x] Type-safe contract definitions
- [ ] Rate limiting (Phase 4)
- [ ] Audit logging (Phase 4)
- [ ] RBAC enforcement (Phase 4)

---

## Next Steps

1. **Phase 3**: Implement AI-powered prompt-to-DESIGN.md generation
   - Build prompt analyzer
   - Integrate with AI SDK for design system generation
   - Implement iteration refinement loop

2. **Connect Playground**: Wire up playground UI to orchestration service
   - POST `/api/workflows/prompt` — Submit prompts
   - GET `/api/workflows/draft/:draftId` — Get draft status
   - POST `/api/workflows/:draftId/feedback` — Submit iterations
   - POST `/api/workflows/:draftId/approve` — Approve designs
   - GET `/api/export/:designSystemId/:format` — Export designs

3. **Implement Storage Backend**: Replace in-memory with Neon PostgreSQL
   - Define Drizzle schema
   - Implement PostgreSQL WorkflowStore
   - Add connection pooling and migrations

4. **Add Tests**: Build comprehensive test suite
   - Unit tests for each service method
   - Integration tests for full workflows
   - Storage layer tests

---

## Files Created/Modified

**New Files**:
- `packages/orchestration/package.json`
- `packages/orchestration/tsconfig.json`
- `packages/orchestration/src/index.ts`
- `packages/orchestration/src/service/index.ts`
- `packages/orchestration/src/storage/index.ts`
- `packages/orchestration/src/validation/index.ts`
- `packages/orchestration/src/utils.ts`
- `tsconfig.json` (root)

**Modified Files**:
- `packages/design-core/src/types/index.ts` — Exported enterprise-workflow types

**Documentation**:
- `docs/PHASE_2_FOUNDATION.md` — This file
- `docs/PHASE_1_CONTRACTS.md` — Phase 1 contracts (already created)
- `docs/IMPLEMENTATION_GUIDE.md` — Comprehensive implementation guide

---

## References

- [PHASE_1_CONTRACTS.md](./PHASE_1_CONTRACTS.md) — User journeys and data contracts
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) — Full implementation guidance
- [packages/orchestration/](../packages/orchestration/) — Service source code
- [packages/design-core/](../packages/design-core/) — Shared types and utilities
