/**
 * Design system management service
 * Handles all design.md file operations and state management
 */

import type {
  DesignSystem,
  LintReport,
  ExportResult,
  DesignDiffReport,
} from '@scalify/design-core';

export class DesignService {
  private designSystem: DesignSystem | null = null;
  private filePath: string = '';
  private lastModified: Date | null = null;

  async loadFromFile(path: string): Promise<DesignSystem> {
    try {
      const response = await fetch(`/api/design/load?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error(`Failed to load file: ${response.statusText}`);
      const data = await response.json();
      this.designSystem = data.designSystem;
      this.filePath = path;
      this.lastModified = new Date();
      return data.designSystem;
    } catch (error) {
      throw new Error(
        `Error loading design file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async saveToFile(path: string, content: string): Promise<void> {
    try {
      const response = await fetch('/api/design/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content }),
      });
      if (!response.ok) throw new Error(`Failed to save file: ${response.statusText}`);
      this.filePath = path;
      this.lastModified = new Date();
    } catch (error) {
      throw new Error(
        `Error saving design file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async lint(path: string): Promise<LintReport> {
    try {
      const response = await fetch('/api/design/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      if (!response.ok) throw new Error(`Failed to lint file: ${response.statusText}`);
      return response.json();
    } catch (error) {
      throw new Error(
        `Error linting design file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async export(
    path: string,
    format: 'tailwind-v3' | 'tailwind-v4' | 'dtcg' | 'json'
  ): Promise<ExportResult> {
    try {
      const response = await fetch('/api/design/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, format }),
      });
      if (!response.ok) throw new Error(`Failed to export file: ${response.statusText}`);
      return response.json();
    } catch (error) {
      throw new Error(
        `Error exporting design file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async diff(beforePath: string, afterPath: string): Promise<DesignDiffReport> {
    try {
      const response = await fetch('/api/design/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beforePath, afterPath }),
      });
      if (!response.ok) throw new Error(`Failed to diff files: ${response.statusText}`);
      return response.json();
    } catch (error) {
      throw new Error(
        `Error diffing design files: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getDesignSystem(): DesignSystem | null {
    return this.designSystem;
  }

  getFilePath(): string {
    return this.filePath;
  }

  getLastModified(): Date | null {
    return this.lastModified;
  }

  clear(): void {
    this.designSystem = null;
    this.filePath = '';
    this.lastModified = null;
  }
}

export const designService = new DesignService();
