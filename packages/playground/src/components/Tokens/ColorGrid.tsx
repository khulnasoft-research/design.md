import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ColorGridProps {
  colors?: Record<string, unknown>;
  search: string;
}

export function ColorGrid({ colors, search }: ColorGridProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!colors || typeof colors !== 'object') {
    return <div className="empty-state">No colors defined</div>;
  }

  const filtered = Object.entries(colors).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (value: string, id: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="color-grid">
      {filtered.map(([name, value]) => {
        const colorValue = String(value);
        const isHex = colorValue.startsWith('#');
        const isRgb = colorValue.startsWith('rgb');

        return (
          <div key={name} className="color-item">
            <div
              className="color-preview"
              style={{
                backgroundColor: isHex || isRgb ? colorValue : 'transparent',
                border: isHex || isRgb ? 'none' : '1px solid #30363d',
              }}
              title={colorValue}
            />
            <div className="color-info">
              <code className="color-name">{name}</code>
              <div className="color-value-row">
                <code className="color-value">{colorValue}</code>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(colorValue, name)}
                  title="Copy to clipboard"
                >
                  {copied === name ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
