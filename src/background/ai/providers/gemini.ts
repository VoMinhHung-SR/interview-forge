import { formatAiError } from "@/background/ai/format-ai-error";
import { isQuotaError, isRetryableError, sleep } from "@/background/ai/retry-utils";
import { fetchWithTimeout } from "@/shared/utils/timeout";
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProvider,
} from "./types";

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 15_000;

function getGeminiModel(): string {
  const configured = import.meta.env.VITE_GEMINI_MODEL as string | undefined;
  return configured?.trim() || DEFAULT_MODEL;
}

async function callGeminiModel(
  apiKey: string,
  model: string,
  request: AiCompletionRequest,
): Promise<AiCompletionResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: request.systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: request.userPrompt }] }],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          responseMimeType:
            request.responseFormat === "json" ? "application/json" : "text/plain",
        },
      }),
    },
    request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  const body = await response.text();

  if (!response.ok) {
    const error = new Error(`Gemini API error (${response.status}): ${body}`);
    (error as GeminiApiError).status = response.status;
    (error as GeminiApiError).body = body;
    throw error;
  }

  const data = JSON.parse(body) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response");

  return { text, model };
}

interface GeminiApiError extends Error {
  status?: number;
  body?: string;
}

export function createGeminiProvider(apiKey: string): AiProvider {
  const model = getGeminiModel();

  return {
    name: model,

    async complete(
      request: AiCompletionRequest,
    ): Promise<AiCompletionResponse> {
      try {
        return await callGeminiModel(apiKey, model, request);
      } catch (error) {
        const apiError = error as GeminiApiError;
        const status = apiError.status ?? 0;
        const body = apiError.body ?? apiError.message;

        if (isQuotaError(status, body)) {
          throw new Error(formatAiError("429 RESOURCE_EXHAUSTED"));
        }

        if (isRetryableError(status, body)) {
          await sleep(2000);
          return await callGeminiModel(apiKey, model, request);
        }

        throw new Error(formatAiError(apiError.message));
      }
    },
  };
}
