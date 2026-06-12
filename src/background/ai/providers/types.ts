export interface AiCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  responseFormat?: "json" | "text";
  /** Request timeout in ms. Defaults to provider default (15s). */
  timeoutMs?: number;
}

export interface AiCompletionResponse {
  text: string;
  model: string;
}

export interface AiProvider {
  readonly name: string;
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}

export type AiProviderId = "gemini";
