import type { ExtensionMessage, ExtensionResponse } from "@/shared/types";

type MessageHandler = (
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
) => Promise<ExtensionResponse>;

const handlers: Partial<Record<ExtensionMessage["type"], MessageHandler>> = {};

export function registerHandler(
  type: ExtensionMessage["type"],
  handler: MessageHandler,
): void {
  handlers[type] = handler;
}

export async function onMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
): Promise<ExtensionResponse> {
  const handler = handlers[message.type];

  if (!handler) {
    return { ok: false, error: `Unhandled message type: ${message.type}` };
  }

  return handler(message, sender);
}
