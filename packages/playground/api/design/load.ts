import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    const content = await readFile(filePath, 'utf-8');
    res.json({ content, path: filePath });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
