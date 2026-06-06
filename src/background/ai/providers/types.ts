export interface AiCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  responseFormat?: "json" | "text";
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
