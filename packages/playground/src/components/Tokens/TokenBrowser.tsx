import { useState } from 'react';
import { Search } from 'lucide-react';
import { useDesignMdState } from '../../hooks/useDesignMdState';
import { ColorGrid } from './ColorGrid';
import { TypographyShowcase } from './TypographyShowcase';
import { ComponentPreview } from './ComponentPreview';

export function TokenBrowser() {
  const { designSystem } = useDesignMdState();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<
    'all' | 'colors' | 'typography' | 'spacing' | 'rounded' | 'components'
  >('all');

  if (!designSystem) {
    return (
      <div className="token-browser">
        <div className="empty-state">
          <p>No design system loaded. Edit the DESIGN.md file to see tokens here.</p>
        </div>
      </div>
    );
  }

  const categories = ['colors', 'typography', 'spacing', 'rounded', 'components'] as const;
  const categoryLabels = {
    colors: 'Colors',
    typography: 'Typography',
    spacing: 'Spacing',
    rounded: 'Rounded',
    components: 'Components',
  };

  return (
    <div className="token-browser">
      <div className="browser-header">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="category-tabs">
          <button
            className={`tab ${category === 'all' ? 'active' : ''}`}
            onClick={() => setCategory('all')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`tab ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="browser-content">
        {(category === 'all' || category === 'colors') && (
          <div className="token-section">
            <h3>Colors</h3>
            <ColorGrid colors={designSystem.colors as Record<string, unknown>} search={search} />
          </div>
        )}

        {(category === 'all' || category === 'typography') && (
          <div className="token-section">
            <h3>Typography</h3>
            <TypographyShowcase
              typography={designSystem.typography as Record<string, unknown>}
              search={search}
            />
          </div>
        )}

        {(category === 'all' || category === 'spacing') && (
          <div className="token-section">
            <h3>Spacing</h3>
            <SpacingGrid
              spacing={designSystem.spacing as Record<string, unknown>}
              search={search}
            />
          </div>
        )}

        {(category === 'all' || category === 'rounded') && (
          <div className="token-section">
            <h3>Rounded Corners</h3>
            <RoundedGrid
              rounded={designSystem.rounded as Record<string, unknown>}
              search={search}
            />
          </div>
        )}

        {(category === 'all' || category === 'components') && (
          <div className="token-section">
            <h3>Components</h3>
            <ComponentPreview
              components={designSystem.components as Record<string, unknown>}
              search={search}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SpacingGrid({ spacing, search }: { spacing?: Record<string, unknown>; search: string }) {
  if (!spacing) return null;
  const filtered = Object.entries(spacing).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="spacing-grid">
      {filtered.map(([name, value]) => (
        <div key={name} className="spacing-item">
          <div className="spacing-preview" style={{ height: String(value) }}>
            <span className="label">{String(value)}</span>
          </div>
          <code>{name}</code>
        </div>
      ))}
    </div>
  );
}

function RoundedGrid({ rounded, search }: { rounded?: Record<string, unknown>; search: string }) {
  if (!rounded) return null;
  const filtered = Object.entries(rounded).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="rounded-grid">
      {filtered.map(([name, value]) => (
        <div key={name} className="rounded-item">
          <div className="rounded-preview" style={{ borderRadius: String(value) }}>
            <span>{String(value)}</span>
          </div>
          <code>{name}</code>
        </div>
      ))}
    </div>
  );
}
