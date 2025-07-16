"use server";

import { optimizeImageSettings } from "@/ai/flows";
import { OptimizeInputSchema } from "@/ai/flows/optimizer-schemas";
import { z } from "zod";

export async function getOptimalSettings(
  input: z.infer<typeof OptimizeInputSchema>
) {
  const validatedInput = OptimizeInputSchema.safeParse(input);
  if (!validatedInput.success) {
    return { error: "Invalid input", details: validatedInput.error.format() };
  }

  try {
    const result = await optimizeImageSettings(validatedInput.data);
    return { data: result };
  } catch (error) {
    console.error("AI optimization failed:", error);
    return { error: "Failed to get optimization settings from AI." };
  }
}
