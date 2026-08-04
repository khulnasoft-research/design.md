export interface ParsedColorResult {
  hex: string;
  r: number;
  g: number;
  b: number;
  a?: number;
  luminance: number;
}
export declare function parseCssColor(colorStr: string): ParsedColorResult | null;
//# sourceMappingURL=color-parser.d.ts.map
