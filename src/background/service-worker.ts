/**
 * Background service worker entry point.
 * Orchestrates message routing and will host AI API calls in later milestones.
 */

import "@/background/handlers/get-problem-context";
import "@/background/handlers/popup-init";
import "@/background/handlers/generate-hints";
import "@/background/handlers/translate-problem";
import "@/background/handlers/persistence";
import "@/background/handlers/analyze-solution";
import "@/background/handlers/context-menu";
import { initCoachContextMenus } from "@/background/context-menu";
import { cleanupExpiredKeys } from "@/background/storage-cleanup";
import { onMessage } from "@/shared/messaging/router";

const CLEANUP_ALARM = "if-storage-cleanup";

initCoachContextMenus();

chrome.runtime.onInstalled.addListener(() => {
  console.info("[Coding Interview Coach] Extension installed");
  void chrome.alarms.create(CLEANUP_ALARM, { periodInMinutes: 24 * 60 });
});

chrome.runtime.onStartup.addListener(() => {
  void chrome.alarms.create(CLEANUP_ALARM, { periodInMinutes: 24 * 60 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== CLEANUP_ALARM) return;
  void cleanupExpiredKeys();
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
