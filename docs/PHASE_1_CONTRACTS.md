# Phase 1: Product Definition and Contracts

## Executive Summary

This document establishes the canonical user journeys, data contracts, and request/response models for the enterprise prompt-to-design system. The MVP focuses on a production-ready workflow with strong governance, repeatability, and auditability.

---

## Target Personas and Workflows

### 1. Design Lead
**Goal**: Drive design-system strategy and governance for the organization.
- Create design prompts that capture brand vision and constraints
- Review and approve generated design systems before deployment
- Establish organizational policies and approval thresholds
- Audit changes and export decisions for compliance

### 2. Product Designer
**Goal**: Iterate design systems to meet specific product needs.
- Refine generated design systems with targeted feedback
- Experiment with variations for web, mobile, or prototype use cases
- Reference existing design systems to ensure consistency
- Export validated designs for handoff to engineering

### 3. Engineering Handoff
**Goal**: Consume design systems in code and maintain fidelity.
- Access validated design tokens in multiple export formats (Tailwind, CSS, DTCG)
- Reference audit history and approval chain
- Detect design-system breaking changes via diff reports
- Validate components against design rules before use

### 4. Enterprise Admin
**Goal**: Set up and govern the design-system production workflow.
- Configure tenant-aware project scopes and access controls
- Define brand rules, accessibility requirements, and approval policies
- Monitor audit logs for design decisions and exports
- Onboard teams and track adoption metrics

---

## Core User Journey

```
PROMPT → DRAFT → REVIEW → APPROVE → EXPORT → USE
```

### Step 1: Enter a Prompt
**User**: Design Lead or Product Designer

**Input Contract**:
```typescript
interface PromptRequest {
  // Required
  prompt: string;                    // The design vision or constraints
  tenantId: string;                  // Org or workspace identifier
  
  // Optional
  projectId?: string;                // Attach to existing project
  contextDesignSystemId?: string;    // Reference existing design system for consistency
  targetScenario?: 'web' | 'mobile' | 'prototype';  // Optimize for this use case
  policyConstraints?: string[];      // Applied brand/compliance rules
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    createdBy?: string;
  };
}
```

**Output Contract**:
```typescript
interface PromptAcknowledgment {
  promptId: string;                  // Unique identifier for this prompt
  timestamp: ISO8601;
  tenantId: string;
  status: 'queued' | 'processing' | 'draft_ready' | 'error';
  estimatedDraftCompletionTime?: number;  // Milliseconds
  message?: string;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}
```

---

### Step 2: Receive a Design-System Draft
**User**: Design Lead or Product Designer (auto-generated, no manual action)

**Output Contract**:
```typescript
interface DesignSystemDraft {
  // Metadata
  id: string;                        // Unique draft identifier
  promptId: string;                  // Reference to originating prompt
  tenantId: string;
  version: string;                   // e.g. "1.0.0-draft"
  createdAt: ISO8601;
  
  // Design System Content (extends ParsedDesignSystem)
  designSystem: {
    name: string;
    description: string;
    colors: Record<string, ColorDef>;
    typography: Record<string, TypographyDef>;
    spacing: Record<string, SpacingDef>;
    rounded?: Record<string, DimensionDef>;
    components?: Record<string, ComponentDef>;
  };
  
  // Validation & Governance
  validationReport: {
    findings: Finding[];             // From linter (errors, warnings, info)
    summary: {
      errors: number;
      warnings: number;
      infos: number;
    };
    tokenCompleteness: number;       // 0-100, % of expected token categories
    wcagCompliance: {
      aa: boolean;
      aaa: boolean;
    };
  };
  
  // Generation Metadata
  generationMetadata?: {
    modelUsed: string;               // e.g. "gpt-4-turbo"
    tokensUsed: number;
    promptHash: string;              // For reproducibility
    generationTime: number;          // Milliseconds
  };
}
```

---

### Step 3: Review and Iterate
**User**: Design Lead or Product Designer

**Input Contract** (Feedback):
```typescript
interface IterationFeedback {
  // Required
  draftId: string;
  tenantId: string;
  
  // Feedback Content
  feedback: {
    type: 'refine' | 'regenerate' | 'reject';
    message: string;               // Designer's feedback or requested changes
    targetArea?: string;           // e.g. 'colors', 'typography', 'components.button'
  };
  
  // Optional
  proposedChanges?: {
    colors?: Record<string, string>;        // Suggested token changes
    typography?: Record<string, Partial<TypographyDef>>;
    components?: Record<string, Partial<ComponentDef>>;
  };
  
  metadata?: {
    reviewedBy?: string;
    notes?: string;
  };
}
```

**Output Contract** (Updated Draft or New Iteration):
```typescript
interface IterationResult {
  // Metadata
  draftId: string;
  iterationNumber: number;          // 1, 2, 3...
  tenantId: string;
  createdAt: ISO8601;
  
  // Updated Design System
  designSystem: DesignSystemState;
  
  // Change Summary
  changesSummary: {
    changedTokens: string[];        // Paths like 'colors.primary'
    addedTokens: string[];
    removedTokens: string[];
    affectedComponents: string[];
  };
  
  // Validation Report
  validationReport: LintReport;
  
  // History Snapshot
  iterationHistory: Array<{
    iterationNumber: number;
    feedback: IterationFeedback;
    designSystem: Partial<DesignSystemState>;
    validationReport: LintReport;
    timestamp: ISO8601;
  }>;
}
```

---

### Step 4: Approve and Lock
**User**: Design Lead (with approval authority)

**Input Contract** (Approval):
```typescript
interface ApprovalRequest {
  // Required
  draftId: string;
  tenantId: string;
  action: 'approve' | 'reject';
  
  // Optional
  approverNotes?: string;
  effectiveDate?: ISO8601;         // When this becomes active (default: now)
  exportTargets?: Array<'web' | 'mobile' | 'prototype' | 'documentation'>;
  
  metadata?: {
    approvedBy?: string;
    approvalContext?: string;      // e.g. "Q4 Brand Refresh"
    complianceSignoff?: string[];  // References to policy compliance
  };
}
```

**Output Contract** (Approval Confirmation):
```typescript
interface ApprovalConfirmation {
  // Metadata
  draftId: string;
  designSystemId: string;          // Final, locked ID (replaces draft ID)
  tenantId: string;
  status: 'approved' | 'rejected';
  timestamp: ISO8601;
  
  // Approval Chain
  approvalChain: Array<{
    user: string;
    action: string;
    timestamp: ISO8601;
    notes?: string;
  }>;
  
  // Locked Design System
  designSystem: DesignSystemState;
  
  // Export Ready
  exportTargets: string[];
  downloadUrl?: string;            // Pre-signed URLs for exports
  exportFormats: {
    format: 'tailwind-v4' | 'tailwind-v3' | 'dtcg' | 'css';
    url: string;
  }[];
}
```

---

### Step 5: Export and Use
**User**: Product Designer or Engineering Handoff

**Input Contract** (Export Request):
```typescript
interface ExportRequest {
  // Required
  designSystemId: string;
  tenantId: string;
  format: 'tailwind-v4' | 'tailwind-v3' | 'dtcg' | 'css';
  
  // Optional
  targetPlatform?: 'web' | 'mobile' | 'prototype';
  includeMetadata?: boolean;
  includeAuditTrail?: boolean;
  
  metadata?: {
    exportedBy?: string;
    exportContext?: string;
    recipientTeam?: string;
  };
}
```

**Output Contract**:
```typescript
interface ExportResult {
  // Metadata
  designSystemId: string;
  exportId: string;
  format: string;
  timestamp: ISO8601;
  
  // Export Content
  content: string;                 // The actual export (JSON, CSS, etc.)
  
  // Audit & Traceability
  auditTrail?: {
    promptId: string;
    iterations: number;
    approvalChain: string[];
    exportedAt: ISO8601;
    exportedBy: string;
  };
  
  // Usage Instructions
  usageGuide?: string;              // Markdown instructions for consuming format
}
```

---

## Success Criteria for MVP

### Quality Metrics
- **Token Completeness**: Generated design systems should have ≥80% of expected token categories
- **WCAG Compliance**: All color/component pairs pass WCAG AA contrast minimums
- **Validation Zero-Errors**: Linted output has zero errors before approval
- **Consistency**: Prompt → Draft fidelity scores ≥85% (validated by design review)

### Governance Metrics
- **Approval Audit Trail**: Every design system has a complete, immutable approval chain
- **Policy Enforcement**: 100% of generated systems checked against defined brand rules
- **Change Traceability**: Every iteration linked to feedback that triggered it
- **Export Versioning**: Every exported artifact is versioned and traceable to source

### Usability Metrics
- **Prompt-to-Draft Time**: <2 minutes for standard prompts
- **Iteration Turnaround**: <30 seconds for feedback-driven refinements
- **One-Click Export**: Export to any target format in single action
- **Review Clarity**: Design systems can be reviewed and approved in <10 minutes by trained users

---

## Data Schema Contracts

### PromptRequest Schema
```typescript
export interface PromptRequest {
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
  };
}
```

### DesignSystemDraft Schema (extends existing DesignSystemState)
```typescript
export interface DesignSystemDraft {
  id: string;
  promptId: string;
  tenantId: string;
  version: string;
  createdAt: ISO8601;
  designSystem: DesignSystemState;
  validationReport: LintReport;
  generationMetadata?: {
    modelUsed: string;
    tokensUsed: number;
    promptHash: string;
    generationTime: number;
  };
}
```

### ApprovalRequest Schema
```typescript
export interface ApprovalRequest {
  draftId: string;
  tenantId: string;
  action: 'approve' | 'reject';
  approverNotes?: string;
  effectiveDate?: ISO8601;
  exportTargets?: Array<'web' | 'mobile' | 'prototype' | 'documentation'>;
  metadata?: {
    approvedBy?: string;
    approvalContext?: string;
    complianceSignoff?: string[];
  };
}
```

### DesignSystemId Schema (locked/published)
```typescript
export interface PublishedDesignSystem {
  id: string;
  tenantId: string;
  name: string;
  version: string;
  designSystem: DesignSystemState;
  promptId: string;
  draftId: string;
  approvalChain: ApprovalRecord[];
  createdAt: ISO8601;
  approvedAt: ISO8601;
  status: 'published' | 'superseded' | 'deprecated';
}
```

---

## Next Steps

- **Phase 2**: Build the orchestration layer that processes PromptRequest through to DesignSystemDraft
- **Phase 3**: Implement the full workflow pipeline with validation and export
- **Phase 4**: Add enterprise controls (RBAC, audit logging, policy hooks)
- **Phase 5**: Build evaluation suite and adoption documentation

---

## Appendix: Example Prompts and Expected Outputs

### Example 1: Minimalist SaaS Brand

**Prompt**:
```
Create a design system for a minimalist productivity SaaS. The brand is
sophisticated, data-driven, and emphasizes clarity over decoration. Use
a monochrome primary palette with a single accent color for actions. 
Typography should be clean and professional. Component states should be
clear and unambiguous. Ensure WCAG AAA compliance for all text.
```

**Expected Draft Output**:
- Colors: 5-7 tokens (black, grays, white, 1-2 accent)
- Typography: 4-6 scale levels (headings, body, captions)
- Components: button, card, input, modal, toast
- Validation: 0 errors, ≤2 warnings (e.g., "consider adding tertiary button")
- WCAG: AAA compliant for all text/background pairs

### Example 2: Vibrant Consumer App

**Prompt**:
```
Design system for a Gen-Z focused social app. Bold, expressive, playful.
Use a vibrant color palette with 5-7 core colors. Support dark mode.
Typography should feel fresh and modern. Include states for interactive
components (hover, active, disabled). Target both web and mobile.
```

**Expected Draft Output**:
- Colors: 7-10 tokens + light/dark mode variants
- Typography: 6-8 scale levels + weight variations
- Components: button (primary, secondary), card, avatar, badge, chip
- Dark Mode: Complete token set with accessible contrast ratios
- Validation: 0 errors, ≤3 warnings (e.g., "light mode contrast near limit")
- WCAG: AA compliant across light and dark modes
