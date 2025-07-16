import { z } from 'zod';

export const OptimizeInputSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  optimizationGoal: z.enum(['web', 'storage', 'quality']),
});
export type OptimizeInput = z.infer<typeof OptimizeInputSchema>;

export const OptimizeOutputSchema = z.object({
  format: z.enum(['jpeg', 'png', 'webp']),
  quality: z.number().min(1).max(100),
  width: z.number().optional(),
  height: z.number().optional(),
  reasoning: z.string(),
});
export type OptimizeOutput = z.infer<typeof OptimizeOutputSchema>;
