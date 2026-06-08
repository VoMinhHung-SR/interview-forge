/**
 * Content script entry point.
 * Detects platform, extracts problem context, and handles tab messages.
 */

import { detectPlatform } from "@/content/platforms";
import { onContentMessage } from "@/content/messaging";

declare global {
  interface Window {
    __ifContentScriptLoaded?: boolean;
  }
}

if (window.__ifContentScriptLoaded) {
  // Avoid duplicate listeners when the script is injected programmatically.
} else {
  window.__ifContentScriptLoaded = true;

  const platform = detectPlatform(window.location.href);

  console.info(
    "[Coding Interview Coach] Content script loaded:",
    platform ?? "unsupported",
  );

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    onContentMessage(message)
      .then(sendResponse)
      .catch((error: unknown) => {
        const messageText =
          error instanceof Error ? error.message : "Content script error";
        sendResponse({ ok: false, error: messageText });
      });

    return true;
  });
}
