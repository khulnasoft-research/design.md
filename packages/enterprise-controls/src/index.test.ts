import { describe, it, expect } from 'vitest';

describe('enterprise-controls', () => {
  it('exports module', () => {
    expect(() => import('./index.js')).not.toThrow();
  });
});
