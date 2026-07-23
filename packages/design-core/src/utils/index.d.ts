import type { DesignSystem, TokenDiff } from '../types/index.js';
export declare function parseFrontmatter(content: string): {
    frontmatter: Record<string, unknown>;
    body: string;
};
export declare function serializeFrontmatter(obj: Record<string, unknown>, indent?: number): string;
export declare function createDesignMarkdown(designSystem: DesignSystem, frontmatter?: Record<string, unknown>): string;
export declare function extractTokenByPath(designSystem: DesignSystem, path: string): unknown;
export declare function computeTokenDiff(before: Record<string, unknown>, after: Record<string, unknown>): TokenDiff;
declare function hexToRgbInternal(hex: string): [number, number, number];
export { hexToRgbInternal as hexToRgb };
export declare function rgbToHex(r: number, g: number, b: number): string;
declare function luminanceInternal(hex: string): number;
export { luminanceInternal as getLuminance };
export declare function getContrastRatio(color1: string, color2: string): number;
export declare function isWcagCompliant(color1: string, color2: string, level?: 'AA' | 'AAA'): boolean;
//# sourceMappingURL=index.d.ts.map