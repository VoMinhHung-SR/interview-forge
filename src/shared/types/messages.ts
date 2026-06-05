import type { ProblemContext } from "./problem-context";

/** Discriminated union of extension message payloads. */
export type ExtensionMessage =
  | { type: "PING" }
  | { type: "GET_PROBLEM_CONTEXT" }
  | { type: "PROBLEM_CONTEXT"; payload: ProblemContext | null };

export type ExtensionResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type MessageType = ExtensionMessage["type"];
