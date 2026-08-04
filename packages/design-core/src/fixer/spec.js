import { z } from 'zod';
export const FixerInputSchema = z.object({
    content: z.string(),
    sections: z.array(z.object({
        heading: z.string(),
        content: z.string(),
    })),
});
//# sourceMappingURL=spec.js.map