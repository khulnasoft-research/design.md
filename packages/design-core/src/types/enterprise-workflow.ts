/**
 * Enterprise Prompt-to-Design System Workflow Types
 * 
 * Defines the canonical data contracts for:
 * - Prompt intake
 * - Draft generation
 * - Iteration and refinement
 * - Approval workflow
 * - Export and usage
 */

import type { DesignSystemState } from '../model/spec.js';
import type { Finding } from '../model/spec.js';

// ============================================================================
// PROMPT INTAKE
// ============================================================================

export interface PromptRequest {
  /** The design vision, constraints, or instructions */
  prompt: string;
  
  /** Organization or workspace identifier */
  tenantId: string;
  
  /** Attach to an existing project (optional) */
  projectId?: string;
  
  /** Reference an existing design system for consistency (optional) */
  contextDesignSystemId?: string;
  
  /** Optimize the design system for this use case */
  targetScenario?: 'web' | 'mobile' | 'prototype';
  
  /** Brand rules, compliance constraints, or policies to enforce */
  policyConstraints?: string[];
  
  /** Additional metadata */
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    createdBy?: string;
    createdAt?: string;
  };
}

export interface PromptAcknowledgment {
  /** Unique identifier for this prompt */
  promptId: string;
  
  /** ISO8601 timestamp */
  timestamp: string;
  
  /** Tenant identifier */
  tenantId: string;
  
  /** Current status of the prompt processing */
  status: 'queued' | 'processing' | 'draft_ready' | 'error';
  
  /** Estimated time to draft completion in milliseconds */
  estimatedDraftCompletionTime?: number;
  
  /** Status message or error description */
  message?: string;
  
  /** Error details if status is 'error' */
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}

// ============================================================================
// DESIGN SYSTEM DRAFT
// ============================================================================

export interface DesignSystemDraft {
  /** Unique draft identifier */
  id: string;
  
  /** Reference to the originating prompt */
  promptId: string;
  
  /** Tenant identifier */
  tenantId: string;
  
  /** Semantic version of the draft (e.g., "1.0.0-draft") */
  version: string;
  
  /** ISO8601 creation timestamp */
  createdAt: string;
  
  /** The generated design system content */
  designSystem: DesignSystemState;
  
  /** Validation and compliance report */
  validationReport: ValidationReport;
  
  /** Generation metadata for reproducibility and debugging */
  generationMetadata?: {
    /** Model used for generation (e.g., "gpt-4-turbo") */
    modelUsed: string;
    
    /** Number of tokens consumed by the generation */
    tokensUsed: number;
    
    /** Hash of the prompt for reproducibility */
    promptHash: string;
    
    /** Time taken to generate in milliseconds */
    generationTime: number;
  };
}

// ============================================================================
// VALIDATION REPORT
// ============================================================================

export interface ValidationReport {
  /** Linter findings (errors, warnings, info) */
  findings: Finding[];
  
  /** Summary counts */
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  
  /** Percentage completeness of token categories (0-100) */
  tokenCompleteness: number;
  
  /** WCAG compliance status */
  wcagCompliance: {
    /** Passes WCAG AA minimum contrast ratios */
    aa: boolean;
    
    /** Passes WCAG AAA enhanced contrast ratios */
    aaa: boolean;
  };
}

// ============================================================================
// ITERATION AND REFINEMENT
// ============================================================================

export interface IterationFeedback {
  /** Draft identifier being refined */
  draftId: string;
  
  /** Tenant identifier */
  tenantId: string;
  
  /** Feedback content and action */
  feedback: {
    /** Type of feedback action */
    type: 'refine' | 'regenerate' | 'reject';
    
    /** Designer's feedback or requested changes */
    message: string;
    
    /** Specific area to target (e.g., 'colors', 'typography', 'components.button') */
    targetArea?: string;
  };
  
  /** Proposed changes to apply */
  proposedChanges?: {
    colors?: Record<string, string>;
    typography?: Record<string, Record<string, unknown>>;
    components?: Record<string, Record<string, unknown>>;
  };
  
  /** Additional metadata */
  metadata?: {
    reviewedBy?: string;
    notes?: string;
  };
}

export interface IterationResult {
  /** Draft identifier */
  draftId: string;
  
  /** Iteration number (1, 2, 3...) */
  iterationNumber: number;
  
  /** Tenant identifier */
  tenantId: string;
  
  /** ISO8601 creation timestamp */
  createdAt: string;
  
  /** Updated design system state */
  designSystem: DesignSystemState;
  
  /** Summary of what changed */
  changesSummary: {
    changedTokens: string[];
    addedTokens: string[];
    removedTokens: string[];
    affectedComponents: string[];
  };
  
  /** Updated validation report */
  validationReport: ValidationReport;
  
  /** Full iteration history */
  iterationHistory: IterationRecord[];
}

export interface IterationRecord {
  /** Iteration sequence number */
  iterationNumber: number;
  
  /** The feedback that triggered this iteration */
  feedback: IterationFeedback;
  
  /** Design system state after this iteration */
  designSystem: Partial<DesignSystemState>;
  
  /** Validation report for this iteration */
  validationReport: ValidationReport;
  
  /** ISO8601 timestamp */
  timestamp: string;
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

export interface ApprovalRequest {
  /** Draft identifier being approved */
  draftId: string;
  
  /** Tenant identifier */
  tenantId: string;
  
  /** Action to take */
  action: 'approve' | 'reject';
  
  /** Notes from the approver */
  approverNotes?: string;
  
  /** When this design system becomes effective */
  effectiveDate?: string;
  
  /** Export targets for this design system */
  exportTargets?: Array<'web' | 'mobile' | 'prototype' | 'documentation'>;
  
  /** Additional metadata */
  metadata?: {
    approvedBy?: string;
    approvalContext?: string;
    complianceSignoff?: string[];
  };
}

export interface ApprovalConfirmation {
  /** Original draft identifier */
  draftId: string;
  
  /** Final, locked design system identifier */
  designSystemId: string;
  
  /** Tenant identifier */
  tenantId: string;
  
  /** Approval status */
  status: 'approved' | 'rejected';
  
  /** ISO8601 approval timestamp */
  timestamp: string;
  
  /** Complete approval chain */
  approvalChain: ApprovalRecord[];
  
  /** Locked design system */
  designSystem: DesignSystemState;
  
  /** Available export targets */
  exportTargets: string[];
  
  /** Pre-signed URLs for exports */
  exportFormats: {
    format: 'tailwind-v4' | 'tailwind-v3' | 'dtcg' | 'css';
    url: string;
  }[];
}

export interface ApprovalRecord {
  /** User who performed the action */
  user: string;
  
  /** Action taken (e.g., 'reviewed', 'approved', 'rejected') */
  action: string;
  
  /** ISO8601 timestamp */
  timestamp: string;
  
  /** Optional notes */
  notes?: string;
}

// ============================================================================
// PUBLISHED DESIGN SYSTEM
// ============================================================================

export interface PublishedDesignSystem {
  /** Unique design system identifier */
  id: string;
  
  /** Tenant identifier */
  tenantId: string;
  
  /** Human-readable name */
  name: string;
  
  /** Semantic version */
  version: string;
  
  /** The locked design system content */
  designSystem: DesignSystemState;
  
  /** Reference to originating prompt */
  promptId: string;
  
  /** Reference to the draft */
  draftId: string;
  
  /** Complete approval chain */
  approvalChain: ApprovalRecord[];
  
  /** ISO8601 creation timestamp */
  createdAt: string;
  
  /** ISO8601 approval timestamp */
  approvedAt: string;
  
  /** Publication status */
  status: 'published' | 'superseded' | 'deprecated';
}

// ============================================================================
// EXPORT
// ============================================================================

export interface ExportRequest {
  /** Design system identifier */
  designSystemId: string;
  
  /** Tenant identifier */
  tenantId: string;
  
  /** Target export format */
  format: 'tailwind-v4' | 'tailwind-v3' | 'dtcg' | 'css';
  
  /** Optimize for this platform */
  targetPlatform?: 'web' | 'mobile' | 'prototype';
  
  /** Include metadata in the export */
  includeMetadata?: boolean;
  
  /** Include audit trail in the export */
  includeAuditTrail?: boolean;
  
  /** Export metadata */
  metadata?: {
    exportedBy?: string;
    exportContext?: string;
    recipientTeam?: string;
  };
}

export interface WorkflowExportResult {
  /** Design system identifier */
  designSystemId: string;
  
  /** Unique export identifier */
  exportId: string;
  
  /** Export format */
  format: string;
  
  /** ISO8601 export timestamp */
  timestamp: string;
  
  /** The exported content */
  content: string;
  
  /** Audit trail if requested */
  auditTrail?: {
    promptId: string;
    iterationCount: number;
    approvalChain: string[];
    exportedAt: string;
    exportedBy: string;
  };
  
  /** Usage instructions for the export format */
  usageGuide?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type WorkflowStep = 'prompt' | 'draft' | 'iteration' | 'approval' | 'export';

export interface WorkflowState {
  currentStep: WorkflowStep;
  tenantId: string;
  promptId: string;
  draftId?: string;
  designSystemId?: string;
  metadata: Record<string, unknown>;
}

export interface WorkflowError {
  code: string;
  message: string;
  step: WorkflowStep;
  recoverable: boolean;
  details?: Record<string, unknown>;
}
