import { getTranslationEngine } from "@/background/ai";
import {
  getTranslationCache,
  setTranslationCache,
} from "@/background/storage/cache.service";
import { registerHandler } from "@/shared/messaging/router";
import type { ExtensionResponse, TranslateProblemResponse } from "@/shared/types";

registerHandler("TRANSLATE_PROBLEM", async (message) => {
  if (message.type !== "TRANSLATE_PROBLEM") {
    return { ok: false, error: "Invalid message type." };
  }

  const { problemId, description, language } = message.payload;

  if (language !== "vi") {
    return {
      ok: true,
      data: {
        translatedDescription: description,
        fromCache: false,
      } satisfies TranslateProblemResponse,
    };
  }

  const cached = await getTranslationCache(problemId, language);
  if (cached) {
    return {
      ok: true,
      data: {
        translatedDescription: cached.translatedDescription,
        fromCache: true,
      } satisfies TranslateProblemResponse,
    };
  }

  const engine = getTranslationEngine();
  if (!engine) {
    return {
      ok: false,
      error:
        "No AI provider configured. Set VITE_GEMINI_API_KEY in .env and rebuild.",
    };
  }

  const result = await engine.translateProblem(message.payload);

  if (!result.success) {
    return { ok: false, error: result.error.message };
  }

  await setTranslationCache({
    problemId,
    language,
    translatedDescription: result.data.translatedDescription,
    createdAt: Date.now(),
  });

  return {
    ok: true,
    data: {
      translatedDescription: result.data.translatedDescription,
      fromCache: false,
    } satisfies TranslateProblemResponse,
  } satisfies ExtensionResponse<TranslateProblemResponse>;
});
