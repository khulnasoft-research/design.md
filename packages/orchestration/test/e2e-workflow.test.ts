import { describe, it, expect } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import { OrchestrationService } from '../src/service/index.js';
import { InMemoryWorkflowStore } from '../src/storage/index.js';
import { DefaultValidationService } from '../src/validation/index.js';
import { DefaultAIGenerationService } from '@scalify/ai-orchestration/generation';
import { DefaultFeedbackProcessor } from '@scalify/ai-orchestration/feedback';
import { analyzePrompt } from '@scalify/ai-orchestration/analyzer';
import { DefaultVersionManager } from '@scalify/enterprise-controls/versioning';
import type { PromptRequest } from '@scalify/design-core';

/**
 * End-to-end workflow test.
 *
 * Exercises the full prompt → generate → feedback → approve → export pipeline
 * using a mock language model so no real API calls are made.
 */

// ── Mock language model setup ──────────────────────────────────────────────

const MOCK_DESIGN_SYSTEM_JSON = JSON.stringify({
  name: 'Acme Design System',
  description: 'A modern, minimal design system for Acme Corp',
  colors: {
    primary: { hex: '#2563eb', r: 37, g: 99, b: 235 },
    secondary: { hex: '#7c3aed', r: 124, g: 58, b: 237 },
    neutral: { hex: '#6b7280', r: 107, g: 114, b: 128 },
    background: { hex: '#ffffff', r: 255, g: 255, b: 255 },
  },
  typography: {
    heading: {
      fontFamily: 'Inter, sans-serif',
      fontSize: { value: 2, unit: 'rem' },
      fontWeight: 700,
      lineHeight: { value: 1.2, unit: 'ratio' },
    },
    body: {
      fontFamily: 'Inter, sans-serif',
      fontSize: { value: 1, unit: 'rem' },
      fontWeight: 400,
      lineHeight: { value: 1.5, unit: 'ratio' },
    },
  },
  rounded: {
    sm: { value: 0.25, unit: 'rem' },
    md: { value: 0.5, unit: 'rem' },
    lg: { value: 1, unit: 'rem' },
  },
  spacing: {
    xs: { value: 0.25, unit: 'rem' },
    sm: { value: 0.5, unit: 'rem' },
    md: { value: 1, unit: 'rem' },
    lg: { value: 1.5, unit: 'rem' },
    xl: { value: 2, unit: 'rem' },
  },
  components: {
    button: {
      properties: {
        background: 'primary',
        text: 'background',
        radius: 'md',
      },
    },
  },
});

const MOCK_REFINED_DESIGN_SYSTEM_JSON = JSON.stringify({
  colors: {
    primary: { hex: '#1d4ed8', r: 29, g: 78, b: 216 },
    secondary: { hex: '#7c3aed', r: 124, g: 58, b: 237 },
    neutral: { hex: '#6b7280', r: 107, g: 114, b: 128 },
    background: { hex: '#f9fafb', r: 249, g: 250, b: 251 },
  },
  typography: {
    heading: {
      fontFamily: 'Inter, sans-serif',
      fontSize: { value: 2.25, unit: 'rem' },
      fontWeight: 700,
      lineHeight: { value: 1.2, unit: 'ratio' },
    },
    body: {
      fontFamily: 'Inter, sans-serif',
      fontSize: { value: 1, unit: 'rem' },
      fontWeight: 400,
      lineHeight: { value: 1.5, unit: 'ratio' },
    },
  },
  rounded: {
    sm: { value: 0.25, unit: 'rem' },
    md: { value: 0.5, unit: 'rem' },
    lg: { value: 1, unit: 'rem' },
  },
  spacing: {
    xs: { value: 0.25, unit: 'rem' },
    sm: { value: 0.5, unit: 'rem' },
    md: { value: 1, unit: 'rem' },
    lg: { value: 1.5, unit: 'rem' },
    xl: { value: 2, unit: 'rem' },
    '2xl': { value: 3, unit: 'rem' },
  },
  components: {
    button: {
      properties: {
        background: 'primary',
        text: 'background',
        radius: 'lg',
      },
    },
  },
});

function createMockModel(responseJson: string) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: 'text', text: responseJson }],
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: {
        inputTokens: {
          total: 500,
          noCache: undefined,
          cacheRead: undefined,
          cacheWrite: undefined,
        },
        outputTokens: { total: 1500, text: undefined, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}

const TENANT = 'test-tenant';

function createFreshOrchestration(modelJson?: string) {
  const store = new InMemoryWorkflowStore();
  const validation = new DefaultValidationService();
  const model = createMockModel(modelJson ?? MOCK_DESIGN_SYSTEM_JSON);

  const aiGeneration = new DefaultAIGenerationService({ model });
  const feedbackProcessor = new DefaultFeedbackProcessor({
    languageModel: model,
    fallbackPatternMatch: true,
  });
  const versionManager = new DefaultVersionManager();

  const orchestration = new OrchestrationService({
    store,
    validation,
    aiGeneration,
    feedbackProcessor,
    versionManager,
  });

  return { store, orchestration };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('End-to-end workflow', () => {
  it('full pipeline: submit → generate → approve → export', async () => {
    const { orchestration } = createFreshOrchestration();

    // Step 1: Submit prompt → AI generates draft
    const ack = await orchestration.submitPrompt({
      prompt:
        'Create a modern SaaS design system with blue primary color and clean sans-serif typography',
      tenantId: TENANT,
      metadata: { title: 'Acme Design System', createdBy: 'test-user' },
    });

    expect(ack.status).toBe('draft_ready');
    expect(ack.promptId).toBeDefined();

    // Step 2: Verify the draft
    const drafts = await orchestration.listDrafts(TENANT);
    expect(drafts.length).toBe(1);
    const draft = drafts[0];

    expect(draft.designSystem.name).toBe('Acme Design System');
    expect(draft.designSystem.colors.size).toBeGreaterThanOrEqual(3);
    expect(draft.designSystem.typography.size).toBeGreaterThanOrEqual(2);
    expect(draft.designSystem.spacing.size).toBeGreaterThanOrEqual(4);
    expect(draft.designSystem.rounded.size).toBeGreaterThanOrEqual(3);

    // Step 3: Approve the draft
    const approval = await orchestration.submitApproval({
      draftId: draft.id,
      tenantId: TENANT,
      action: 'approve',
      approverNotes: 'Looks great',
      metadata: { approvedBy: 'design-lead' },
    });

    expect(approval.status).toBe('approved');
    expect(approval.designSystemId).toBeDefined();

    // Step 4: Export as tailwind-v4
    const exported = await orchestration.exportDesignSystem({
      designSystemId: approval.designSystemId,
      tenantId: TENANT,
      format: 'tailwind-v4',
    });

    expect(exported.format).toBe('tailwind-v4');
    expect(exported.content).toContain('@theme');
    expect(exported.content.length).toBeGreaterThan(0);

    // Step 5: Export as CSS
    const cssExport = await orchestration.exportDesignSystem({
      designSystemId: approval.designSystemId,
      tenantId: TENANT,
      format: 'css',
    });

    expect(cssExport.format).toBe('css');
    expect(cssExport.content).toContain(':root');
    expect(cssExport.content).toContain('--color-');

    // Step 6: Export as DTCG
    const dtcgExport = await orchestration.exportDesignSystem({
      designSystemId: approval.designSystemId,
      tenantId: TENANT,
      format: 'dtcg',
    });

    expect(dtcgExport.format).toBe('dtcg');
    const parsed = JSON.parse(dtcgExport.content);
    expect(parsed.$schema).toBeDefined();
  });

  it('feedback iteration refines the draft', async () => {
    const refinedModel = createMockModel(MOCK_REFINED_DESIGN_SYSTEM_JSON);
    const { orchestration } = createFreshOrchestration();

    const ack = await orchestration.submitPrompt({
      prompt: 'Blue SaaS design system',
      tenantId: TENANT,
    });
    expect(ack.status).toBe('draft_ready');

    const drafts = await orchestration.listDrafts(TENANT);
    const draftId = drafts[0].id;

    // Create a fresh orchestration with refined model for feedback
    const store2 = new InMemoryWorkflowStore();
    const validation2 = new DefaultValidationService();
    const genModel = createMockModel(MOCK_DESIGN_SYSTEM_JSON);
    const feedbackProcessor = new DefaultFeedbackProcessor({
      languageModel: refinedModel,
      fallbackPatternMatch: true,
    });

    // Need to re-use the same draft, so use the original orchestration
    // but with a different feedback processor. Let's just use pattern-based for simplicity.
    const result = await orchestration.submitFeedback({
      draftId,
      tenantId: TENANT,
      feedback: {
        type: 'refine',
        message: 'Make the primary color darker and increase font sizes',
        targetArea: 'colors.primary',
      },
      proposedChanges: {
        colors: { primary: '#1d4ed8' },
      },
    });

    expect(result.draftId).toBe(draftId);
    expect(result.designSystem.colors.size).toBeGreaterThanOrEqual(3);
    expect(result.changesSummary.changedTokens.length).toBeGreaterThanOrEqual(1);
  });

  it('prompt status reflects workflow state', async () => {
    const { orchestration } = createFreshOrchestration();

    const ack = await orchestration.submitPrompt({
      prompt: 'Minimalist design system',
      tenantId: TENANT,
    });

    const status = await orchestration.getPromptStatus(ack.promptId, TENANT);
    expect(status.status).toBe('draft_ready');
    expect(status.promptId).toBe(ack.promptId);
  });

  it('version history tracks changes after approval', async () => {
    const { orchestration } = createFreshOrchestration();

    const ack = await orchestration.submitPrompt({
      prompt: 'Design system with versioning',
      tenantId: TENANT,
    });

    const drafts = await orchestration.listDrafts(TENANT);
    const approval = await orchestration.submitApproval({
      draftId: drafts[0].id,
      tenantId: TENANT,
      action: 'approve',
      approverNotes: 'Version 1',
    });

    const versions = await orchestration.getVersionHistory(approval.designSystemId);
    expect(versions.length).toBe(1);
    expect(versions[0].metadata.version).toBe('1.0.0');
  });
});

describe('Prompt analysis', () => {
  it('extracts structured insights from a natural language prompt', async () => {
    const analysis = await analyzePrompt({
      prompt:
        'Create a minimalist, clean design system with WCAG AA compliance, keyboard navigation support, and responsive mobile-first layout',
      tenantId: 'test',
      targetScenario: 'mobile',
    });

    expect(analysis.intentions).toContain('minimalist');
    expect(analysis.intentions).toContain('clean');
    expect(analysis.targetPlatforms).toContain('mobile');
    expect(analysis.constraints).toContain('WCAG AA');
    expect(analysis.accessibilityRequirements).toContain('Keyboard navigation');
    expect(analysis.confidence).toBeGreaterThan(0.5);
  });
});
