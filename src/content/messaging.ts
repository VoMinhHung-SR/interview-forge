import type {
  AnalysisContext,
  ExtensionMessage,
  ExtensionResponse,
  ProblemContext,
} from "@/shared/types";
import { extractProblemContext } from "@/content/extract-problem-context";
import { extractSolutionCode } from "@/content/platforms/leetcode/extract-solution-code";

export async function handleGetProblemContext(): Promise<
  ExtensionResponse<ProblemContext | null>
> {
  const context = extractProblemContext(document, window.location.href);
  return { ok: true, data: context };
}

export async function handleGetAnalysisContext(): Promise<
  ExtensionResponse<AnalysisContext>
> {
  const problem = extractProblemContext(document, window.location.href);
  const solution = extractSolutionCode(document);

  return {
    ok: true,
    data: { problem, solution },
  };
}

type ContentMessageHandler = (
  message: ExtensionMessage,
) => Promise<ExtensionResponse>;

const handlers: Partial<Record<ExtensionMessage["type"], ContentMessageHandler>> =
  {
    GET_PROBLEM_CONTEXT: handleGetProblemContext,
    GET_ANALYSIS_CONTEXT: handleGetAnalysisContext,
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
