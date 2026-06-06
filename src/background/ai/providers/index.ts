import { createGeminiProvider } from "./gemini";
import type { AiProvider, AiProviderId } from "./types";

export type { AiCompletionRequest, AiCompletionResponse, AiProvider } from "./types";

/** Creates the Gemini AI provider. Returns null if no API key is configured. */
export function createAiProvider(): AiProvider | null {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!geminiKey?.trim()) return null;
  return createGeminiProvider(geminiKey.trim());
}

export function getActiveProviderId(): AiProviderId | null {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  return geminiKey?.trim() ? "gemini" : null;
}

export { createGeminiProvider };
