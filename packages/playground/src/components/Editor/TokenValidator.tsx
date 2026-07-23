import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useDesignMdState } from '../../hooks/useDesignMdState';

export function TokenValidator() {
  const { findings, summary } = useDesignMdState();

  return (
    <div className="token-validator">
      <div className="validator-header">
        <h3>Validation</h3>
        <div className="summary-badges">
          {summary.errors > 0 && (
            <span className="badge badge-error">
              <AlertCircle size={14} /> {summary.errors} Error{summary.errors !== 1 ? 's' : ''}
            </span>
          )}
          {summary.warnings > 0 && (
            <span className="badge badge-warning">
              <AlertTriangle size={14} /> {summary.warnings} Warning
              {summary.warnings !== 1 ? 's' : ''}
            </span>
          )}
          {summary.infos > 0 && (
            <span className="badge badge-info">
              <Info size={14} /> {summary.infos} Info
            </span>
          )}
          {summary.errors === 0 && summary.warnings === 0 && summary.infos === 0 && (
            <span className="badge badge-success">No issues</span>
          )}
        </div>
      </div>

      <div className="findings-list">
        {findings.length === 0 ? (
          <div className="empty-state">
            <p>No validation issues found.</p>
          </div>
        ) : (
          findings.map((f, i) => (
            <div key={i} className={`finding finding-${f.level}`}>
              <div className="finding-icon">
                {f.level === 'error' && <AlertCircle size={16} />}
                {f.level === 'warning' && <AlertTriangle size={16} />}
                {f.level === 'info' && <Info size={16} />}
              </div>
              <div className="finding-content">
                <div className="finding-title">
                  <code>{f.rule}</code>
                  {f.line && <span className="finding-location">Line {f.line}</span>}
                </div>
                <p className="finding-message">{f.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
