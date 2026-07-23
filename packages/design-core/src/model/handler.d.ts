import type { ParsedDesignSystem } from '../parser/spec.js';
import type { ModelSpec, ModelResult, ResolvedColor } from './spec.js';
export declare class ModelHandler implements ModelSpec {
  execute(input: ParsedDesignSystem): ModelResult;
}
export declare function parseColor(raw: string): ResolvedColor;
export declare function contrastRatio(a: ResolvedColor, b: ResolvedColor): number;
//# sourceMappingURL=handler.d.ts.map
