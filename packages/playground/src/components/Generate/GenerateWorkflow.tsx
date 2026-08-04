import { useState } from 'react';
import {
  Sparkles,
  Send,
  MessageSquare,
  CheckCircle,
  Download,
  Loader2,
  AlertCircle,
  Palette,
  Type,
  Space,
  Box,
} from 'lucide-react';
import {
  generateDesignSystem,
  submitFeedback,
  approveDraft,
  exportDesignSystem,
  type GenerateResponse,
  type FeedbackResponse,
  type SerializedDesignSystem,
} from '../../api';

type WorkflowStep = 'prompt' | 'review' | 'iterate' | 'approve' | 'export';

interface WorkflowState {
  step: WorkflowStep;
  prompt: string;
  generating: boolean;
  error: string;
  generateResult: GenerateResponse | null;
  feedbackResult: FeedbackResponse | null;
  approvedId: string | null;
  exportedContent: string | null;
  exportFormat: string;
}

const initialState: WorkflowState = {
  step: 'prompt',
  prompt: '',
  generating: false,
  error: '',
  generateResult: null,
  feedbackResult: null,
  approvedId: null,
  exportedContent: null,
  exportFormat: '',
};

export default function GenerateWorkflow() {
  const [state, setState] = useState<WorkflowState>(initialState);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const activeDesignSystem: SerializedDesignSystem | null =
    state.feedbackResult?.designSystem ||
    state.generateResult?.draft?.designSystem ||
    null;

  const handleGenerate = async () => {
    if (!state.prompt.trim()) return;

    setState((s) => ({ ...s, generating: true, error: '' }));
    try {
      const result = await generateDesignSystem({ prompt: state.prompt });
      setState((s) => ({
        ...s,
        generating: false,
        generateResult: result,
        step: result.draft ? 'review' : 'prompt',
        error: result.draft ? '' : result.acknowledgment.message,
      }));
    } catch (e) {
      setState((s) => ({ ...s, generating: false, error: (e as Error).message }));
    }
  };

  const handleFeedback = async () => {
    if (!feedbackMessage.trim() || !state.generateResult?.draft) return;

    setFeedbackLoading(true);
    try {
      const result = await submitFeedback({
        draftId: state.generateResult.draft.id,
        message: feedbackMessage,
        type: 'refine',
      });
      setState((s) => ({ ...s, feedbackResult: result, step: 'iterate' }));
      setFeedbackMessage('');
    } catch (e) {
      setState((s) => ({ ...s, error: (e as Error).message }));
    }
    setFeedbackLoading(false);
  };

  const handleApprove = async (action: 'approve' | 'reject') => {
    if (!state.generateResult?.draft) return;

    setState((s) => ({ ...s, generating: true, error: '' }));
    try {
      const result = await approveDraft({
        draftId: state.generateResult.draft.id,
        action,
        notes: action === 'approve' ? 'Approved from playground' : undefined,
      });
      setState((s) => ({
        ...s,
        generating: false,
        approvedId: result.designSystemId,
        step: action === 'approve' ? 'export' : 'review',
      }));
    } catch (e) {
      setState((s) => ({ ...s, generating: false, error: (e as Error).message }));
    }
  };

  const handleExport = async (format: 'tailwind-v4' | 'tailwind-v3' | 'dtcg' | 'css') => {
    if (!state.approvedId) return;

    setState((s) => ({ ...s, generating: true, error: '' }));
    try {
      const result = await exportDesignSystem({
        designSystemId: state.approvedId,
        format,
      });
      setState((s) => ({
        ...s,
        generating: false,
        exportedContent: result.content,
        exportFormat: format,
      }));
    } catch (e) {
      setState((s) => ({ ...s, generating: false, error: (e as Error).message }));
    }
  };

  return (
    <div className="generate-workflow">
      <WorkflowHeader step={state.step} />

      {state.error && (
        <div className="gw-error">
          <AlertCircle size={16} />
          <span>{state.error}</span>
          <button onClick={() => setState((s) => ({ ...s, error: '' }))}>dismiss</button>
        </div>
      )}

      <div className="gw-body">
        {/* Left: Prompt & Controls */}
        <div className="gw-sidebar">
          <PromptSection
            prompt={state.prompt}
            onChange={(p) => setState((s) => ({ ...s, prompt: p }))}
            onGenerate={handleGenerate}
            generating={state.generating}
            disabled={state.step !== 'prompt' && state.step !== 'review'}
          />

          {activeDesignSystem && (
            <FeedbackSection
              message={feedbackMessage}
              onChange={setFeedbackMessage}
              onSubmit={handleFeedback}
              loading={feedbackLoading}
            />
          )}

          {(state.step === 'approve' || state.step === 'export') && (
            <ApprovalSection
              onApprove={() => handleApprove('approve')}
              onReject={() => handleApprove('reject')}
              generating={state.generating}
              approved={!!state.approvedId}
            />
          )}

          {state.approvedId && (
            <ExportSection
              onExport={handleExport}
              generating={state.generating}
              exportedFormat={state.exportFormat}
            />
          )}
        </div>

        {/* Right: Design System Preview */}
        <div className="gw-preview">
          {activeDesignSystem ? (
            <DesignSystemPreview ds={activeDesignSystem} />
          ) : (
            <EmptyPreview generating={state.generating} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function WorkflowHeader({ step }: { step: WorkflowStep }) {
  const steps: Array<{ id: WorkflowStep; label: string }> = [
    { id: 'prompt', label: 'Write Prompt' },
    { id: 'review', label: 'Review Draft' },
    { id: 'iterate', label: 'Iterate' },
    { id: 'approve', label: 'Approve' },
    { id: 'export', label: 'Export' },
  ];

  const currentIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="gw-header">
      <div className="gw-steps">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`gw-step ${i <= currentIndex ? 'active' : ''} ${i === currentIndex ? 'current' : ''}`}
          >
            <div className="gw-step-dot" />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptSection({
  prompt,
  onChange,
  onGenerate,
  generating,
  disabled,
}: {
  prompt: string;
  onChange: (p: string) => void;
  onGenerate: () => void;
  generating: boolean;
  disabled: boolean;
}) {
  return (
    <div className="gw-card">
      <div className="gw-card-header">
        <Sparkles size={16} />
        <h3>Design Prompt</h3>
      </div>
      <textarea
        className="gw-prompt-input"
        placeholder="Describe the design system you want to create...&#10;&#10;Example: A modern SaaS dashboard with a deep blue primary color, clean sans-serif typography, generous spacing, and a professional feel."
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={6}
      />
      <button
        className="btn btn-primary gw-generate-btn"
        onClick={onGenerate}
        disabled={generating || !prompt.trim() || disabled}
      >
        {generating ? (
          <>
            <Loader2 size={16} className="spin" /> Generating...
          </>
        ) : (
          <>
            <Send size={16} /> Generate Design System
          </>
        )}
      </button>
    </div>
  );
}

function FeedbackSection({
  message,
  onChange,
  onSubmit,
  loading,
}: {
  message: string;
  onChange: (m: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="gw-card">
      <div className="gw-card-header">
        <MessageSquare size={16} />
        <h3>Refine Design</h3>
      </div>
      <textarea
        className="gw-prompt-input"
        placeholder="Describe changes... e.g. 'Make the primary color darker' or 'Add more spacing between sections'"
        value={message}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
      <button
        className="btn btn-secondary"
        onClick={onSubmit}
        disabled={loading || !message.trim()}
      >
        {loading ? <Loader2 size={14} className="spin" /> : <MessageSquare size={14} />}
        Submit Feedback
      </button>
    </div>
  );
}

function ApprovalSection({
  onApprove,
  onReject,
  generating,
  approved,
}: {
  onApprove: () => void;
  onReject: () => void;
  generating: boolean;
  approved: boolean;
}) {
  return (
    <div className="gw-card">
      <div className="gw-card-header">
        <CheckCircle size={16} />
        <h3>Approval</h3>
      </div>
      {approved ? (
        <div className="gw-approved-badge">
          <CheckCircle size={16} />
          <span>Design System Approved</span>
        </div>
      ) : (
        <div className="gw-approval-actions">
          <button
            className="btn btn-primary"
            onClick={onApprove}
            disabled={generating}
          >
            <CheckCircle size={14} /> Approve
          </button>
          <button
            className="btn btn-danger"
            onClick={onReject}
            disabled={generating}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function ExportSection({
  onExport,
  generating,
  exportedFormat,
}: {
  onExport: (f: 'tailwind-v4' | 'tailwind-v3' | 'dtcg' | 'css') => void;
  generating: boolean;
  exportedFormat: string;
}) {
  const formats: Array<{ id: 'tailwind-v4' | 'tailwind-v3' | 'dtcg' | 'css'; label: string }> = [
    { id: 'tailwind-v4', label: 'Tailwind v4' },
    { id: 'tailwind-v3', label: 'Tailwind v3' },
    { id: 'dtcg', label: 'W3C DTCG' },
    { id: 'css', label: 'CSS Variables' },
  ];

  return (
    <div className="gw-card">
      <div className="gw-card-header">
        <Download size={16} />
        <h3>Export</h3>
      </div>
      <div className="gw-export-grid">
        {formats.map((f) => (
          <button
            key={f.id}
            className={`btn btn-secondary gw-export-btn ${exportedFormat === f.id ? 'exported' : ''}`}
            onClick={() => onExport(f.id)}
            disabled={generating}
          >
            <Download size={14} />
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DesignSystemPreview({ ds }: { ds: SerializedDesignSystem }) {
  return (
    <div className="gw-ds-preview">
      <div className="gw-ds-header">
        <h3>{ds.name || 'Generated Design System'}</h3>
        {ds.description && <p>{ds.description}</p>}
      </div>

      {/* Colors */}
      {Object.keys(ds.colors).length > 0 && (
        <div className="gw-ds-section">
          <div className="gw-ds-section-title">
            <Palette size={14} /> Colors
          </div>
          <div className="gw-color-grid">
            {Object.entries(ds.colors).map(([name, color]) => (
              <div key={name} className="gw-color-swatch">
                <div
                  className="gw-color-preview"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="gw-color-info">
                  <span className="gw-color-name">{name}</span>
                  <span className="gw-color-hex">{color.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Typography */}
      {Object.keys(ds.typography).length > 0 && (
        <div className="gw-ds-section">
          <div className="gw-ds-section-title">
            <Type size={14} /> Typography
          </div>
          <div className="gw-type-list">
            {Object.entries(ds.typography).map(([name, token]) => {
              const t = token as Record<string, unknown>;
              const fontSize = t.fontSize as { value: number; unit: string } | undefined;
              return (
                <div key={name} className="gw-type-item">
                  <span className="gw-type-name">{name}</span>
                  <span className="gw-type-detail">
                    {t.fontFamily as string}
                    {fontSize ? ` / ${fontSize.value}${fontSize.unit}` : ''}
                    {t.fontWeight ? ` / ${t.fontWeight}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacing */}
      {Object.keys(ds.spacing).length > 0 && (
        <div className="gw-ds-section">
          <div className="gw-ds-section-title">
            <Space size={14} /> Spacing
          </div>
          <div className="gw-spacing-list">
            {Object.entries(ds.spacing).map(([name, token]) => {
              const t = token as { value: number; unit: string };
              return (
                <div key={name} className="gw-spacing-item">
                  <div className="gw-spacing-bar" style={{ width: `${Math.min(t.value * 4, 200)}px` }} />
                  <span className="gw-spacing-name">{name}</span>
                  <span className="gw-spacing-value">
                    {t.value}
                    {t.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Border Radius */}
      {Object.keys(ds.rounded).length > 0 && (
        <div className="gw-ds-section">
          <div className="gw-ds-section-title">
            <Box size={14} /> Border Radius
          </div>
          <div className="gw-rounded-list">
            {Object.entries(ds.rounded).map(([name, token]) => {
              const t = token as { value: number; unit: string };
              return (
                <div key={name} className="gw-rounded-item">
                  <div
                    className="gw-rounded-preview"
                    style={{ borderRadius: `${t.value}${t.unit}` }}
                  />
                  <span className="gw-rounded-name">{name}</span>
                  <span className="gw-rounded-value">
                    {t.value}
                    {t.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Components */}
      {Object.keys(ds.components).length > 0 && (
        <div className="gw-ds-section">
          <div className="gw-ds-section-title">
            <Box size={14} /> Components
          </div>
          <div className="gw-component-list">
            {Object.entries(ds.components).map(([name, comp]) => (
              <div key={name} className="gw-component-item">
                <span className="gw-component-name">{name}</span>
                <span className="gw-component-props">
                  {Object.keys((comp as { properties: Record<string, unknown> }).properties || {}).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyPreview({ generating }: { generating: boolean }) {
  return (
    <div className="gw-empty-preview">
      {generating ? (
        <>
          <Loader2 size={48} className="spin" />
          <h3>Generating design system...</h3>
          <p>AI is analyzing your prompt and creating tokens</p>
        </>
      ) : (
        <>
          <Sparkles size={48} />
          <h3>Design System Preview</h3>
          <p>Write a prompt and click Generate to see your design system here</p>
        </>
      )}
    </div>
  );
}
