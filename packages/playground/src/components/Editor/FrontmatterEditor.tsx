import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface FrontmatterEditorProps {
  frontmatter: Record<string, unknown>;
  onUpdate: (frontmatter: Record<string, unknown>) => void;
}

export function FrontmatterEditor({ frontmatter, onUpdate }: FrontmatterEditorProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleKey = (key: string) => {
    const next = new Set(expandedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedKeys(next);
  };

  const handleValueChange = (key: string, value: unknown) => {
    onUpdate({ ...frontmatter, [key]: value });
  };

  return (
    <div className="frontmatter-editor">
      <div className="frontmatter-header">
        <h4>Frontmatter</h4>
      </div>
      <div className="frontmatter-content">
        {Object.entries(frontmatter).map(([key, value]) => (
          <FrontmatterItem
            key={key}
            name={key}
            value={value}
            expanded={expandedKeys.has(key)}
            onToggle={() => toggleKey(key)}
            onChange={(newValue) => handleValueChange(key, newValue)}
          />
        ))}
        {Object.keys(frontmatter).length === 0 && (
          <div className="empty-state">
            <p>No frontmatter defined</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface FrontmatterItemProps {
  name: string;
  value: unknown;
  expanded: boolean;
  onToggle: () => void;
  onChange: (value: unknown) => void;
}

function FrontmatterItem({ name, value, expanded, onToggle, onChange }: FrontmatterItemProps) {
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);

  return (
    <div className="frontmatter-item">
      <div className="frontmatter-row">
        {(isObject || isArray) && (
          <button className="toggle-btn" onClick={onToggle}>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        {!(isObject || isArray) && <div style={{ width: 24 }} />}
        <code className="key">{name}</code>
        {!(isObject || isArray) && (
          <input
            type="text"
            className="value-input"
            value={String(value)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'true') onChange(true);
              else if (val === 'false') onChange(false);
              else if (!isNaN(Number(val)) && val !== '') onChange(Number(val));
              else onChange(val);
            }}
          />
        )}
      </div>
      {expanded && (isObject || isArray) && (
        <div className="frontmatter-nested">
          {isObject &&
            Object.entries(value as Record<string, unknown>).map(([k, v]) => (
              <div key={k} className="nested-item">
                <code>{k}:</code>
                <span>{JSON.stringify(v)}</span>
              </div>
            ))}
          {isArray &&
            (value as unknown[]).map((item, idx) => (
              <div key={idx} className="nested-item">
                <span>{JSON.stringify(item)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
