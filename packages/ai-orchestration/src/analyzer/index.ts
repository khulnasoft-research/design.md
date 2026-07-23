/**
 * Prompt Analysis Module
 * 
 * Analyzes design prompts to extract structured insights:
 * - Design intentions (minimalist, bold, etc.)
 * - Constraints (WCAG levels, dark mode, etc.)
 * - Target platforms (web, mobile, prototype)
 * - Brand values and priorities
 * 
 * This module uses pattern matching and simple NLP to extract actionable
 * information from free-form design prompts.
 */

import type { PromptRequest } from '@scalify/design-core';

export interface PromptAnalysis {
  /** Design intentions extracted from prompt */
  intentions: string[];
  
  /** Constraints and requirements */
  constraints: string[];
  
  /** Target platforms */
  targetPlatforms: string[];
  
  /** Brand values and characteristics */
  brandValues: string[];
  
  /** Color palette preferences */
  colorPreferences: string[];
  
  /** Typography preferences */
  typographyPreferences: string[];
  
  /** Component focus areas */
  componentFocus: string[];
  
  /** Accessibility requirements */
  accessibilityRequirements: string[];
  
  /** Original prompt for reference */
  originalPrompt: string;
  
  /** Analysis confidence score (0-1) */
  confidence: number;
}

/**
 * Analyzes a design prompt and extracts structured insights
 */
export async function analyzePrompt(request: PromptRequest): Promise<PromptAnalysis> {
  const prompt = request.prompt.toLowerCase();
  const analysis: PromptAnalysis = {
    intentions: extractIntentions(prompt),
    constraints: extractConstraints(prompt),
    targetPlatforms: extractTargetPlatforms(prompt, request.targetScenario),
    brandValues: extractBrandValues(prompt),
    colorPreferences: extractColorPreferences(prompt),
    typographyPreferences: extractTypographyPreferences(prompt),
    componentFocus: extractComponentFocus(prompt),
    accessibilityRequirements: extractAccessibilityRequirements(prompt),
    originalPrompt: request.prompt,
    confidence: calculateConfidence(request.prompt),
  };

  return analysis;
}

/**
 * Extracts design intentions (adjectives describing style)
 */
function extractIntentions(prompt: string): string[] {
  const intentions = [
    'minimalist',
    'bold',
    'vibrant',
    'playful',
    'professional',
    'modern',
    'classic',
    'elegant',
    'casual',
    'corporate',
    'creative',
    'clean',
    'sophisticated',
    'expressive',
    'flat',
    'neumorphic',
    'glassmorphic',
    'brutalist',
    'luxury',
    'friendly',
    'serious',
    'fun',
    'formal',
    'informal',
  ];

  return intentions.filter(intention => prompt.includes(intention));
}

/**
 * Extracts constraints and requirements
 */
function extractConstraints(prompt: string): string[] {
  const constraints: string[] = [];

  // WCAG compliance
  if (/wcag\s+aaa/i.test(prompt)) {
    constraints.push('WCAG AAA');
  } else if (/wcag\s+aa/i.test(prompt)) {
    constraints.push('WCAG AA');
  } else if (/wcag/i.test(prompt)) {
    constraints.push('WCAG AA');
  }

  // Dark mode
  if (/dark\s+mode/i.test(prompt)) {
    constraints.push('Dark mode');
  }

  // Light mode
  if (/light\s+mode/i.test(prompt)) {
    constraints.push('Light mode');
  }

  // Accessibility
  if (/accessibility|accessible|a11y/i.test(prompt)) {
    constraints.push('Accessibility-focused');
  }

  // Responsive
  if (/responsive|mobile-first|mobile first/i.test(prompt)) {
    constraints.push('Responsive design');
  }

  // Cross-platform
  if (/cross-platform|cross platform|universal/i.test(prompt)) {
    constraints.push('Cross-platform');
  }

  // High contrast
  if (/high contrast|contrast ratio/i.test(prompt)) {
    constraints.push('High contrast');
  }

  return [...new Set(constraints)];
}

/**
 * Extracts target platforms
 */
function extractTargetPlatforms(
  prompt: string,
  requestScenario?: 'web' | 'mobile' | 'prototype'
): string[] {
  const platforms: Set<string> = new Set();

  if (requestScenario) {
    platforms.add(requestScenario);
  }

  if (/web|website|browser/i.test(prompt)) {
    platforms.add('web');
  }

  if (/mobile|app|ios|android|native/i.test(prompt)) {
    platforms.add('mobile');
  }

  if (/desktop|macos|windows/i.test(prompt)) {
    platforms.add('desktop');
  }

  if (/prototype|figma|design/i.test(prompt)) {
    platforms.add('prototype');
  }

  return Array.from(platforms);
}

/**
 * Extracts brand values
 */
function extractBrandValues(prompt: string): string[] {
  const values = [
    'trustworthy',
    'innovative',
    'reliable',
    'bold',
    'subtle',
    'premium',
    'accessible',
    'inclusive',
    'data-driven',
    'user-focused',
    'minimalist',
    'rich',
    'timeless',
    'modern',
    'energetic',
    'calm',
    'professional',
    'friendly',
  ];

  return values.filter(value => prompt.includes(value));
}

/**
 * Extracts color palette preferences
 */
function extractColorPreferences(prompt: string): string[] {
  const preferences: string[] = [];

  if (/monochrome|black and white|grayscale/i.test(prompt)) {
    preferences.push('Monochrome');
  }

  if (/vibrant|bright|saturated|vivid/i.test(prompt)) {
    preferences.push('Vibrant');
  }

  if (/pastel|soft|muted|desaturated/i.test(prompt)) {
    preferences.push('Pastel');
  }

  if (/gradient/i.test(prompt)) {
    preferences.push('Gradients');
  }

  if (/primary color|accent color/i.test(prompt)) {
    preferences.push('Accent-focused');
  }

  if (/warm|cool|neutral/i.test(prompt)) {
    const match = prompt.match(/(warm|cool|neutral)/i);
    if (match) {
      preferences.push(`${match[1]} tones`);
    }
  }

  if (/earth|natural|organic/i.test(prompt)) {
    preferences.push('Natural colors');
  }

  return [...new Set(preferences)];
}

/**
 * Extracts typography preferences
 */
function extractTypographyPreferences(prompt: string): string[] {
  const preferences: string[] = [];

  if (/serif/i.test(prompt)) {
    preferences.push('Serif');
  }

  if (/sans-serif|sans serif/i.test(prompt)) {
    preferences.push('Sans-serif');
  }

  if (/mono|monospace/i.test(prompt)) {
    preferences.push('Monospace');
  }

  if (/large\s+text|big\s+typography|prominent\s+text/i.test(prompt)) {
    preferences.push('Large typography');
  }

  if (/small\s+text|compact|dense/i.test(prompt)) {
    preferences.push('Compact typography');
  }

  if (/bold|weight|heavy/i.test(prompt)) {
    preferences.push('Bold weights');
  }

  if (/light|thin|delicate/i.test(prompt)) {
    preferences.push('Light weights');
  }

  return [...new Set(preferences)];
}

/**
 * Extracts component focus areas
 */
function extractComponentFocus(prompt: string): string[] {
  const components: string[] = [];

  const componentKeywords = [
    ['button', 'Button'],
    ['input', 'Input field'],
    ['card', 'Card'],
    ['modal', 'Modal/Dialog'],
    ['dropdown', 'Dropdown'],
    ['navigation', 'Navigation'],
    ['form', 'Form'],
    ['table', 'Table'],
    ['chart', 'Chart'],
    ['avatar', 'Avatar'],
    ['badge', 'Badge'],
    ['tooltip', 'Tooltip'],
  ];

  for (const [keyword, label] of componentKeywords) {
    if (prompt.includes(keyword)) {
      components.push(label);
    }
  }

  return components;
}

/**
 * Extracts accessibility requirements
 */
function extractAccessibilityRequirements(prompt: string): string[] {
  const requirements: string[] = [];

  if (/keyboard|keyboard navigation|keyboard accessible/i.test(prompt)) {
    requirements.push('Keyboard navigation');
  }

  if (/screen reader|sr-only|aria/i.test(prompt)) {
    requirements.push('Screen reader support');
  }

  if (/focus/i.test(prompt)) {
    requirements.push('Clear focus indicators');
  }

  if (/color blind|colorblind|deuteranopia|protanopia/i.test(prompt)) {
    requirements.push('Color blind friendly');
  }

  if (/high contrast/i.test(prompt)) {
    requirements.push('High contrast mode');
  }

  if (/motion|reduced motion/i.test(prompt)) {
    requirements.push('Reduced motion support');
  }

  return [...new Set(requirements)];
}

/**
 * Calculates analysis confidence based on prompt specificity
 */
function calculateConfidence(prompt: string): number {
  let score = 0.5; // Base score

  // More detailed prompts are more confident
  const words = prompt.split(/\s+/).length;
  if (words > 50) score += 0.2;
  if (words > 100) score += 0.1;

  // Presence of specific requirements increases confidence
  const hasWcag = /wcag/i.test(prompt);
  const hasPlatform = /web|mobile|desktop/i.test(prompt);
  const hasValues = /minimalist|bold|professional/i.test(prompt);

  if (hasWcag) score += 0.1;
  if (hasPlatform) score += 0.1;
  if (hasValues) score += 0.1;

  return Math.min(score, 1.0);
}

/**
 * Generates a concise summary of the analysis for logging
 */
export function summarizeAnalysis(analysis: PromptAnalysis): string {
  const parts: string[] = [];

  if (analysis.intentions.length > 0) {
    parts.push(`Intentions: ${analysis.intentions.join(', ')}`);
  }

  if (analysis.constraints.length > 0) {
    parts.push(`Constraints: ${analysis.constraints.join(', ')}`);
  }

  if (analysis.targetPlatforms.length > 0) {
    parts.push(`Platforms: ${analysis.targetPlatforms.join(', ')}`);
  }

  if (analysis.accessibilityRequirements.length > 0) {
    parts.push(`Accessibility: ${analysis.accessibilityRequirements.join(', ')}`);
  }

  parts.push(`Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);

  return parts.join(' | ');
}
