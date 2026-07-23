import { useCallback, useState } from 'react';
import { ParserHandler, ModelHandler, runLinter } from '@scalify/design-core';
import type { Finding, LintResult } from '@scalify/design-core';
import type { LintFinding } from './useDesignMdState';

interface UseLintingReturn {
  findings: LintFinding[];
  summary: { errors: number; warnings: number; infos: number };
  loading: boolean;
  lintContent: (content: string) => void;
}

function toLintFinding(f: Finding): LintFinding {
  return {
    level: f.severity as 'error' | 'warning' | 'info',
    rule: '',
    message: f.message,
    line: undefined,
    column: undefined,
  };
}

function toSummary(findings: LintFinding[]): { errors: number; warnings: number; infos: number } {
  return {
    errors: findings.filter((f) => f.level === 'error').length,
    warnings: findings.filter((f) => f.level === 'warning').length,
    infos: findings.filter((f) => f.level === 'info').length,
  };
}

export function useLinting(): UseLintingReturn {
  const [findings, setFindings] = useState<LintFinding[]>([]);
  const [summary, setSummary] = useState<{ errors: number; warnings: number; infos: number }>({
    errors: 0,
    warnings: 0,
    infos: 0,
  });
  const [loading, setLoading] = useState(false);

  const lintContent = useCallback((content: string) => {
    setLoading(true);
    try {
      const parser = new ParserHandler();
      const model = new ModelHandler();

      const parseResult = parser.execute({ content });
      if (!parseResult.success) {
        const lintFindings: LintFinding[] = [
          {
            level: 'warning',
            rule: 'parse',
            message: parseResult.error.message,
          },
        ];
        setFindings(lintFindings);
        setSummary(toSummary(lintFindings));
        setLoading(false);
        return;
      }

      const { designSystem, findings: modelFindings } = model.execute(parseResult.data);
      const lintResult: LintResult = runLinter(designSystem);

      const allFindings = [...modelFindings, ...lintResult.findings].map(toLintFinding);
      setFindings(allFindings);
      setSummary(toSummary(allFindings));
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      const lintFindings: LintFinding[] = [
        { level: 'error', rule: 'lint', message: `Linting error: ${err}` },
      ];
      setFindings(lintFindings);
      setSummary(toSummary(lintFindings));
    }
    setLoading(false);
  }, []);

  return { findings, summary, loading, lintContent };
}
