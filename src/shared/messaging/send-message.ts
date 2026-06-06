/**
 * Typed wrapper for chrome.runtime.sendMessage.
 */
import type { ExtensionMessage, ExtensionResponse } from "@/shared/types";

export async function sendMessage<T = unknown>(
  message: ExtensionMessage,
): Promise<ExtensionResponse<T>> {
  return chrome.runtime.sendMessage(message);
}
