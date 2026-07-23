// Prompt Analysis
export type { PromptAnalysis } from './analyzer/index.js';
export { analyzePrompt, summarizeAnalysis } from './analyzer/index.js';

// AI Generation
export type {
  AIGenerationConfig,
  GenerationRequest,
  GenerationResult,
  AIGenerationService,
} from './generation/index.js';
export { DefaultAIGenerationService, createAIGenerationService } from './generation/index.js';

// Feedback Processing
export type {
  FeedbackProcessingRequest,
  FeedbackProcessingResult,
  FeedbackProcessor,
} from './feedback/index.js';
export { DefaultFeedbackProcessor, createFeedbackProcessor } from './feedback/index.js';

// Utilities
export { generateId } from './utils.js';

// Re-export workflow types from design-core
export type {
  PromptRequest,
  DesignSystemDraft,
  IterationFeedback,
  IterationResult,
  ApprovalRequest,
  ApprovalConfirmation,
  PublishedDesignSystem,
} from '@scalify/design-core';
