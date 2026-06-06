import type { ProblemContext } from "./problem-context";
import type { GenerateHintsRequest, HintLevel } from "./hints";

/** Discriminated union of extension message payloads. */
export type ExtensionMessage =
  | { type: "PING" }
  | { type: "GET_PROBLEM_CONTEXT" }
  | { type: "PROBLEM_CONTEXT"; payload: ProblemContext | null }
  | {
      type: "GENERATE_HINTS";
      payload: GenerateHintsRequest & { level?: HintLevel };
    };

export type ExtensionResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type MessageType = ExtensionMessage["type"];
