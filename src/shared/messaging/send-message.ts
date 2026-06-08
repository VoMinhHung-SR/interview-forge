/**
 * Typed wrapper for chrome.runtime.sendMessage.
 */
import type { ExtensionMessage, ExtensionResponse } from "@/shared/types";
import { sleep } from "@/shared/utils/sleep";

const DEFAULT_RETRIES = 3;

export async function sendMessage<T = unknown>(
  message: ExtensionMessage,
): Promise<ExtensionResponse<T>> {
  let lastError: unknown;

  for (let attempt = 0; attempt < DEFAULT_RETRIES; attempt++) {
    try {
      const response = await chrome.runtime.sendMessage(message);
      if (response !== undefined) {
        return response as ExtensionResponse<T>;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < DEFAULT_RETRIES - 1) {
      await sleep(50 * (attempt + 1));
    }
  }

  const messageText =
    lastError instanceof Error ?
      lastError.message
    : "No response from extension. Reload the extension and try again.";

  return { ok: false, error: messageText };
}
