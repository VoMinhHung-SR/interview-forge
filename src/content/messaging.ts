import type { ExtensionMessage, ExtensionResponse, ProblemContext } from "@/shared/types";
import { extractProblemContext } from "@/content/extract-problem-context";

export async function handleGetProblemContext(): Promise<
  ExtensionResponse<ProblemContext | null>
> {
  const context = extractProblemContext(document, window.location.href);
  return { ok: true, data: context };
}

type ContentMessageHandler = (
  message: ExtensionMessage,
) => Promise<ExtensionResponse>;

const handlers: Partial<Record<ExtensionMessage["type"], ContentMessageHandler>> =
  {
    GET_PROBLEM_CONTEXT: handleGetProblemContext,
    PING: async () => ({ ok: true, data: "pong" }),
  };

export async function onContentMessage(
  message: ExtensionMessage,
): Promise<ExtensionResponse> {
  const handler = handlers[message.type];

  if (!handler) {
    return { ok: false, error: `Unhandled content message: ${message.type}` };
  }

  return handler(message);
}
