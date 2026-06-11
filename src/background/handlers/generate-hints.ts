import { getHintEngine } from "@/background/ai";
import { trackHintRequest, trackPattern } from "@/shared/domain";
import { registerHandler } from "@/shared/messaging/router";
import type { ExtensionResponse, HintEngineResponse } from "@/shared/types";

registerHandler("GENERATE_HINTS", async (message) => {
  if (message.type !== "GENERATE_HINTS") {
    return { ok: false, error: "Invalid message type." };
  }

  const engine = getHintEngine();
  if (!engine) {
    return {
      ok: false,
      error:
        "No AI provider configured. Set VITE_GEMINI_API_KEY in .env and rebuild.",
    };
  }

  const result = await engine.generateNextHint(message.payload);

  if (!result.success) {
    return { ok: false, error: result.error.message };
  }

  await trackHintRequest();

  const pattern = result.data.analysis.pattern?.trim();
  if (pattern && pattern !== "Unknown") {
    await trackPattern(pattern);
  }

  return {
    ok: true,
    data: result.data satisfies HintEngineResponse,
  } satisfies ExtensionResponse<HintEngineResponse>;
});
