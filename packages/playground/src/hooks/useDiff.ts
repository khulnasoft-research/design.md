import { useCallback, useState } from 'react';
import { ParserHandler, ModelHandler } from '@scalify/design-core';

interface DiffEntry {
  name: string;
  type: 'added' | 'removed' | 'changed';
  before?: string;
  after?: string;
}

interface UseDiffReturn {
  entries: DiffEntry[];
  loading: boolean;
  error: string | null;
  computeDiff: (beforeContent: string, afterContent: string) => void;
  clear: () => void;
}

export function useDiff(): UseDiffReturn {
  const [entries, setEntries] = useState<DiffEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeDiff = useCallback((beforeContent: string, afterContent: string) => {
    setLoading(true);
    setError(null);
    try {
      const parser = new ParserHandler();
      const model = new ModelHandler();

      const beforeResult = parser.execute({ content: beforeContent });
      const afterResult = parser.execute({ content: afterContent });

      if (!beforeResult.success || !afterResult.success) {
        setError('Failed to parse one or both design files');
        setLoading(false);
        return;
      }

      const before = model.execute(beforeResult.data).designSystem;
      const after = model.execute(afterResult.data).designSystem;

      const diff: DiffEntry[] = [];

      for (const [name] of after.colors) {
        if (!before.colors.has(name)) {
          diff.push({
            name: `colors.${name}`,
            type: 'added',
            after: after.colors.get(name)?.hex,
          });
        }
      }
      for (const [name] of before.colors) {
        if (!after.colors.has(name)) {
          diff.push({
            name: `colors.${name}`,
            type: 'removed',
            before: before.colors.get(name)?.hex,
          });
        } else {
          const b = before.colors.get(name);
          const a = after.colors.get(name);
          if (b?.hex !== a?.hex) {
            diff.push({
              name: `colors.${name}`,
              type: 'changed',
              before: b?.hex,
              after: a?.hex,
            });
          }
        }
      }

      setEntries(diff);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    setError(null);
  }, []);

  return { entries, loading, error, computeDiff, clear };
}
