import { describe, it, expect } from 'vitest';

describe('ai-orchestration', () => {
  it('exports module', () => {
    expect(() => import('./index.js')).not.toThrow();
  });
});
