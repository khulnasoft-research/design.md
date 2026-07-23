import type { LanguageModel } from 'ai';
import { generateObject, jsonSchema } from 'ai';
import type {
  PromptRequest,
  DesignSystemDraft,
  DesignSystemState,
  ResolvedColor,
  ResolvedDimension,
  ResolvedTypography,
  ResolvedValue,
  ComponentDef,
} from '@scalify/design-core';
import type { PromptAnalysis } from '../analyzer/index.js';
import { generateId } from '../utils.js';

/**
 * Configuration for AI generation
 */
export interface AIGenerationConfig {
  /** Language model to use for generation (from any AI SDK provider) */
  model: LanguageModel;

  /** System prompt override (defaults to built-in design system prompt) */
  systemPrompt?: string;

  /** Temperature for generation (0-1) */
  temperature?: number;

  /** Max tokens for generation */
  maxTokens?: number;

  /** Whether to stream generation output */
  streaming?: boolean;
}

/**
 * Request for AI to generate a design system draft
 */
export interface GenerationRequest {
  /** Analyzed prompt containing design intentions */
  analyzedPrompt: PromptAnalysis;

  /** Original user prompt for context */
  originalPrompt: PromptRequest;

  /** Configuration for generation */
  config: AIGenerationConfig;
}

/**
 * Generation result with draft and metadata
 */
export interface GenerationResult {
  /** Generated design system draft */
  draft: DesignSystemDraft;

  /** Generation metadata */
  metadata: {
    /** Model used for generation */
    model: string;

    /** ISO timestamp of generation */
    generatedAt: string;

    /** Tokens used in generation */
    tokensUsed?: {
      input: number;
      output: number;
      total: number;
    };

    /** Generation time in milliseconds */
    duration: number;

    /** Any warnings or notes about generation */
    notes?: string[];
  };
}

/**
 * Interface for AI generation service
 * This handles converting analyzed prompts into design system drafts using LLMs
 */
export interface AIGenerationService {
  /**
   * Generate a design system draft from an analyzed prompt
   */
  generate(request: GenerationRequest): Promise<GenerationResult>;

  /**
   * Stream generation output (optional for real-time UX)
   */
  generateStream?(
    request: GenerationRequest,
    onChunk: (chunk: string) => void
  ): Promise<GenerationResult>;
}

// ── JSON Schema for structured output ──────────────────────────────────────

const DESIGN_SYSTEM_SCHEMA = jsonSchema<{
  name: string;
  description: string;
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
  name: 'DesignSystem',
  description:
    'A complete design system with tokens for colors, typography, spacing, and components',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name of the design system' },
      description: { type: 'string', description: 'Description of the design system' },
      colors: {
        type: 'object',
        description: 'Color tokens as hex values with RGB components',
        additionalProperties: {
          type: 'object',
          properties: {
            hex: { type: 'string', description: 'Hex color value, e.g. #0070f3' },
            r: { type: 'number', description: 'Red channel 0-255' },
            g: { type: 'number', description: 'Green channel 0-255' },
            b: { type: 'number', description: 'Blue channel 0-255' },
          },
          required: ['hex', 'r', 'g', 'b'],
        },
      },
      typography: {
        type: 'object',
        description: 'Typography tokens with font properties',
        additionalProperties: {
          type: 'object',
          properties: {
            fontFamily: { type: 'string', description: 'Font family name' },
            fontSize: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
            },
            fontWeight: { type: 'number', description: 'Font weight 100-900' },
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
        description: 'Border radius tokens',
        additionalProperties: {
          type: 'object',
          properties: { value: { type: 'number' }, unit: { type: 'string' } },
          required: ['value', 'unit'],
        },
      },
      spacing: {
        type: 'object',
        description: 'Spacing scale tokens',
        additionalProperties: {
          type: 'object',
          properties: { value: { type: 'number' }, unit: { type: 'string' } },
          required: ['value', 'unit'],
        },
      },
      components: {
        type: 'object',
        description: 'Component definitions with their properties',
        additionalProperties: {
          type: 'object',
          properties: {
            properties: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
          },
          required: ['properties'],
        },
      },
    },
    required: ['name', 'description', 'colors', 'typography', 'rounded', 'spacing'],
  },
});

// ── System prompt ──────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a design system expert. Generate a complete, cohesive design system based on the user's requirements.

Your output must be a single JSON object matching the DesignSystem schema. Follow these rules:

Colors:
- Generate 4-8 semantic color tokens (primary, secondary, accent, neutral shades, success, warning, error)
- Each color needs hex, r, g, b values
- Ensure sufficient contrast between text and background colors

Typography:
- Generate 2-4 typography tokens (heading, body, caption, code)
- Use web-safe font stacks or popular Google Fonts
- Include font-size, font-weight, line-height, and letter-spacing

Rounded (border-radius):
- Generate 3-4 radius tokens (sm, md, lg, full)
- Use rem units

Spacing:
- Generate a 5-6 step spacing scale (xs, sm, md, lg, xl, 2xl)
- Use rem units, following a consistent scale (e.g., 4px base)

Components:
- Define 2-4 key components relevant to the requirements
- Each component has string properties mapping to token names

Make the design system cohesive — colors, typography, and spacing should work together harmoniously.`;
}

function buildUserPrompt(analysis: PromptAnalysis, original: PromptRequest): string {
  const parts: string[] = [];

  parts.push(`Design Prompt: "${original.prompt}"`);

  if (analysis.intentions.length > 0) {
    parts.push(`Style: ${analysis.intentions.join(', ')}`);
  }
  if (analysis.colorPreferences.length > 0) {
    parts.push(`Color preferences: ${analysis.colorPreferences.join(', ')}`);
  }
  if (analysis.typographyPreferences.length > 0) {
    parts.push(`Typography preferences: ${analysis.typographyPreferences.join(', ')}`);
  }
  if (analysis.brandValues.length > 0) {
    parts.push(`Brand values: ${analysis.brandValues.join(', ')}`);
  }
  if (analysis.componentFocus.length > 0) {
    parts.push(`Components needed: ${analysis.componentFocus.join(', ')}`);
  }
  if (analysis.targetPlatforms.length > 0) {
    parts.push(`Target platforms: ${analysis.targetPlatforms.join(', ')}`);
  }
  if (analysis.accessibilityRequirements.length > 0) {
    parts.push(`Accessibility: ${analysis.accessibilityRequirements.join(', ')}`);
  }
  if (analysis.constraints.length > 0) {
    parts.push(`Constraints: ${analysis.constraints.join(', ')}`);
  }

  parts.push(`\nConfidence: ${(analysis.confidence * 100).toFixed(0)}%`);
  parts.push('\nGenerate a complete design system JSON matching this vision.');

  return parts.join('\n');
}

// ── Conversion helpers ─────────────────────────────────────────────────────

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

function convertJsonToDesignState(raw: {
  name: string;
  description: string;
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
}): DesignSystemState {
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
    typography.set(name, {
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
    });
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
    name: raw.name,
    description: raw.description,
    colors,
    typography,
    rounded,
    spacing,
    components,
    symbolTable: new Map(),
  };
}

// ── DefaultAIGenerationService ─────────────────────────────────────────────

export class DefaultAIGenerationService implements AIGenerationService {
  private model: LanguageModel;
  private systemPrompt: string;
  private temperature: number;

  constructor(config: AIGenerationConfig) {
    this.model = config.model;
    this.systemPrompt = config.systemPrompt || buildSystemPrompt();
    this.temperature = config.temperature ?? 0.7;
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();
    const notes: string[] = [];

    try {
      const userPrompt = buildUserPrompt(request.analyzedPrompt, request.originalPrompt);

      const { object, usage } = await generateObject({
        model: this.model,
        schema: DESIGN_SYSTEM_SCHEMA,
        schemaName: 'DesignSystem',
        schemaDescription:
          'A complete design system with color, typography, spacing, and component tokens',
        system: this.systemPrompt,
        prompt: userPrompt,
        temperature: this.temperature,
      });

      const designState = convertJsonToDesignState(object);

      const draft: DesignSystemDraft = {
        id: generateId(),
        promptId: request.originalPrompt.tenantId,
        tenantId: request.originalPrompt.tenantId,
        version: '1.0.0-draft',
        createdAt: new Date().toISOString(),
        designSystem: designState,
        validationReport: {
          findings: [],
          summary: { errors: 0, warnings: 0, infos: 0 },
          tokenCompleteness: 0.8,
          wcagCompliance: { aa: true, aaa: false },
        },
        generationMetadata: {
          modelUsed: typeof this.model === 'string' ? this.model : this.model.modelId,
          tokensUsed: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
          promptHash: `hash_${Date.now()}`,
          generationTime: Date.now() - startTime,
        },
      };

      notes.push(
        `Generated ${designState.colors.size} colors, ${designState.typography.size} typography tokens, ${designState.spacing.size} spacing tokens`
      );

      return {
        draft,
        metadata: {
          model: typeof this.model === 'string' ? this.model : this.model.modelId,
          generatedAt: new Date().toISOString(),
          tokensUsed: {
            input: usage.inputTokens ?? 0,
            output: usage.outputTokens ?? 0,
            total: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
          },
          duration: Date.now() - startTime,
          notes,
        },
      };
    } catch (error) {
      throw new Error(
        `AI generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async generateStream(
    request: GenerationRequest,
    onChunk: (chunk: string) => void
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    onChunk('Starting design system generation...\n');

    const result = await this.generate(request);

    onChunk(`Generated ${result.metadata.model} design system\n`);
    onChunk(`Colors: ${result.draft.designSystem.colors.size} tokens\n`);
    onChunk(`Typography: ${result.draft.designSystem.typography.size} tokens\n`);
    onChunk(`Spacing: ${result.draft.designSystem.spacing.size} tokens\n`);
    onChunk('Design system generation complete.\n');

    result.metadata.duration = Date.now() - startTime;
    return result;
  }
}

/**
 * Factory for creating AI generation service
 */
export function createAIGenerationService(config: AIGenerationConfig): AIGenerationService {
  return new DefaultAIGenerationService(config);
}
