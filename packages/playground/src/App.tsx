import { useState, useEffect } from 'react';
import { FileText, Palette, GitCompare, Download, Wrench, Plus, Save } from 'lucide-react';
import { health, callTool } from './api';
import { useDesignMdState } from './hooks/useDesignMdState';
import { DesignMdEditor } from './components/Editor/DesignMdEditor';
import { TokenValidator } from './components/Editor/TokenValidator';
import { TokenBrowser } from './components/Tokens/TokenBrowser';
import { DesignDiff } from './components/Comparison/DesignDiff';
import { ExportPanel } from './components/Export/ExportPanel';
import './styles.css';
import './styles/editor.css';

type TabType = 'editor' | 'tokens' | 'diff' | 'export' | 'tools';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [filePath, setFilePath] = useState('');
  const {
    selectedTab,
    setSelectedTab,
    content,
    fileName,
    setFileName,
    isDirty,
    setIsDirty,
    setFindings,
    setDesignSystem,
    summary,
  } = useDesignMdState();

  useEffect(() => {
    health()
      .then(() => setConnected(true))
      .catch(() => setConnected(false));
  }, []);

  const handleLoadFile = async () => {
    if (!filePath) return;
    try {
      const result = await callTool('read_design_md', { path: filePath });
      const data = result as Record<string, unknown>;
      const lintResult = await callTool('lint_design_md', { path: filePath });
      const lintData = lintResult as Record<string, unknown>;

      setDesignSystem((lintData.designSystem || {}) as Record<string, unknown>);
      setFindings(
        ((lintData.findings || []) as any[]).map((f: any) => ({
          level: f.level || 'info',
          rule: f.rule || 'unknown',
          message: f.message || '',
          line: f.line,
          column: f.column,
        }))
      );
      setFileName(filePath.split('/').pop() || 'DESIGN.md');
      setIsDirty(false);
    } catch (e) {
      console.error('Failed to load file:', e);
    }
  };

  const handleSaveFile = async () => {
    if (!filePath || !content) return;
    try {
      const result = await callTool('write_design_md', {
        path: filePath,
        body: content,
      });
      const data = result as Record<string, unknown>;
      setFindings(
        ((data.findings || []) as any[]).map((f: any) => ({
          level: f.level || 'info',
          rule: f.rule || 'unknown',
          message: f.message || '',
          line: f.line,
          column: f.column,
        }))
      );
      setIsDirty(false);
    } catch (e) {
      console.error('Failed to save file:', e);
    }
  };

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'editor', label: 'Editor', icon: <FileText size={18} /> },
    { id: 'tokens', label: 'Tokens', icon: <Palette size={18} /> },
    { id: 'diff', label: 'Compare', icon: <GitCompare size={18} /> },
    { id: 'export', label: 'Export', icon: <Download size={18} /> },
    { id: 'tools', label: 'Tools', icon: <Wrench size={18} /> },
  ];

  return (
    <div className="app-layout">
      <Sidebar connected={connected} />

      <div className="main-content">
        <TopBar
          fileName={fileName}
          filePath={filePath}
          onFilePathChange={setFilePath}
          onLoad={handleLoadFile}
          onSave={handleSaveFile}
          isDirty={isDirty}
          connected={connected}
          summary={summary}
        />

        <div className="tabs-bar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${selectedTab === tab.id ? 'active' : ''}`}
              onClick={() => setSelectedTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="content-area">
          {selectedTab === 'editor' && (
            <div className="editor-split-panel">
              <div className="editor-pane">
                <DesignMdEditor />
              </div>
              <div className="validator-pane">
                <TokenValidator />
              </div>
            </div>
          )}

          {selectedTab === 'tokens' && <TokenBrowser />}
          {selectedTab === 'diff' && <DesignDiff />}
          {selectedTab === 'export' && <ExportPanel />}
          {selectedTab === 'tools' && <ToolsPanel />}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ connected }: { connected: boolean }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Design.md</h1>
        <p>IDE Playground</p>
      </div>
      <div className="sidebar-nav">
        <div className="nav-item active">
          <span>Editor</span>
        </div>
      </div>
      <div className="sidebar-footer">
        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></div>
        <span className="status-text">{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  );
}

function TopBar({
  fileName,
  filePath,
  onFilePathChange,
  onLoad,
  onSave,
  isDirty,
  connected,
  summary,
}: {
  fileName: string;
  filePath: string;
  onFilePathChange: (path: string) => void;
  onLoad: () => void;
  onSave: () => void;
  isDirty: boolean;
  connected: boolean;
  summary: { errors: number; warnings: number; infos: number };
}) {
  return (
    <div className="top-bar">
      <div className="file-controls">
        <div className="file-path-input">
          <input
            type="text"
            placeholder="Enter path to DESIGN.md..."
            value={filePath}
            onChange={(e) => onFilePathChange(e.target.value)}
          />
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onLoad}
          disabled={!filePath || !connected}
        >
          <Plus size={14} /> Load
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={onSave}
          disabled={!isDirty || !connected}
        >
          <Save size={14} /> Save
        </button>
      </div>

      <div className="file-info">
        <span className="file-name">{fileName}</span>
        {isDirty && <span className="dirty-indicator">●</span>}
      </div>

      <div className="validation-summary">
        {summary.errors > 0 && (
          <span className="badge-error">
            {summary.errors} error{summary.errors !== 1 ? 's' : ''}
          </span>
        )}
        {summary.warnings > 0 && (
          <span className="badge-warning">
            {summary.warnings} warning{summary.warnings !== 1 ? 's' : ''}
          </span>
        )}
        {summary.errors === 0 && summary.warnings === 0 && (
          <span className="badge-success">Valid</span>
        )}
      </div>
    </div>
  );
}

function ToolsPanel() {
  const [tools, setTools] = useState<Array<{ name: string; description: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    callTool('tools/list', {})
      .then((result) => {
        const data = result as any;
        setTools(data.tools || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="tools-panel">
        <div className="loading">Loading tools</div>
      </div>
    );

  return (
    <div className="tools-panel">
      <div className="tools-grid">
        {tools.length === 0 ? (
          <div className="empty-state">
            <p>No tools available</p>
          </div>
        ) : (
          tools.map((tool) => (
            <div key={tool.name} className="tool-card">
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
