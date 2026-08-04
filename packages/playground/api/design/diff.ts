import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { beforePath, afterPath } = req.body as {
      beforePath: string;
      afterPath: string;
    };

    if (!beforePath || !afterPath) {
      return res.status(400).json({ error: 'Missing beforePath or afterPath' });
    }

    const mockDiff = {
      colors: { added: [], removed: [], changed: [], unchanged: [] },
      typography: { added: [], removed: [], changed: [], unchanged: [] },
      spacing: { added: [], removed: [], changed: [], unchanged: [] },
      components: { added: [], removed: [], changed: [], unchanged: [] },
      regressions: [],
    };

    res.json(mockDiff);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
