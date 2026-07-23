/**
 * Design.md API endpoints
 * Handles file operations and MCP server communication
 */

import type { Request, Response } from 'express';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

// Mock implementations - replace with actual MCP calls in production
export async function loadDesignFile(req: Request, res: Response): Promise<void> {
  try {
    const { path } = req.query as { path: string };
    if (!path) {
      res.status(400).json({ error: 'Missing path parameter' });
      return;
    }

    if (!existsSync(path)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const content = await readFile(path, 'utf-8');
    res.json({ content, path });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function saveDesignFile(req: Request, res: Response): Promise<void> {
  try {
    const { path, content } = req.body as {
      path: string;
      content: string;
    };

    if (!path || !content) {
      res.status(400).json({ error: 'Missing path or content' });
      return;
    }

    await writeFile(path, content, 'utf-8');
    res.json({ success: true, path });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function lintDesignFile(req: Request, res: Response): Promise<void> {
  try {
    const { path } = req.body as { path: string };
    if (!path) {
      res.status(400).json({ error: 'Missing path parameter' });
      return;
    }

    // Mock response - replace with actual linter call
    const mockReport = {
      findings: [
        {
          level: 'info' as const,
          rule: 'file-loaded',
          message: `File ${path} loaded successfully`,
        },
      ],
      summary: { errors: 0, warnings: 0, infos: 1 },
    };

    res.json(mockReport);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function exportDesignFile(req: Request, res: Response): Promise<void> {
  try {
    const { path, format } = req.body as {
      path: string;
      format: 'tailwind-v3' | 'tailwind-v4' | 'dtcg' | 'json';
    };

    if (!path || !format) {
      res.status(400).json({ error: 'Missing path or format' });
      return;
    }

    // Mock response - replace with actual exporter call
    const mockExport = {
      format,
      content: `// Export for ${path} in ${format} format`,
    };

    res.json(mockExport);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function diffDesignFiles(req: Request, res: Response): Promise<void> {
  try {
    const { beforePath, afterPath } = req.body as {
      beforePath: string;
      afterPath: string;
    };

    if (!beforePath || !afterPath) {
      res.status(400).json({ error: 'Missing beforePath or afterPath' });
      return;
    }

    // Mock response - replace with actual differ call
    const mockDiff = {
      colors: { added: [], removed: [], changed: [], unchanged: [] },
      typography: {
        added: [],
        removed: [],
        changed: [],
        unchanged: [],
      },
      spacing: { added: [], removed: [], changed: [], unchanged: [] },
      components: { added: [], removed: [], changed: [], unchanged: [] },
      regressions: [],
    };

    res.json(mockDiff);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
