# Implementation Guide: Enterprise Prompt-to-Design System

## Overview

This guide provides technical implementation guidance for building the enterprise prompt-to-design system on top of the existing design.md platform. It covers the architecture, integration points, and recommended patterns for each phase.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Playground UI                          │
│                   (Review & Approval)                       │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│              Orchestration Service Layer                     │
│  (Prompt Processing, Draft Generation, Iteration, Export)   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                  Design Core (Shared)                        │
│  Parser, Model, Linter, Validation, Export Formats         │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼────┐          ┌────▼────┐          ┌───▼────┐
    │  CLI   │          │   MCP   │          │  SDK   │
    │        │          │ Server  │          │        │
    └────────┘          └─────────┘          └────────┘
```

### Key Layers

1. **Playground UI** — Web-based review, iteration, and approval interface
2. **Orchestration Service** — Stateful workflow engine that coordinates prompt→draft→approval→export
3. **Design Core** — Existing shared parsing, linting, and validation logic
4. **Integration Points** — CLI, MCP server, SDK for programmatic access

---

## Phase 1: Product Definition and Contracts

### What Was Delivered

- **PHASE_1_CONTRACTS.md** — User journeys, personas, data contracts
- **enterprise-workflow.ts** — TypeScript type definitions for all workflow steps
- **Success Criteria** — Quality, governance, and usability metrics

### Integration Checklist

- [x] Define PromptRequest, DesignSystemDraft, ApprovalRequest types
- [x] Create ValidationReport schema
- [x] Document target personas and user journeys
- [x] Establish success metrics

### Files to Reference

```
docs/PHASE_1_CONTRACTS.md
packages/design-core/src/types/enterprise-workflow.ts
```

---

## Phase 2: Foundation Layer

### Objectives

Build the foundational service layer that coordinates prompt processing, design-system generation, and validation.

### Components to Create

#### 1. **Orchestration Service** (`packages/orchestration/`)
A new package that handles workflow state management and coordination.

```typescript
// packages/orchestration/src/index.ts
export interface OrchestrationService {
  // Prompt Processing
  submitPrompt(request: PromptRequest): Promise<PromptAcknowledgment>;
  getPromptStatus(promptId: string): Promise<PromptAcknowledgment>;
  
  // Draft Management
  getDraft(draftId: string): Promise<DesignSystemDraft>;
  listDrafts(tenantId: string): Promise<DesignSystemDraft[]>;
  
  // Iteration
  submitFeedback(feedback: IterationFeedback): Promise<IterationResult>;
  getIterationHistory(draftId: string): Promise<IterationRecord[]>;
  
  // Approval
  submitApproval(request: ApprovalRequest): Promise<ApprovalConfirmation>;
  
  // Export
  exportDesignSystem(request: ExportRequest): Promise<ExportResult>;
}
```

#### 2. **Validation Pipeline** (extend design-core)
Wrapper around existing linter that produces ValidationReport.

```typescript
// packages/design-core/src/validation/pipeline.ts
export async function validateDesignSystem(
  designSystem: DesignSystemState
): Promise<ValidationReport> {
  // Run linter
  const findings = runLinter(designSystem);
  
  // Check WCAG compliance
  const wcagCompliance = checkWCAGCompliance(designSystem);
  
  // Measure token completeness
  const tokenCompleteness = measureCompleteness(designSystem);
  
  return {
    findings,
    summary: summarizeFindings(findings),
    tokenCompleteness,
    wcagCompliance,
  };
}
```

#### 3. **Storage Abstraction**
Interface for persisting workflow state (drafts, iterations, approvals).

```typescript
// packages/orchestration/src/storage.ts
export interface WorkflowStore {
  // Prompt storage
  savePrompt(request: PromptRequest): Promise<string>;
  getPrompt(promptId: string): Promise<PromptRequest>;
  
  // Draft storage
  saveDraft(draft: DesignSystemDraft): Promise<void>;
  getDraft(draftId: string): Promise<DesignSystemDraft>;
  
  // Approval storage
  saveApproval(confirmation: ApprovalConfirmation): Promise<void>;
  getApprovalChain(designSystemId: string): Promise<ApprovalRecord[]>;
  
  // Iteration history
  saveIteration(record: IterationRecord): Promise<void>;
  getIterations(draftId: string): Promise<IterationRecord[]>;
}
```

### Recommended Implementation Pattern

Use **Drizzle ORM with Neon PostgreSQL** (following the existing Neon integration pattern):

```typescript
// packages/orchestration/src/db/schema.ts
import { pgTable, text, timestamp, uuid, json } from 'drizzle-orm/pg-core';

export const promptsTable = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(),
  prompt: text('prompt').notNull(),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const draftsTable = pgTable('drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').references(() => promptsTable.id),
  tenantId: text('tenant_id').notNull(),
  designSystem: json('design_system').notNull(),
  validationReport: json('validation_report').notNull(),
  version: text('version').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const approvalsTable = pgTable('approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  designSystemId: uuid('design_system_id').notNull(),
  draftId: uuid('draft_id').references(() => draftsTable.id),
  tenantId: text('tenant_id').notNull(),
  approvalChain: json('approval_chain'),
  status: text('status').notNull(), // 'approved' | 'rejected'
  approvedAt: timestamp('approved_at'),
});
```

### Integration with Existing Layers

**Design Core Integration**:
```typescript
// In orchestration service
import { ParserHandler } from '@scalify/design-core/parser';
import { ModelHandler } from '@scalify/design-core/model';
import { lint } from '@scalify/design-core/linter';

async function generateDraft(prompt: PromptRequest): Promise<DesignSystemDraft> {
  // 1. Call AI to generate DESIGN.md from prompt (Phase 3)
  const designMdContent = await generateDesignMd(prompt);
  
  // 2. Parse using existing parser
  const parser = new ParserHandler();
  const parseResult = parser.execute({ content: designMdContent });
  
  // 3. Build model
  const model = new ModelHandler();
  const modelResult = model.execute(parseResult.data);
  
  // 4. Validate
  const report = lint(modelResult.designSystem);
  
  return {
    id: generateId(),
    promptId: prompt.id,
    designSystem: modelResult.designSystem,
    validationReport: validateAndTransform(report),
    createdAt: new Date().toISOString(),
  };
}
```

**Playground Integration**:
```typescript
// In playground server routes
import type { OrchestrationService } from '@scalify/orchestration';

export async function POST /api/workflows/prompt {
  const request = await readBody<PromptRequest>();
  const ack = await orchestration.submitPrompt(request);
  return json(ack);
}

export async function GET /api/workflows/draft/:draftId {
  const draft = await orchestration.getDraft(draftId);
  return json(draft);
}
```

---

## Phase 3: Prompt-to-Design Orchestration

### Objectives

Implement the AI-powered pipeline that transforms prompts into structured design systems.

### Components to Create

#### 1. **Prompt Understanding Module**
Analyze and enrich prompts to extract actionable constraints.

```typescript
// packages/ai-orchestration/src/prompt-analyzer.ts
export interface PromptAnalysis {
  intentions: string[];        // e.g., ['minimalist', 'data-driven']
  constraints: string[];       // e.g., ['WCAG AAA', 'dark mode']
  targetPlatforms: string[];  // e.g., ['web', 'mobile']
  brandValues: string[];      // e.g., ['sophisticated', 'trustworthy']
  colorPreferences: string[]; // e.g., ['monochrome', 'vibrant']
}

export async function analyzePrompt(
  prompt: PromptRequest
): Promise<PromptAnalysis> {
  // Use Claude or GPT to structure the prompt
  const response = await generateText({
    model: 'gpt-4-turbo',
    prompt: `Analyze this design prompt and extract structured insights...`,
  });
  
  return parseAnalysis(response);
}
```

#### 2. **Design System Generation**
Generate DESIGN.md from analyzed prompt + context.

```typescript
// packages/ai-orchestration/src/generator.ts
export async function generateDesignSystemDraft(
  analysis: PromptAnalysis,
  context?: { existingSystem?: DesignSystemState }
): Promise<string> {
  // Build generation prompt with design.md spec
  const spec = await loadDesignMdSpec();
  
  const response = await generateText({
    model: 'gpt-4-turbo',
    system: `You are an expert design system generator. Follow the DESIGN.md spec exactly...`,
    messages: [
      { role: 'user', content: buildGenerationPrompt(analysis, spec, context) }
    ],
  });
  
  return response.text;
}
```

#### 3. **Iterative Refinement**
Update design systems based on feedback.

```typescript
// packages/ai-orchestration/src/refiner.ts
export async function refineDesignSystem(
  currentSystem: DesignSystemState,
  feedback: IterationFeedback
): Promise<string> {
  const response = await generateText({
    model: 'gpt-4-turbo',
    system: `You are refining a DESIGN.md based on design feedback...`,
    messages: [
      { 
        role: 'user', 
        content: buildRefinementPrompt(currentSystem, feedback) 
      }
    ],
  });
  
  return response.text;
}
```

### Recommended Prompt Engineering

Use few-shot examples in system prompt to guide consistent output:

```typescript
const SYSTEM_PROMPT = `
You are an expert design system generator that creates DESIGN.md files from prompts.

Always:
1. Start with --- frontmatter containing tokens
2. Follow the canonical section order: Overview, Colors, Typography, Layout, Components
3. Use only valid color formats (hex, oklch, rgb)
4. Reference tokens with {colors.primary} syntax
5. Ensure component definitions reference only valid token paths
6. Validate all token references before outputting

Example output structure:
---
name: YourSystemName
colors:
  primary: '#1A1C1E'
  secondary: '#6C7278'
  tertiary: '#B8422E'
  on-primary: '#FFFFFF'
typography:
  h1:
    fontFamily: Public Sans
    fontSize: 3rem
    fontWeight: 700
  body-md:
    fontFamily: Public Sans
    fontSize: 1rem
components:
  button-primary:
    backgroundColor: '{colors.tertiary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.sm}'
    padding: 12px
---

## Overview
[Design rationale...]

## Colors
[Detailed color usage...]
`;
```

---

## Phase 4: Enterprise Controls and Governance

### Objectives

Add multi-tenant support, RBAC, audit logging, and policy enforcement.

### Components to Create

#### 1. **Tenant Isolation**
Ensure data isolation per organization/workspace.

```typescript
// In all storage queries
export async function getDraft(
  draftId: string,
  tenantId: string
): Promise<DesignSystemDraft> {
  return db
    .select()
    .from(draftsTable)
    .where(
      and(
        eq(draftsTable.id, draftId),
        eq(draftsTable.tenantId, tenantId) // Critical: Always filter by tenant
      )
    );
}
```

#### 2. **Role-Based Access Control**
Define roles and permissions.

```typescript
// packages/orchestration/src/rbac.ts
export enum WorkflowRole {
  Admin = 'admin',
  Designer = 'designer',
  Reviewer = 'reviewer',
  Viewer = 'viewer',
}

export const PERMISSIONS: Record<WorkflowRole, string[]> = {
  [WorkflowRole.Admin]: [
    'create_prompt',
    'approve_design_system',
    'manage_policies',
    'view_audit_logs',
  ],
  [WorkflowRole.Designer]: [
    'create_prompt',
    'iterate_draft',
    'export_design_system',
  ],
  [WorkflowRole.Reviewer]: [
    'view_draft',
    'approve_design_system',
  ],
  [WorkflowRole.Viewer]: [
    'view_draft',
    'view_approved_systems',
  ],
};

export async function checkPermission(
  userId: string,
  tenantId: string,
  action: string
): Promise<boolean> {
  const role = await getUserRole(userId, tenantId);
  return PERMISSIONS[role]?.includes(action) ?? false;
}
```

#### 3. **Audit Logging**
Track all workflow actions.

```typescript
// packages/orchestration/src/audit.ts
export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resourceType: 'prompt' | 'draft' | 'approval' | 'export';
  resourceId: string;
  changes?: Record<string, unknown>;
  timestamp: string;
}

export async function logAction(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<void> {
  await db.insert(auditLogsTable).values({
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  });
}
```

#### 4. **Policy Framework**
Enforce brand rules and compliance constraints.

```typescript
// packages/orchestration/src/policies.ts
export interface DesignPolicy {
  id: string;
  tenantId: string;
  name: string;
  rules: PolicyRule[];
}

export interface PolicyRule {
  type: 'color-palette' | 'typography-scale' | 'wcag-level' | 'custom';
  constraint: string;
  enforceable: boolean;
}

export async function validateAgainstPolicies(
  designSystem: DesignSystemState,
  policyIds: string[]
): Promise<PolicyValidationResult> {
  const policies = await getPolicies(policyIds);
  const violations: PolicyViolation[] = [];
  
  for (const policy of policies) {
    for (const rule of policy.rules) {
      const result = await validateRule(designSystem, rule);
      if (!result.passed) {
        violations.push({ policy: policy.name, rule: rule.type, details: result });
      }
    }
  }
  
  return { passed: violations.length === 0, violations };
}
```

---

## Phase 5: Quality, Evaluation, and Adoption

### Objectives

Build evaluation suite, regression tests, and adoption documentation.

### Components to Create

#### 1. **Benchmark Suite**
Test suite for common design-system scenarios.

```typescript
// packages/orchestration/src/__tests__/benchmarks.test.ts
describe('Prompt-to-Design Benchmarks', () => {
  it('should generate minimalist SaaS system with 0 errors', async () => {
    const prompt = "Minimalist SaaS...";
    const draft = await orchestration.submitPrompt({ prompt, tenantId: 'test' });
    
    expect(draft.validationReport.summary.errors).toBe(0);
    expect(draft.validationReport.tokenCompleteness).toBeGreaterThan(80);
    expect(draft.validationReport.wcagCompliance.aa).toBe(true);
  });
  
  it('should maintain consistency across iterations', async () => {
    const draft1 = await generateDraft(prompt1);
    const draft2 = await generateDraft(prompt1);
    
    expect(hashDesignSystem(draft1)).toBe(hashDesignSystem(draft2));
  });
});
```

#### 2. **Regression Tests**
Catch common design-system failures.

```typescript
// packages/orchestration/src/__tests__/regressions.test.ts
describe('Regression Tests', () => {
  it('should not generate missing primary color', async () => {
    // Test that verifies the fix for a known issue
    const draft = await generateDraft('any prompt');
    expect(draft.designSystem.colors.has('primary')).toBe(true);
  });
  
  it('should not create broken token references', async () => {
    const draft = await generateDraft('any prompt');
    const brokenRefs = draft.validationReport.findings.filter(
      f => f.rule === 'broken-ref'
    );
    expect(brokenRefs).toHaveLength(0);
  });
});
```

#### 3. **Adoption Documentation**
Guide teams through implementation.

```
docs/
  ADOPTION.md              — Enterprise rollout steps
  PROMPT_PATTERNS.md       — Best practices for writing prompts
  CUSTOMIZATION.md         — Extending the system with custom rules
  TROUBLESHOOTING.md       — Common issues and solutions
  API_REFERENCE.md         — Orchestration service API docs
```

---

## Testing Strategy

### Unit Tests
- Design-system generation correctness
- Policy validation logic
- Token resolution and references

### Integration Tests
- Full workflow: prompt → draft → approval → export
- Persistence and retrieval
- Multi-tenant isolation

### End-to-End Tests
- CLI commands
- MCP server integration
- Playground workflows

---

## Performance Targets

- **Prompt Submission**: <100ms response time
- **Draft Generation**: <2 minutes for standard prompts
- **Iteration Refinement**: <30 seconds
- **Validation**: <500ms
- **Export**: <1 second

---

## Security Checklist

- [ ] Tenant ID validation on all operations
- [ ] Rate limiting on prompt submission
- [ ] Input sanitization for prompts
- [ ] Token reference validation before generation
- [ ] Audit logging for all state changes
- [ ] Approval chain verification
- [ ] Export audit trail immutability

---

## Next Steps

1. **Complete Phase 2** — Implement orchestration service and storage layer
2. **Validate Storage** — Confirm Neon integration works for workflow state
3. **Build Playground Routes** — Connect UI to orchestration service
4. **Implement Phase 3** — Integrate with AI SDK for prompt→draft generation
5. **Add Tests** — Build comprehensive test suite

---

## References

- [PHASE_1_CONTRACTS.md](./PHASE_1_CONTRACTS.md) — Workflow contracts
- [README.md](../README.md) — DESIGN.md format spec
- [packages/design-core](../packages/design-core) — Shared core functionality
