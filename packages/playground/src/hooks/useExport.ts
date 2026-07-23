import { useCallback, useState } from 'react';
import { ParserHandler, ModelHandler } from '@scalify/design-core';

type ExportFormat = 'json' | 'dtcg';

interface UseExportReturn {
  exportResult: string | null;
  loading: boolean;
  error: string | null;
  exportDesign: (content: string, format: ExportFormat) => void;
  clear: () => void;
}

export function useExport(): UseExportReturn {
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportDesign = useCallback((content: string, format: ExportFormat) => {
    setLoading(true);
    setError(null);
    try {
      const parser = new ParserHandler();
      const model = new ModelHandler();

      const parseResult = parser.execute({ content });
      if (!parseResult.success) {
        setError(`Parse failed: ${parseResult.error.message}`);
        setLoading(false);
        return;
      }

      const { designSystem } = model.execute(parseResult.data);
      const tokens: Record<string, unknown> = {};
      for (const [name, color] of designSystem.colors) {
        tokens[name] = color.hex;
      }
      for (const [name, dim] of designSystem.spacing) {
        tokens[name] = `${dim.value}${dim.unit}`;
      }
      for (const [name, dim] of designSystem.rounded) {
        tokens[name] = `${dim.value}${dim.unit}`;
      }

      if (format === 'dtcg') {
        const dtcgTokens: Record<string, { $value: string; $type: string }> = {};
        for (const [name, color] of designSystem.colors) {
          dtcgTokens[name] = { $value: color.hex, $type: 'color' };
        }
        for (const [name, dim] of designSystem.spacing) {
          dtcgTokens[name] = { $value: `${dim.value}${dim.unit}`, $type: 'dimension' };
        }
        for (const [name, dim] of designSystem.rounded) {
          dtcgTokens[name] = { $value: `${dim.value}${dim.unit}`, $type: 'dimension' };
        }
        setExportResult(JSON.stringify(dtcgTokens, null, 2));
      } else {
        setExportResult(JSON.stringify(tokens, null, 2));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  }, []);

  const clear = useCallback(() => {
    setExportResult(null);
    setError(null);
  }, []);

  return { exportResult, loading, error, exportDesign, clear };
}
