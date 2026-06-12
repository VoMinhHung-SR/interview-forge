export const LOCALE_STORAGE_KEY = "interview_forge_locale";

export const PENDING_COACH_ACTION_KEY = "pendingCoachAction";

export type PendingCoachAction = "hint" | "review";

export const CONTEXT_MENU_IDS = {
  parent: "interview-forge",
  hint: "interview-forge-hint",
  review: "interview-forge-review",
} as const;
