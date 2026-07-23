import { create } from 'zustand';

export interface LintFinding {
  level: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  line?: number;
  column?: number;
}

export interface DesignMdState {
  // Content state
  content: string;
  setContent: (content: string) => void;

  // Validation state
  findings: LintFinding[];
  setFindings: (findings: LintFinding[]) => void;
  summary: { errors: number; warnings: number; infos: number };
  setSummary: (summary: { errors: number; warnings: number; infos: number }) => void;

  // Design system state
  designSystem: Record<string, unknown> | null;
  setDesignSystem: (ds: Record<string, unknown> | null) => void;

  // UI state
  selectedTab: 'editor' | 'tokens' | 'diff' | 'export' | 'tools';
  setSelectedTab: (tab: 'editor' | 'tokens' | 'diff' | 'export' | 'tools') => void;

  // File state
  fileName: string;
  setFileName: (name: string) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;

  // Reset
  reset: () => void;
}

export const useDesignMdState = create<DesignMdState>((set) => ({
  content: '',
  setContent: (content) => {
    set({ content, isDirty: true });
  },

  findings: [],
  setFindings: (findings) => {
    const summary = {
      errors: findings.filter((f) => f.level === 'error').length,
      warnings: findings.filter((f) => f.level === 'warning').length,
      infos: findings.filter((f) => f.level === 'info').length,
    };
    set({ findings, summary });
  },

  summary: { errors: 0, warnings: 0, infos: 0 },
  setSummary: (summary) => set({ summary }),

  designSystem: null,
  setDesignSystem: (designSystem) => set({ designSystem }),

  selectedTab: 'editor',
  setSelectedTab: (selectedTab) => set({ selectedTab }),

  fileName: 'DESIGN.md',
  setFileName: (fileName) => set({ fileName }),

  isDirty: false,
  setIsDirty: (isDirty) => set({ isDirty }),

  reset: () =>
    set({
      content: '',
      findings: [],
      summary: { errors: 0, warnings: 0, infos: 0 },
      designSystem: null,
      selectedTab: 'editor',
      fileName: 'DESIGN.md',
      isDirty: false,
    }),
}));
