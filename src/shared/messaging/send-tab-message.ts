import type { ExtensionMessage, ExtensionResponse } from "@/shared/types";
import { sleep } from "@/shared/utils/sleep";

function getContentScriptFiles(): string[] {
  const scripts = chrome.runtime.getManifest().content_scripts;
  return scripts?.[0]?.js ?? [];
}

async function injectContentScripts(tabId: number): Promise<boolean> {
  const files = getContentScriptFiles();
  if (files.length === 0) return false;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files,
    });
    return true;
  } catch {
    return false;
  }
}

function isMissingContentScript(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Receiving end does not exist")
  );
}

export async function sendTabMessage<T>(
  tabId: number,
  message: ExtensionMessage,
  options: { retries?: number } = {},
): Promise<ExtensionResponse<T> | undefined> {
  const retries = options.retries ?? 3;
  let injected = false;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      if (!injected && isMissingContentScript(error)) {
        injected = await injectContentScripts(tabId);
        if (injected) {
          await sleep(100);
          continue;
        }
      }

      if (attempt < retries - 1) {
        await sleep(75 * (attempt + 1));
      }
    }
  }

  return undefined;
}
