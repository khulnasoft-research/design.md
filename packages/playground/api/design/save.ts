import type { VercelRequest, VercelResponse } from '@vercel/node';
import { writeFile } from 'fs/promises';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path: filePath, content } = req.body as { path: string; content: string };
    if (!filePath || !content) {
      return res.status(400).json({ error: 'Missing path or content' });
    }
    await writeFile(filePath, content, 'utf-8');
    res.json({ success: true, path: filePath });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
