import { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { callTool } from '../../api';

interface ExportResult {
  format: string;
  output: string;
}

type ExportFormat = 'json-tailwind' | 'css-tailwind' | 'dtcg';

export function ExportPanel() {
  const [path, setPath] = useState('');
  const [format, setFormat] = useState<ExportFormat>('json-tailwind');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ExportResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    if (!path) {
      setError('Path is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await callTool('export_design_md', {
        path,
        format,
      });
      setResult(result as ExportResult);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (result?.output) {
      navigator.clipboard.writeText(result.output).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const downloadFile = () => {
    if (result?.output) {
      const element = document.createElement('a');
      const file = new Blob([result.output], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `tokens.${getFileExtension(result.format)}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div className="export-panel">
      <div className="export-header">
        <h3>Export Tokens</h3>
        <p>Convert your DESIGN.md tokens to various formats.</p>
      </div>

      <div className="export-input-panel">
        <div className="export-input-group">
          <label>DESIGN.md Path</label>
          <input
            type="text"
            placeholder="Path to DESIGN.md"
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
        </div>

        <div className="export-input-group">
          <label>Export Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
            <option value="json-tailwind">Tailwind v3 (JSON)</option>
            <option value="css-tailwind">Tailwind v4 (CSS)</option>
            <option value="dtcg">W3C Design Tokens (DTCG)</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleExport} disabled={loading || !path}>
          {loading ? 'Exporting...' : 'Export'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="export-result">
          <div className="result-toolbar">
            <div className="result-info">
              <span className="format-badge">{result.format}</span>
            </div>
            <div className="result-actions">
              <button className="btn btn-secondary" onClick={copyToClipboard}>
                {copied ? (
                  <>
                    <Check size={16} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy
                  </>
                )}
              </button>
              <button className="btn btn-secondary" onClick={downloadFile}>
                <Download size={16} /> Download
              </button>
            </div>
          </div>

          <pre className="export-code">{result.output}</pre>
        </div>
      )}

      {!result && !error && (
        <div className="empty-state">
          <Download size={40} style={{ color: '#8b949e', marginBottom: 12 }} />
          <p>Select format and path to export tokens</p>
        </div>
      )}
    </div>
  );
}

function getFileExtension(format: string): string {
  switch (format) {
    case 'json-tailwind':
      return 'json';
    case 'css-tailwind':
      return 'css';
    case 'dtcg':
      return 'json';
    default:
      return 'txt';
  }
}
