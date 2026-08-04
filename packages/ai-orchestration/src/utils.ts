import { randomBytes } from 'node:crypto';

/**
 * Generate a unique identifier with a given prefix.
 */
export function generateId(prefix = ''): string {
  const id = randomBytes(16).toString('hex');
  return prefix ? `${prefix}_${id}` : id;
}
