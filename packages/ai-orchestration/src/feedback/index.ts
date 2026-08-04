import type { LanguageModel } from 'ai';
import { generateObject, jsonSchema } from 'ai';
import type { DesignSystemDraft, IterationFeedback, IterationResult } from '@scalify/design-core';
import type {
  ResolvedColor,
  ResolvedDimension,
  ResolvedTypography,
  ResolvedValue,
  ComponentDef,
  DesignSystemState,
} from '@scalify/design-core';

/**
 * Feedback processing request
 */
export interface FeedbackProcessingRequest {
  /** Current design system draft */
  draft: DesignSystemDraft;

  /** User feedback */
  feedback: IterationFeedback;

  /** Model to use for refinement */
  model: string;

  /** Temperature for generation */
  temperature?: number;

  /** The actual LanguageModel instance to use for generation */
  languageModel?: LanguageModel;
}

/**
 * Feedback processing result
 */
export interface FeedbackProcessingResult {
  /** Updated design system draft */
  updatedDraft: DesignSystemDraft;

  /** Iteration result */
  iterationResult: IterationResult;

  /** Processing metadata */
  metadata: {
    /** ISO timestamp of processing */
    processedAt: string;

    /** Processing time in milliseconds */
    duration: number;

    /** Changes made */
    changes: {
      colorsModified: number;
      typographyModified: number;
      spacingModified: number;
      componentsModified: number;
      componentsAdded: number;
    };

    /** Any notes or warnings */
    notes?: string[];
  };
}

/**
 * Service for processing user feedback and refining design systems
 */
export interface FeedbackProcessor {
  /**
   * Process feedback and return updated draft
   */
  processFeedback(request: FeedbackProcessingRequest): Promise<FeedbackProcessingResult>;
}

// ── JSON Schema for refined output ─────────────────────────────────────────

const REFINED_DESIGN_SCHEMA = jsonSchema<{
  colors: Record<string, { hex: string; r: number; g: number; b: number }>;
  typography: Record<
    string,
    {
      fontFamily?: string;
      fontSize?: { value: number; unit: string };
      fontWeight?: number;
      lineHeight?: { value: number; unit: string };
      letterSpacing?: { value: number; unit: string };
    }
  >;
  rounded: Record<string, { value: number; unit: string }>;
  spacing: Record<string, { value: number; unit: string }>;
  components: Record<string, { properties: Record<string, string> }>;
}>({
  type: 'object',
  properties: {
    colors: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          hex: { type: 'string' },
          r: { type: 'number' },
          g: { type: 'number' },
          b: { type: 'number' },
        },
        required: ['hex', 'r', 'g', 'b'],
      },
    },
    typography: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          fontFamily: { type: 'string' },
          fontSize: {
            type: 'object',
            properties: { value: { type: 'number' }, unit: { type: 'string' } },
          },
          fontWeight: { type: 'number' },
          lineHeight: {
            type: 'object',
            properties: { value: { type: 'number' }, unit: { type: 'string' } },
          },
          letterSpacing: {
            type: 'object',
            properties: { value: { type: 'number' }, unit: { type: 'string' } },
          },
        },
      },
    },
    rounded: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: { value: { type: 'number' }, unit: { type: 'string' } },
        required: ['value', 'unit'],
      },
    },
    spacing: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: { value: { type: 'number' }, unit: { type: 'string' } },
        required: ['value', 'unit'],
      },
    },
    components: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: { properties: { type: 'object', additionalProperties: { type: 'string' } } },
        required: ['properties'],
      },
    },
  },
  required: ['colors', 'typography', 'rounded', 'spacing', 'components'],
});

// ── Helpers ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function serializeDesignSystemToJson(ds: DesignSystemState): string {
  const obj: Record<string, unknown> = {};

  if (ds.name) obj.name = ds.name;
  if (ds.description) obj.description = ds.description;

  const colors: Record<string, unknown> = {};
  for (const [k, v] of ds.colors) colors[k] = v;
  obj.colors = colors;

  const typography: Record<string, unknown> = {};
  for (const [k, v] of ds.typography) typography[k] = v;
  obj.typography = typography;

  const rounded: Record<string, unknown> = {};
  for (const [k, v] of ds.rounded) rounded[k] = v;
  obj.rounded = rounded;

  const spacing: Record<string, unknown> = {};
  for (const [k, v] of ds.spacing) spacing[k] = v;
  obj.spacing = spacing;

  const components: Record<string, unknown> = {};
  for (const [k, v] of ds.components) {
    const props: Record<string, string> = {};
    for (const [pk, pv] of v.properties) props[pk] = String(pv);
    components[k] = { properties: props };
  }
  obj.components = components;

  return JSON.stringify(obj, null, 2);
}

function buildFeedbackPrompt(currentDesignSystem: string, feedback: IterationFeedback): string {
  const parts: string[] = [];

  parts.push('You are refining an existing design system based on user feedback.');
  parts.push('');
  parts.push('Current Design System:');
  parts.push('```json');
  parts.push(currentDesignSystem);
  parts.push('```');
  parts.push('');
  parts.push(`User Feedback Type: ${feedback.feedback.type}`);
  parts.push(`User Message: "${feedback.feedback.message}"`);

  if (feedback.feedback.targetArea) {
    parts.push(`Target Area: ${feedback.feedback.targetArea}`);
  }

  if (feedback.proposedChanges) {
    if (feedback.proposedChanges.colors) {
      parts.push(
        `Explicit color changes requested: ${JSON.stringify(feedback.proposedChanges.colors)}`
      );
    }
    if (feedback.proposedChanges.typography) {
      parts.push(
        `Explicit typography changes requested: ${JSON.stringify(feedback.proposedChanges.typography)}`
      );
    }
    if (feedback.proposedChanges.components) {
      parts.push(
        `Explicit component changes requested: ${JSON.stringify(feedback.proposedChanges.components)}`
      );
    }
  }

  parts.push('');
  parts.push('Apply the feedback to produce a refined design system.');
  parts.push('- Keep tokens that are not affected by the feedback unchanged');
  parts.push('- Modify only the tokens relevant to the user feedback');
  parts.push('- Maintain visual cohesion across all token categories');
  parts.push('- If explicit changes are provided, apply them exactly');
  parts.push('- Return the complete updated design system as JSON');

  return parts.join('\n');
}

// ── Type helpers for JSON → DesignSystemState conversion ───────────────────

type ResolvedDimensionType = { type: 'dimension'; value: number; unit: string };
type ResolvedTypographyType = {
  type: 'typography';
  fontFamily?: string;
  fontSize?: ResolvedDimensionType;
  fontWeight?: number;
  lineHeight?: ResolvedDimensionType;
  letterSpacing?: ResolvedDimensionType;
};

function convertRefinedToDesignState(
  raw: {
    colors: Record<string, { hex: string; r: number; g: number; b: number }>;
    typography: Record<
      string,
      {
        fontFamily?: string;
        fontSize?: { value: number; unit: string };
        fontWeight?: number;
        lineHeight?: { value: number; unit: string };
        letterSpacing?: { value: number; unit: string };
      }
    >;
    rounded: Record<string, { value: number; unit: string }>;
    spacing: Record<string, { value: number; unit: string }>;
    components: Record<string, { properties: Record<string, string> }>;
  },
  ds: DesignSystemState
): DesignSystemState {
  const colors = new Map<string, ResolvedColor>();
  for (const [name, c] of Object.entries(raw.colors)) {
    const rgb = c.r !== undefined ? c : hexToRgb(c.hex);
    colors.set(name, {
      type: 'color',
      hex: c.hex,
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      a: 1,
      luminance: relativeLuminance(rgb.r, rgb.g, rgb.b),
    });
  }

  const typography = new Map<string, ResolvedTypography>();
  for (const [name, t] of Object.entries(raw.typography)) {
    const entry: ResolvedTypographyType = {
      type: 'typography',
      fontFamily: t.fontFamily,
      fontSize: t.fontSize
        ? { type: 'dimension', value: t.fontSize.value, unit: t.fontSize.unit }
        : undefined,
      fontWeight: t.fontWeight,
      lineHeight: t.lineHeight
        ? { type: 'dimension', value: t.lineHeight.value, unit: t.lineHeight.unit }
        : undefined,
      letterSpacing: t.letterSpacing
        ? { type: 'dimension', value: t.letterSpacing.value, unit: t.letterSpacing.unit }
        : undefined,
    };
    typography.set(name, entry as unknown as ResolvedTypography);
  }

  const rounded = new Map<string, ResolvedDimension>();
  for (const [name, d] of Object.entries(raw.rounded)) {
    rounded.set(name, { type: 'dimension', value: d.value, unit: d.unit });
  }

  const spacing = new Map<string, ResolvedDimension>();
  for (const [name, d] of Object.entries(raw.spacing)) {
    spacing.set(name, { type: 'dimension', value: d.value, unit: d.unit });
  }

  const components = new Map<string, ComponentDef>();
  for (const [name, comp] of Object.entries(raw.components)) {
    const props = new Map<string, ResolvedValue>();
    for (const [k, v] of Object.entries(comp.properties)) props.set(k, v);
    components.set(name, { properties: props, unresolvedRefs: [] });
  }

  return {
    name: ds.name,
    description: ds.description,
    colors,
    typography,
    rounded,
    spacing,
    components,
    symbolTable: ds.symbolTable,
    sections: ds.sections,
  };
}

// ── DefaultFeedbackProcessor ───────────────────────────────────────────────

export class DefaultFeedbackProcessor implements FeedbackProcessor {
  private fallbackPatternMatch: boolean;

  constructor(options?: { languageModel?: LanguageModel; fallbackPatternMatch?: boolean }) {
    this.fallbackPatternMatch = options?.fallbackPatternMatch ?? true;
  }

  async processFeedback(request: FeedbackProcessingRequest): Promise<FeedbackProcessingResult> {
    const startTime = Date.now();
    const notes: string[] = [];
    const changes = {
      colorsModified: 0,
      typographyModified: 0,
      spacingModified: 0,
      componentsModified: 0,
      componentsAdded: 0,
    };

    // Try LLM-based refinement if a language model is provided
    const languageModel = request.languageModel;
    if (languageModel) {
      try {
        return await this.processWithLLM(request, languageModel, startTime, notes, changes);
      } catch (error) {
        notes.push(
          `LLM refinement failed, falling back to pattern matching: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Fallback: pattern-based refinement
    if (this.fallbackPatternMatch) {
      return this.processWithPatterns(request, startTime, notes, changes);
    }

    // No processing available — return unchanged
    const updatedDraft = this.cloneDraft(request.draft);
    return this.buildResult(updatedDraft, request, startTime, notes, changes);
  }

  private async processWithLLM(
    request: FeedbackProcessingRequest,
    languageModel: LanguageModel,
    startTime: number,
    notes: string[],
    changes: {
      colorsModified: number;
      typographyModified: number;
      spacingModified: number;
      componentsModified: number;
      componentsAdded: number;
    }
  ): Promise<FeedbackProcessingResult> {
    const currentJson = serializeDesignSystemToJson(request.draft.designSystem);
    const prompt = buildFeedbackPrompt(currentJson, request.feedback);

    const { object, usage } = await generateObject({
      model: languageModel,
      schema: REFINED_DESIGN_SCHEMA,
      schemaName: 'RefinedDesignSystem',
      schemaDescription: 'Refined design system tokens based on user feedback',
      system:
        'You are a design system expert. Refine the given design system based on user feedback. Apply changes precisely while maintaining visual cohesion.',
      prompt,
      temperature: request.temperature ?? 0.5,
    });

    // Count changes
    for (const name of Object.keys(object.colors)) {
      if (request.draft.designSystem.colors.has(name)) changes.colorsModified++;
    }
    for (const name of Object.keys(object.typography)) {
      if (request.draft.designSystem.typography.has(name)) changes.typographyModified++;
    }
    for (const name of Object.keys(object.spacing)) {
      if (request.draft.designSystem.spacing.has(name)) changes.spacingModified++;
    }
    for (const name of Object.keys(object.components)) {
      if (request.draft.designSystem.components.has(name)) {
        changes.componentsModified++;
      } else {
        changes.componentsAdded++;
      }
    }

    const updatedDesignState = convertRefinedToDesignState(object, request.draft.designSystem);

    const updatedDraft: DesignSystemDraft = {
      ...request.draft,
      designSystem: updatedDesignState,
    };

    notes.push(
      `LLM refinement complete: ${(usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)} tokens used`
    );

    return this.buildResult(updatedDraft, request, startTime, notes, changes);
  }

  private processWithPatterns(
    request: FeedbackProcessingRequest,
    startTime: number,
    notes: string[],
    changes: {
      colorsModified: number;
      typographyModified: number;
      spacingModified: number;
      componentsModified: number;
      componentsAdded: number;
    }
  ): FeedbackProcessingResult {
    const updatedDraft = this.cloneDraft(request.draft);

    // Apply proposed changes
    const proposed = request.feedback.proposedChanges;
    if (proposed) {
      if (proposed.colors) {
        for (const [key, hexValue] of Object.entries(proposed.colors)) {
          const rgb = hexToRgb(hexValue);
          updatedDraft.designSystem.colors.set(key, {
            type: 'color',
            hex: hexValue,
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            a: 1,
            luminance: relativeLuminance(rgb.r, rgb.g, rgb.b),
          });
          changes.colorsModified++;
        }
      }

      if (proposed.typography) {
        for (const [key, val] of Object.entries(proposed.typography)) {
          updatedDraft.designSystem.typography.set(key, {
            type: 'typography',
            ...(val as Record<string, unknown>),
          });
          changes.typographyModified++;
        }
      }

      if (proposed.components) {
        for (const [key, val] of Object.entries(proposed.components)) {
          if (updatedDraft.designSystem.components.has(key)) {
            changes.componentsModified++;
          } else {
            changes.componentsAdded++;
          }
          updatedDraft.designSystem.components.set(key, {
            properties: new Map(Object.entries(val as Record<string, string>)),
            unresolvedRefs: [],
          });
        }
      }
    }

    // Pattern-match on feedback message
    if (request.feedback.feedback.message) {
      const message = request.feedback.feedback.message.toLowerCase();
      if (message.includes('darker') || message.includes('lighter')) changes.colorsModified++;
      if (message.includes('larger') || message.includes('bigger') || message.includes('smaller')) {
        changes.typographyModified++;
      }
      if (
        message.includes('spacing') ||
        message.includes('margin') ||
        message.includes('padding')
      ) {
        changes.spacingModified++;
      }
    }

    notes.push('Pattern-based feedback processing (no language model provided)');

    return this.buildResult(updatedDraft, request, startTime, notes, changes);
  }

  private cloneDraft(draft: DesignSystemDraft): DesignSystemDraft {
    const cloned = JSON.parse(JSON.stringify(draft)) as DesignSystemDraft;

    // Reconstruct Maps from serialized arrays
    const originalDs = draft.designSystem;
    cloned.designSystem = {
      name: originalDs.name,
      description: originalDs.description,
      colors: new Map(originalDs.colors),
      typography: new Map(originalDs.typography),
      rounded: new Map(originalDs.rounded),
      spacing: new Map(originalDs.spacing),
      components: new Map(
        Array.from(originalDs.components.entries()).map(([k, v]) => [
          k,
          { properties: new Map(v.properties), unresolvedRefs: [...v.unresolvedRefs] },
        ])
      ),
      symbolTable: new Map(originalDs.symbolTable),
      sections: originalDs.sections ? [...originalDs.sections] : undefined,
      unknownKeys: originalDs.unknownKeys ? [...originalDs.unknownKeys] : undefined,
      unknownKeyValues: originalDs.unknownKeyValues
        ? { ...originalDs.unknownKeyValues }
        : undefined,
    };

    return cloned;
  }

  private buildResult(
    updatedDraft: DesignSystemDraft,
    request: FeedbackProcessingRequest,
    startTime: number,
    notes: string[],
    changes: {
      colorsModified: number;
      typographyModified: number;
      spacingModified: number;
      componentsModified: number;
      componentsAdded: number;
    }
  ): FeedbackProcessingResult {
    const iterationResult: IterationResult = {
      draftId: updatedDraft.id,
      iterationNumber: 1,
      tenantId: request.feedback.tenantId,
      createdAt: new Date().toISOString(),
      designSystem: updatedDraft.designSystem,
      validationReport: updatedDraft.validationReport,
      changesSummary: {
        changedTokens: [
          ...(changes.colorsModified > 0 ? [`colors(${changes.colorsModified})`] : []),
          ...(changes.typographyModified > 0 ? [`typography(${changes.typographyModified})`] : []),
          ...(changes.spacingModified > 0 ? [`spacing(${changes.spacingModified})`] : []),
          ...(changes.componentsModified > 0 ? [`components(${changes.componentsModified})`] : []),
        ],
        addedTokens: changes.componentsAdded > 0 ? [`components(${changes.componentsAdded})`] : [],
        removedTokens: [],
        affectedComponents: [],
      },
      iterationHistory: [],
    };

    return {
      updatedDraft,
      iterationResult,
      metadata: {
        processedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        changes,
        notes,
      },
    };
  }
}

/**
 * Factory for creating feedback processor
 */
export function createFeedbackProcessor(options?: {
  languageModel?: LanguageModel;
  fallbackPatternMatch?: boolean;
}): FeedbackProcessor {
  return new DefaultFeedbackProcessor(options);
}
