import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path: filePath, format } = req.body as {
      path: string;
      format: 'tailwind-v3' | 'tailwind-v4' | 'dtcg' | 'json';
    };

    if (!filePath || !format) {
      return res.status(400).json({ error: 'Missing path or format' });
    }

    const mockExport = {
      format,
      content: `// Export for ${filePath} in ${format} format`,
    };

    res.json(mockExport);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
