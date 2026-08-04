import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path: filePath } = req.body as { path: string };
    if (!filePath) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    const mockReport = {
      findings: [{
        level: 'info' as const,
        rule: 'file-loaded',
        message: `File ${filePath} loaded successfully`,
      }],
      summary: { errors: 0, warnings: 0, infos: 1 },
    };

    res.json(mockReport);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
