import { useState, useMemo } from 'react';
import { Globe, Code, Palette, Rocket, DollarSign, Check, X, ExternalLink, Zap, Shield, Star, Download, Filter, ChevronDown, ChevronUp } from 'lucide-react';

type Category = 'all' | 'fullstack' | 'design' | 'aiml' | 'enterprise';

interface Platform {
  id: string; name: string; company: string; url: string; tagline: string; description: string;
  color: string; bgColor: string; category: Category[];
  highlights: string[];
  stack: { framework: string; styling: string; runtime: string };
  designSystem: { type: string; sources: string; format: string; sharing: string; updates: string };
  deploy: string; pricing: string; bestFor: string;
  ratings: { ds: number; code: number; deploy: number; design: number; enterprise: number };
}

const platforms: Platform[] = [
  {
    id: 'v0', name: 'v0', company: 'Vercel', url: 'https://v0.app',
    tagline: 'Full-stack AI web app builder',
    description: 'Generate working applications from prompts. Design Systems 2.0 imports real components from GitHub, Figma, Storybook, and npm into reusable skills.',
    color: '#000', bgColor: '#1a1a2e', category: ['fullstack', 'enterprise'],
    highlights: [
      'Design Systems 2.0 — import from GitHub, Figma, npm, Storybook',
      'Built on Next.js + shadcn/ui + Tailwind CSS',
      'Agentic by default — plans, creates tasks, connects to databases',
      'One-click deploy to Vercel', 'iOS app for building on the go',
    ],
    stack: { framework: 'Next.js', styling: 'Tailwind CSS + shadcn/ui', runtime: 'Node.js (Vercel)' },
    designSystem: { type: 'Import-based (Design Systems 2.0)', sources: 'GitHub repos, Figma frames, npm packages, Storybook, docs, screenshots, ZIPs', format: 'Skill-based (v0.json + starter app)', sharing: 'Team workspace, personal scope, API-accessible', updates: 'Chat-based — re-validates starter app' },
    deploy: 'Vercel (one-click)', pricing: 'Free tier + paid plans (team, enterprise)', bestFor: 'Teams already on Vercel, Next.js projects, rapid prototyping',
    ratings: { ds: 5, code: 5, deploy: 5, design: 3, enterprise: 4 },
  },
  {
    id: 'lovable', name: 'Lovable', company: 'Lovable', url: 'https://lovable.dev',
    tagline: 'Full-stack AI app builder with enterprise governance',
    description: 'Build production-grade apps with natural language. Design systems as dedicated projects with file-copy attach, version releases, and workspace governance.',
    color: '#7c3aed', bgColor: '#1a0e2e', category: ['fullstack', 'enterprise'],
    highlights: [
      'Design systems as dedicated Lovable projects',
      'React components + schema + system.md documentation',
      'File-copy attach with version releases to connected projects',
      'Supabase database, auth, storage, realtime built-in',
      'Enterprise plans with SSO, audit logs, compliance',
    ],
    stack: { framework: 'TanStack Start (React)', styling: 'Tailwind CSS', runtime: 'Cloudflare Workers' },
    designSystem: { type: 'Dedicated project (Enterprise)', sources: 'React components, .lovable folder, system.md, design-system.json', format: 'File-copy attach', sharing: 'Workspace projects, version releases', updates: 'Release → "Update available" prompt on connected projects' },
    deploy: 'Built-in (Cloudflare Workers)', pricing: 'Free tier + paid plans (Pro, Enterprise)', bestFor: 'Enterprise teams, full-stack apps with auth/database, managed governance',
    ratings: { ds: 4, code: 4, deploy: 4, design: 3, enterprise: 5 },
  },
  {
    id: 'bolt', name: 'Bolt', company: 'StackBlitz', url: 'https://bolt.new',
    tagline: 'AI-powered web & mobile app builder',
    description: 'Type your idea and Bolt transforms it into a working product. Runs on WebContainers for in-browser Node.js execution with zero local setup.',
    color: '#f59e0b', bgColor: '#1a1500', category: ['fullstack'],
    highlights: [
      'Runs entirely in browser via WebContainers (no local setup)',
      'React + Vite + Tailwind CSS by default',
      'Bolt Cloud — hosting, databases, auth, custom domains',
      'Design system knowledge with per-package prompts (Enterprise)',
      'Mobile apps via Expo integration',
    ],
    stack: { framework: 'React + Vite', styling: 'Tailwind CSS', runtime: 'WebContainers (browser Node.js)' },
    designSystem: { type: 'Knowledge-based (Enterprise)', sources: 'Per-package prompts, private npm registries', format: 'Context injected into prompts', sharing: 'Team-level, Enterprise plans', updates: 'Chat-based' },
    deploy: 'Bolt Cloud (built-in hosting + custom domains)', pricing: 'Free tier (300K tokens/day) + Pro ($20/mo) + Teams + Enterprise', bestFor: 'Quick prototypes, mobile apps via Expo, no-install workflows',
    ratings: { ds: 2, code: 4, deploy: 4, design: 2, enterprise: 3 },
  },
  {
    id: 'aistudio', name: 'AI Studio', company: 'Google', url: 'https://aistudio.google.com',
    tagline: 'AI prototyping & model experimentation',
    description: 'Google\'s platform for experimenting with Gemini models, prompt engineering, structured outputs, and building AI-powered applications.',
    color: '#4285f4', bgColor: '#0a1a3a', category: ['aiml'],
    highlights: [
      'Experiment with Gemini models (Ultra, Pro, Flash, Nano)',
      'Prompt engineering with structured outputs and code execution',
      'Function calling, safety tuning, system instructions',
      'Export to Google Colab, Android Studio, and Vertex AI',
      'Free tier with generous quota',
    ],
    stack: { framework: 'Any (BYO frontend)', styling: 'Any', runtime: 'Gemini API + Google Cloud' },
    designSystem: { type: 'Not native — use via prompts or MCP', sources: 'Prompt-based context, file attachments', format: 'None built-in', sharing: 'None built-in', updates: 'N/A' },
    deploy: 'Export to Vertex AI, Colab, Android Studio', pricing: 'Free tier + pay-as-you-go (Vertex AI)', bestFor: 'AI prototyping, prompt engineering, Gemini model experimentation',
    ratings: { ds: 1, code: 3, deploy: 2, design: 1, enterprise: 4 },
  },
  {
    id: 'stitch', name: 'Stitch', company: 'Google Labs', url: 'https://stitch.withgoogle.com',
    tagline: 'AI-native design canvas',
    description: 'Create, iterate and collaborate on high-fidelity UI from natural language. DESIGN.md open format makes design systems portable across any tool.',
    color: '#0f9d58', bgColor: '#0a1a0a', category: ['design', 'fullstack'],
    highlights: [
      'AI-native infinite canvas with design agent',
      'DESIGN.md — open-source agent-friendly markdown format',
      'Extract design systems from any URL',
      'MCP server + Skills ecosystem for agent integration',
      'Voice capabilities, real-time design critiques',
    ],
    stack: { framework: 'Any (exports to React, Vue, etc.)', styling: 'DESIGN.md format', runtime: 'Stitch MCP + export to dev tools' },
    designSystem: { type: 'DESIGN.md (open standard)', sources: 'URL extraction, DESIGN.md import/export, voice', format: 'DESIGN.md markdown file + Stitch project tokens', sharing: 'DESIGN.md portable across tools; MCP SDK for integration', updates: 'Agent manager tracks iterations; re-upload DESIGN.md' },
    deploy: 'Export to AI Studio, Antigravity, or any dev tool via MCP', pricing: 'Free (Google Labs)', bestFor: 'UI/UX designers, design system authors, vibe design exploration',
    ratings: { ds: 5, code: 3, deploy: 2, design: 5, enterprise: 2 },
  },
];

const featureCategories = [
  {
    label: 'Core Capabilities',
    features: [
      { name: 'Full-stack app generation', v0: true, lovable: true, bolt: true, aistudio: false, stitch: false },
      { name: 'UI/UX design from prompts', v0: true, lovable: true, bolt: true, aistudio: false, stitch: true },
      { name: 'In-browser preview', v0: true, lovable: true, bolt: true, aistudio: true, stitch: true },
      { name: 'One-click deploy', v0: true, lovable: true, bolt: true, aistudio: false, stitch: false },
      { name: 'Custom domains', v0: true, lovable: true, bolt: true, aistudio: false, stitch: false },
      { name: 'Mobile app generation', v0: false, lovable: false, bolt: true, aistudio: false, stitch: false },
      { name: 'Voice input', v0: false, lovable: false, bolt: false, aistudio: false, stitch: true },
    ],
  },
  {
    label: 'Design Systems',
    features: [
      { name: 'Import from GitHub', v0: true, lovable: false, bolt: false, aistudio: false, stitch: true },
      { name: 'Import from Figma', v0: true, lovable: false, bolt: false, aistudio: false, stitch: false },
      { name: 'Import from npm', v0: true, lovable: true, bolt: false, aistudio: false, stitch: false },
      { name: 'Open standard format', v0: false, lovable: false, bolt: false, aistudio: false, stitch: true },
      { name: 'Team sharing', v0: true, lovable: true, bolt: true, aistudio: false, stitch: false },
      { name: 'Version releases', v0: false, lovable: true, bolt: false, aistudio: false, stitch: false },
      { name: 'DS from URL/scan', v0: true, lovable: false, bolt: false, aistudio: false, stitch: true },
    ],
  },
  {
    label: 'Platform & Integration',
    features: [
      { name: 'Platform API', v0: true, lovable: true, bolt: true, aistudio: true, stitch: true },
      { name: 'MCP server', v0: true, lovable: false, bolt: false, aistudio: true, stitch: true },
      { name: 'GitHub sync', v0: true, lovable: true, bolt: true, aistudio: true, stitch: false },
      { name: 'Agent/plugin ecosystem', v0: true, lovable: false, bolt: false, aistudio: false, stitch: true },
      { name: 'iOS/mobile app', v0: true, lovable: false, bolt: false, aistudio: true, stitch: false },
      { name: 'Enterprise SSO', v0: true, lovable: true, bolt: true, aistudio: true, stitch: false },
      { name: 'Free tier available', v0: true, lovable: true, bolt: true, aistudio: true, stitch: true },
    ],
  },
];

const ratingLabels: Record<string, string> = {
  ds: 'Design Systems', code: 'Code Gen', deploy: 'Deploy', design: 'UI/UX Design', enterprise: 'Enterprise',
};

const filterOptions: { id: Category; label: string; icon: string }[] = [
  { id: 'all', label: 'All Platforms', icon: '🌐' },
  { id: 'fullstack', label: 'Full-Stack Builders', icon: '⚡' },
  { id: 'design', label: 'Design-Focused', icon: '🎨' },
  { id: 'aiml', label: 'AI/ML Platforms', icon: '🤖' },
  { id: 'enterprise', label: 'Enterprise-Ready', icon: '🏢' },
];

export default function PlatformAnalysis() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Category>('all');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [exported, setExported] = useState(false);

  const filteredPlatforms = useMemo(() => {
    if (activeFilter === 'all') return platforms;
    return platforms.filter(p => p.category.includes(activeFilter));
  }, [activeFilter]);

  const toggleCompare = (id: string) => {
    setSelectedForCompare(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const renderStars = (n: number) =>
    <div className="pa-stars">{Array.from({ length: 5 }, (_, i) =>
      <Star key={i} size={12} fill={i < n ? '#f0c040' : 'none'} color={i < n ? '#f0c040' : '#30363d'} />
    )}</div>;

  const exportAsDesignMd = () => {
    const lines = [
      '# DESIGN.md — Platform Comparison',
      '',
      '> Auto-generated comparison of AI-powered design system web platforms.',
      `> Generated: ${new Date().toISOString().split('T')[0]}`,
      '',
      '## Overview',
      '',
      ...platforms.map(p => [
        `### ${p.name} (${p.company})`,
        '',
        `- **URL**: ${p.url}`,
        `- **Tagline**: ${p.tagline}`,
        `- **Description**: ${p.description}`,
        '',
        '#### Tech Stack',
        `- Framework: ${p.stack.framework}`,
        `- Styling: ${p.stack.styling}`,
        `- Runtime: ${p.stack.runtime}`,
        '',
        '#### Design System',
        `- Type: ${p.designSystem.type}`,
        `- Sources: ${p.designSystem.sources}`,
        `- Format: ${p.designSystem.format}`,
        `- Sharing: ${p.designSystem.sharing}`,
        `- Updates: ${p.designSystem.updates}`,
        '',
        '#### Deployment & Pricing',
        `- Deploy: ${p.deploy}`,
        `- Pricing: ${p.pricing}`,
        '',
        '---',
        '',
      ]).flat(),
      '',
      '## Feature Matrix',
      '',
      '| Feature | v0 | Lovable | Bolt | AI Studio | Stitch |',
      '| --- | --- | --- | --- | --- | --- |',
      ...featureCategories.flatMap(cat => [
        `| **${cat.label}** | | | | | |`,
        ...cat.features.map(f =>
          `| ${f.name} | ${f.v0 ? '✓' : '✗'} | ${f.lovable ? '✓' : '✗'} | ${f.bolt ? '✓' : '✗'} | ${f.aistudio ? '✓' : '✗'} | ${f.stitch ? '✓' : '✗'} |`
        ),
      ]),
      '',
      '## Ratings',
      '',
      '| Platform | ' + Object.values(ratingLabels).join(' | ') + ' |',
      '| --- | ' + Object.values(ratingLabels).map(() => '---:').join(' | ') + ' |',
      ...platforms.map(p =>
        `| ${p.name} | ${Object.keys(ratingLabels).map(k => '★'.repeat((p.ratings as any)[k]).padEnd(5, '☆')).join(' | ')} |`
      ),
      '',
      '## Key Insights',
      '',
      '- **Design Systems Leader**: v0 — Design Systems 2.0 imports real components from GitHub, Figma, Storybook, and npm.',
      '- **Open Standard**: Stitch — DESIGN.md is the only open-source, portable design system format.',
      '- **Enterprise Governance**: Lovable — dedicated projects with version releases and workspace governance.',
      '- **No-Install Speed**: Bolt — WebContainers enable instant start without local setup.',
      '- **Design-First**: Stitch — infinite canvas + AI agent + voice input for designers.',
      '- **AI Model Access**: AI Studio — best for experimenting with Gemini models directly.',
      '',
      '---',
      '',
      '_Generated by Design.md Platform Analysis. Data collected July 2026._',
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'platform-comparison.DESIGN.md'; a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="platform-analysis">
      <div className="pa-header">
        <div className="pa-header-top">
          <div>
            <h2>Design System Web Platforms</h2>
            <p className="pa-subtitle">
              Comparative analysis of AI-powered platforms for building design systems and web applications.
              Click any card to expand, check boxes to compare, and use filters to narrow by category.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={exportAsDesignMd}>
            <Download size={14} /> {exported ? 'Exported!' : 'Export as DESIGN.md'}
          </button>
        </div>

        <div className="pa-filters">
          {filterOptions.map(f => (
            <button
              key={f.id}
              className={`pa-filter-btn ${activeFilter === f.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              <span>{f.icon}</span> {f.label}
              <span className="pa-filter-count">
                {f.id === 'all' ? platforms.length : platforms.filter(p => p.category.includes(f.id)).length}
              </span>
            </button>
          ))}
        </div>

        {selectedForCompare.length > 0 && (
          <div className="pa-compare-bar">
            <span><Filter size={14} /> {selectedForCompare.length} selected for comparison</span>
            <button className="btn btn-sm" style={{ background: '#1f6feb', color: '#fff' }} onClick={() => setSelectedForCompare([])}>
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="pa-grid">
        {filteredPlatforms.map((p) => (
          <div
            key={p.id}
            className={`pa-card ${selectedPlatform === p.id ? 'expanded' : ''} ${selectedForCompare.includes(p.id) ? 'selected' : ''}`}
          >
            <div className="pa-card-header" style={{ borderLeftColor: p.color }}>
              <label className="pa-checkbox" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedForCompare.includes(p.id)}
                  onChange={() => toggleCompare(p.id)}
                />
              </label>
              <div className="pa-card-icon" style={{ background: p.color }}>
                {p.id === 'v0' ? <Zap size={18} /> : p.name[0]}
              </div>
              <div className="pa-card-title">
                <h3>{p.name}</h3>
                <span className="pa-card-company">{p.company}</span>
              </div>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="pa-card-link" onClick={(e) => e.stopPropagation()}>
                <ExternalLink size={14} />
              </a>
            </div>
            <p className="pa-card-tagline">{p.tagline}</p>
            <p className="pa-card-desc">{p.description}</p>

            <div className="pa-card-ratings">
              {Object.entries(p.ratings).map(([key, val]) => (
                <div key={key} className="pa-rating-item" title={ratingLabels[key]}>
                  <span className="pa-rating-label">{ratingLabels[key]}</span>
                  {renderStars(val)}
                </div>
              ))}
            </div>

            <button
              className="pa-expand-btn"
              onClick={() => setSelectedPlatform(selectedPlatform === p.id ? null : p.id)}
            >
              {selectedPlatform === p.id ? 'Show less' : 'Show details'}
              {selectedPlatform === p.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {selectedPlatform === p.id && (
              <div className="pa-card-details">
                <div className="pa-detail-section">
                  <h4><Code size={14} /> Tech Stack</h4>
                  <div className="pa-detail-grid">
                    <div><span>Framework</span>{p.stack.framework}</div>
                    <div><span>Styling</span>{p.stack.styling}</div>
                    <div><span>Runtime</span>{p.stack.runtime}</div>
                  </div>
                </div>
                <div className="pa-detail-section">
                  <h4><Palette size={14} /> Design System</h4>
                  <div className="pa-detail-list">
                    <div><span>Type</span>{p.designSystem.type}</div>
                    <div><span>Sources</span>{p.designSystem.sources}</div>
                    <div><span>Format</span>{p.designSystem.format}</div>
                    <div><span>Sharing</span>{p.designSystem.sharing}</div>
                    <div><span>Updates</span>{p.designSystem.updates}</div>
                  </div>
                </div>
                <div className="pa-detail-section">
                  <h4><Rocket size={14} /> Deploy</h4>
                  <p className="pa-detail-text">{p.deploy}</p>
                </div>
                <div className="pa-detail-section">
                  <h4><DollarSign size={14} /> Pricing</h4>
                  <p className="pa-detail-text">{p.pricing}</p>
                </div>
                <div className="pa-detail-section">
                  <h4><Shield size={14} /> Best For</h4>
                  <p className="pa-detail-text">{p.bestFor}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pa-comparison">
        <h3>Feature Comparison</h3>
        {featureCategories.map((cat) => (
          <div key={cat.label} className="pa-comparison-category">
            <h4>{cat.label}</h4>
            <div className="pa-comparison-table">
              <div className="pa-table-row pa-table-header">
                <div className="pa-table-feature">Feature</div>
                <div className="pa-table-cell">v0</div>
                <div className="pa-table-cell">Lovable</div>
                <div className="pa-table-cell">Bolt</div>
                <div className="pa-table-cell">AI Studio</div>
                <div className="pa-table-cell">Stitch</div>
              </div>
              {cat.features.map((f) => (
                <div key={f.name} className="pa-table-row">
                  <div className="pa-table-feature">{f.name}</div>
                  <div className={`pa-table-cell ${f.v0 ? 'yes' : 'no'}`}>{f.v0 ? <Check size={14} /> : <X size={14} />}</div>
                  <div className={`pa-table-cell ${f.lovable ? 'yes' : 'no'}`}>{f.lovable ? <Check size={14} /> : <X size={14} />}</div>
                  <div className={`pa-table-cell ${f.bolt ? 'yes' : 'no'}`}>{f.bolt ? <Check size={14} /> : <X size={14} />}</div>
                  <div className={`pa-table-cell ${f.aistudio ? 'yes' : 'no'}`}>{f.aistudio ? <Check size={14} /> : <X size={14} />}</div>
                  <div className={`pa-table-cell ${f.stitch ? 'yes' : 'no'}`}>{f.stitch ? <Check size={14} /> : <X size={14} />}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pa-insights">
        <h3><Zap size={18} /> Key Insights</h3>
        <div className="pa-insights-grid">
          <div className="pa-insight-card">
            <h4>Design Systems Leader: <strong>v0</strong></h4>
            <p>Design Systems 2.0 is the most comprehensive approach — importing real components from GitHub, Figma, Storybook, and npm into a skill that v0 uses across all chats.</p>
          </div>
          <div className="pa-insight-card">
            <h4>Open Standard: <strong>Stitch</strong></h4>
            <p>DESIGN.md is the only open-source, portable design system format. It can be used across any tool, making it the most interoperable approach for cross-platform workflows.</p>
          </div>
          <div className="pa-insight-card">
            <h4>Enterprise Governance: <strong>Lovable</strong></h4>
            <p>Dedicated design system projects with version releases, file-copy attach, and workspace-level governance make Lovable the strongest choice for regulated environments.</p>
          </div>
          <div className="pa-insight-card">
            <h4>No-Install Speed: <strong>Bolt</strong></h4>
            <p>WebContainers enable instant start without local setup. Best for quick prototypes, Expo mobile apps, and users who want zero configuration overhead.</p>
          </div>
          <div className="pa-insight-card">
            <h4>Design-First: <strong>Stitch</strong></h4>
            <p>Infinite canvas + AI agent + voice input makes Stitch the most natural fit for designers. The MCP server bridges design and code workflows seamlessly.</p>
          </div>
          <div className="pa-insight-card">
            <h4>AI Model Access: <strong>AI Studio</strong></h4>
            <p>Best for experimenting with Gemini models directly. Not a design system platform per se, but essential for prompt engineering before deploying to other tools.</p>
          </div>
        </div>
      </div>

      <div className="pa-footer">
        <p>Data collected July 2026. Platforms evolve rapidly — verify features on respective websites.</p>
      </div>
    </div>
  );
}
