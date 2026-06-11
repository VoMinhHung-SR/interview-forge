import {
  CONTEXT_MENU_IDS,
  LOCALE_STORAGE_KEY,
  PENDING_COACH_ACTION_KEY,
  type PendingCoachAction,
} from "@/shared/constants/extension-storage";
import type { AppLocale } from "@/shared/types";

const LEETCODE_URL_PATTERNS = [
  "https://leetcode.com/problems/*",
  "https://www.leetcode.com/problems/*",
];

const MENU_TITLES: Record<AppLocale, { parent: string; hint: string; review: string }> =
  {
    en: {
      parent: "Interview Forge",
      hint: "Get Hint",
      review: "Review Code",
    },
    vi: {
      parent: "Interview Forge",
      hint: "Gợi ý",
      review: "Nhận xét code",
    },
  };

async function readLocale(): Promise<AppLocale> {
  const result = await chrome.storage.local.get(LOCALE_STORAGE_KEY);
  const stored = result[LOCALE_STORAGE_KEY];
  return stored === "vi" ? "vi" : "en";
}

export async function registerCoachContextMenus(): Promise<void> {
  await chrome.contextMenus.removeAll();

  const locale = await readLocale();
  const titles = MENU_TITLES[locale];

  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.parent,
    title: titles.parent,
    contexts: ["page"],
    documentUrlPatterns: LEETCODE_URL_PATTERNS,
  });

  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.hint,
    parentId: CONTEXT_MENU_IDS.parent,
    title: titles.hint,
    contexts: ["page"],
    documentUrlPatterns: LEETCODE_URL_PATTERNS,
  });

  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.review,
    parentId: CONTEXT_MENU_IDS.parent,
    title: titles.review,
    contexts: ["page"],
    documentUrlPatterns: LEETCODE_URL_PATTERNS,
  });
}

function actionForMenuId(menuItemId: string | number): PendingCoachAction | null {
  if (menuItemId === CONTEXT_MENU_IDS.hint) return "hint";
  if (menuItemId === CONTEXT_MENU_IDS.review) return "review";
  return null;
}

export function initCoachContextMenus(): void {
  chrome.runtime.onInstalled.addListener(() => {
    void registerCoachContextMenus();
  });

  chrome.runtime.onStartup.addListener(() => {
    void registerCoachContextMenus();
  });

  chrome.contextMenus.onClicked.addListener((info) => {
    const action = actionForMenuId(info.menuItemId);
    if (!action) return;

    void (async () => {
      await chrome.storage.session.set({ [PENDING_COACH_ACTION_KEY]: action });

      try {
        await chrome.action.openPopup();
      } catch {
        /* Popup opens on next toolbar click; pending action is stored. */
      }
    })();
  });
}
