/**
 * Background service worker entry point.
 * Orchestrates message routing and will host AI API calls in later milestones.
 */

import "@/background/handlers/get-problem-context";
import "@/background/handlers/generate-hints";
import "@/background/handlers/translate-problem";
import { onMessage } from "@/shared/messaging/router";

chrome.runtime.onInstalled.addListener(() => {
  console.info("[Coding Interview Coach] Extension installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  onMessage(message, sender)
    .then(sendResponse)
    .catch((error: unknown) => {
      const messageText =
        error instanceof Error ? error.message : "Unknown background error";
      sendResponse({ ok: false, error: messageText });
    });

  return true;
});
