import { useState } from 'react';
import { Upload, AlertTriangle } from 'lucide-react';
import { callTool } from '../../api';
import { ChangeHighlight } from './ChangeHighlight';

interface DiffResult {
  tokens: {
    colors: { added: string[]; removed: string[]; changed: string[]; unchanged: string[] };
    typography: { added: string[]; removed: string[]; changed: string[]; unchanged: string[] };
    rounded: { added: string[]; removed: string[]; changed: string[]; unchanged: string[] };
    spacing: { added: string[]; removed: string[]; changed: string[]; unchanged: string[] };
  };
  findings: {
    before: { errors: number; warnings: number };
    after: { errors: number; warnings: number };
    delta: { errors: number; warnings: number };
  };
  regression: boolean;
}

export function DesignDiff() {
  const [beforePath, setBeforePath] = useState('');
  const [afterPath, setAfterPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diff, setDiff] = useState<DiffResult | null>(null);

  const handleCompare = async () => {
    if (!beforePath || !afterPath) {
      setError('Both paths are required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await callTool('diff_design_md', {
        before: beforePath,
        after: afterPath,
      });
      setDiff(result as DiffResult);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="design-diff">
      <div className="diff-header">
        <h3>Compare Design Systems</h3>
        <p>Compare two DESIGN.md files to detect token changes and regressions.</p>
      </div>

      <div className="diff-input-panel">
        <div className="diff-input-group">
          <label>Before DESIGN.md</label>
          <input
            type="text"
            placeholder="Path to original DESIGN.md"
            value={beforePath}
            onChange={(e) => setBeforePath(e.target.value)}
          />
        </div>

        <div className="diff-input-group">
          <label>After DESIGN.md</label>
          <input
            type="text"
            placeholder="Path to updated DESIGN.md"
            value={afterPath}
            onChange={(e) => setAfterPath(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleCompare}
          disabled={loading || !beforePath || !afterPath}
        >
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {diff && (
        <div className="diff-results">
          {diff.regression && (
            <div className="regression-warning">
              <AlertTriangle size={20} />
              <div>
                <h4>Regression Detected</h4>
                <p>The updated design system has more errors or warnings than the original.</p>
              </div>
            </div>
          )}

          <div className="findings-comparison">
            <div className="finding-stat">
              <div className="stat-label">Before</div>
              <div className="stat-value">
                <span className="stat-errors">{diff.findings.before.errors} errors</span>
                <span className="stat-warnings">{diff.findings.before.warnings} warnings</span>
              </div>
            </div>
            <div className="finding-stat">
              <div className="stat-label">After</div>
              <div className="stat-value">
                <span className="stat-errors">{diff.findings.after.errors} errors</span>
                <span className="stat-warnings">{diff.findings.after.warnings} warnings</span>
              </div>
            </div>
            {(diff.findings.delta.errors !== 0 || diff.findings.delta.warnings !== 0) && (
              <div className="finding-stat">
                <div className="stat-label">Delta</div>
                <div className="stat-value">
                  {diff.findings.delta.errors > 0 && (
                    <span className="stat-delta-error">+{diff.findings.delta.errors}</span>
                  )}
                  {diff.findings.delta.errors < 0 && (
                    <span className="stat-delta-success">{diff.findings.delta.errors}</span>
                  )}
                  {diff.findings.delta.warnings > 0 && (
                    <span className="stat-delta-warning">+{diff.findings.delta.warnings}</span>
                  )}
                  {diff.findings.delta.warnings < 0 && (
                    <span className="stat-delta-success">{diff.findings.delta.warnings}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <TokenChanges title="Colors" changes={diff.tokens.colors} />
          <TokenChanges title="Typography" changes={diff.tokens.typography} />
          <TokenChanges title="Spacing" changes={diff.tokens.spacing} />
          <TokenChanges title="Rounded" changes={diff.tokens.rounded} />
        </div>
      )}

      {!diff && !error && (
        <div className="empty-state">
          <Upload size={40} style={{ color: '#8b949e', marginBottom: 12 }} />
          <p>Enter paths to compare design systems</p>
        </div>
      )}
    </div>
  );
}

function TokenChanges({
  title,
  changes,
}: {
  title: string;
  changes: { added: string[]; removed: string[]; changed: string[]; unchanged: string[] };
}) {
  const hasChanges =
    changes.added.length > 0 || changes.removed.length > 0 || changes.changed.length > 0;

  if (!hasChanges && changes.unchanged.length === 0) return null;

  return (
    <div className="token-changes">
      <h4>{title}</h4>
      <div className="changes-container">
        <ChangeHighlight type="added" items={changes.added} title="Added" />
        <ChangeHighlight type="removed" items={changes.removed} title="Removed" />
        <ChangeHighlight type="changed" items={changes.changed} title="Changed" />
      </div>
    </div>
  );
}
