import type { DesignSystem, DesignToken, TokenDiff } from '../types/index.js';

export function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const lines = content.split('\n');
  let start = -1;
  let end = -1;

  if (lines[0] === '---') {
    start = 0;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        end = i;
        break;
      }
    }
  }

  if (start === -1 || end === -1) {
    return { frontmatter: {}, body: content };
  }

  const yamlLines = lines.slice(start + 1, end);
  const body = lines.slice(end + 1).join('\n');

  const result: Record<string, unknown> = {};
  for (const line of yamlLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();

    result[key] = parseValue(value);
  }

  return { frontmatter: result, body };
}

function parseValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '') return null;
  if (!isNaN(Number(value))) return Number(value);
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  return value;
}

export function serializeFrontmatter(obj: Record<string, unknown>, indent = 0): string {
  const lines: string[] = [];
  const prefix = '  '.repeat(indent);

  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) continue;

    if (typeof val === 'object' && !Array.isArray(val)) {
      lines.push(`${prefix}${key}:`);
      lines.push(serializeFrontmatter(val as Record<string, unknown>, indent + 1));
    } else if (typeof val === 'string') {
      lines.push(`${prefix}${key}: "${val}"`);
    } else if (typeof val === 'boolean') {
      lines.push(`${prefix}${key}: ${val}`);
    } else if (typeof val === 'number') {
      lines.push(`${prefix}${key}: ${val}`);
    } else if (Array.isArray(val)) {
      lines.push(`${prefix}${key}:`);
      for (const item of val) {
        if (typeof item === 'string') {
          lines.push(`${prefix}  - "${item}"`);
        } else {
          lines.push(`${prefix}  - ${item}`);
        }
      }
    }
  }

  return lines.join('\n');
}

export function createDesignMarkdown(
  designSystem: DesignSystem,
  frontmatter?: Record<string, unknown>
): string {
  const fm = frontmatter || {
    name: designSystem.name || 'Design System',
    version: designSystem.version || '1.0.0',
  };

  const yaml = serializeFrontmatter(fm);
  let content = `---\n${yaml}\n---\n\n`;

  if (designSystem.colors && Object.keys(designSystem.colors).length > 0) {
    content += '## Colors\n\n';
    for (const [name, token] of Object.entries(designSystem.colors)) {
      content += `- **${name}**: \`${token.value}\``;
      if (token.description) content += ` — ${token.description}`;
      content += '\n';
    }
    content += '\n';
  }

  if (designSystem.typography && Object.keys(designSystem.typography).length > 0) {
    content += '## Typography\n\n';
    for (const [name, token] of Object.entries(designSystem.typography)) {
      content += `- **${name}**: ${JSON.stringify(token.value)}`;
      if (token.description) content += ` — ${token.description}`;
      content += '\n';
    }
    content += '\n';
  }

  return content;
}

export function extractTokenByPath(designSystem: DesignSystem, path: string): unknown {
  const keys = path.split('.');
  let value: unknown = designSystem;

  for (const key of keys) {
    if (typeof value === 'object' && value !== null && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      throw new Error(`Token path "${path}" not found`);
    }
  }

  return value;
}

export function computeTokenDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): TokenDiff {
  const beforeKeys = new Set(Object.keys(before));
  const afterKeys = new Set(Object.keys(after));

  const added = Array.from(afterKeys).filter((k) => !beforeKeys.has(k));
  const removed = Array.from(beforeKeys).filter((k) => !afterKeys.has(k));
  const unchanged = Array.from(beforeKeys).filter((k) => afterKeys.has(k));
  const changed = unchanged.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));

  return {
    added,
    removed,
    changed,
    unchanged: unchanged.filter((k) => !changed.includes(k)),
  };
}

function hexToRgbInternal(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3])
    throw new Error(`Invalid hex color: ${hex}`);
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

export { hexToRgbInternal as hexToRgb };

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
      .toUpperCase()
  );
}

function luminanceInternal(hex: string): number {
  const [r, g, b] = hexToRgbInternal(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export { luminanceInternal as getLuminance };

export function getContrastRatio(color1: string, color2: string): number {
  const l1 = luminanceInternal(color1);
  const l2 = luminanceInternal(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isWcagCompliant(
  color1: string,
  color2: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(color1, color2);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}
