/**
 * Utility functions for the orchestration service
 */

/**
 * Generates a unique ID using crypto
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a hash of a design system for reproducibility checking
 */
export function hashDesignSystem(designSystem: any): string {
  const json = JSON.stringify(designSystem, Object.keys(designSystem).sort());
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validates tenant ID format
 */
export function isValidTenantId(tenantId: string): boolean {
  return /^[a-zA-Z0-9_-]{3,64}$/.test(tenantId);
}

/**
 * Validates prompt length (not too short, not too long)
 */
export function isValidPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  return trimmed.length >= 10 && trimmed.length <= 5000;
}

/**
 * Extracts key intentions from a prompt (simple keyword matching)
 */
export function extractIntentions(prompt: string): string[] {
  const keywords = [
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
  ];

  const lowerPrompt = prompt.toLowerCase();
  return keywords.filter(kw => lowerPrompt.includes(kw));
}

/**
 * Extracts constraints from a prompt (simple pattern matching)
 */
export function extractConstraints(prompt: string): string[] {
  const constraints: string[] = [];

  if (/wcag\s+aaa/i.test(prompt)) constraints.push('WCAG AAA');
  if (/wcag\s+aa/i.test(prompt) && !constraints.includes('WCAG AAA'))
    constraints.push('WCAG AA');

  if (/dark\s+mode/i.test(prompt)) constraints.push('Dark mode');
  if (/light\s+mode/i.test(prompt)) constraints.push('Light mode');
  if (/accessibility/i.test(prompt)) constraints.push('Accessibility');

  return constraints;
}

/**
 * Estimates generation time based on prompt complexity
 */
export function estimateGenerationTime(prompt: string): number {
  // Simple heuristic: longer prompts take longer
  const words = prompt.split(/\s+/).length;
  const baseTime = 30000; // 30 seconds minimum
  const perWordTime = 100; // 100ms per word

  return Math.min(baseTime + words * perWordTime, 180000); // Max 3 minutes
}

/**
 * Formats a duration in milliseconds as human-readable text
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}
