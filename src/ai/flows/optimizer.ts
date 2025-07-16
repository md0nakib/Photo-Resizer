'use server';
/**
 * @fileOverview An AI flow to recommend optimal image conversion settings.
 *
 * - optimizeImageSettings - A function that recommends optimal image conversion settings.
 */
import { ai } from '@/ai/genkit';
import {
  OptimizeInputSchema,
  OptimizeOutputSchema,
  type OptimizeInput,
  type OptimizeOutput,
} from './optimizer-schemas';

export async function optimizeImageSettings(
  input: OptimizeInput
): Promise<OptimizeOutput> {
  return optimizeImageSettingsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeImagePrompt',
  input: { schema: OptimizeInputSchema },
  output: { schema: OptimizeOutputSchema },
  prompt: `
        Analyze the following image properties and recommend the optimal conversion settings based on the user's goal.
        - File Name: {{{fileName}}}
        - Original Format: {{{fileType}}}
        - Original Size: {{fileSize}}
        - Optimization Goal: "{{{optimizationGoal}}}"

        Provide your recommendation in a structured JSON format.
        - "format": Choose one from "jpeg", "png", "webp".
        - "quality": An integer between 50 and 95.
        - "reasoning": A brief explanation for your choices. For example: "Switched to WebP for better web performance and applied 80% quality for a good balance."

        Guidelines:
        - For 'web', prioritize 'webp' for its balance of quality and small file size. Use a quality around 80.
        - For 'storage', prioritize 'jpeg' with a lower quality (around 70-75) to maximize space savings, unless transparency is needed (then use 'png').
        - For 'quality', prioritize 'png' for lossless compression or 'jpeg'/'webp' with a high quality setting (around 90-95).
        - If the original format is png and the goal is not 'quality', strongly consider converting to webp or jpeg to save space.
        - If the original is a gif, suggest converting to webp.
        `,
});

const optimizeImageSettingsFlow = ai.defineFlow(
  {
    name: 'optimizeImageSettingsFlow',
    inputSchema: OptimizeInputSchema,
    outputSchema: OptimizeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get a structured response from the AI.');
    }
    return output;
  }
);
