import type { ProblemContext } from "@/shared/types";

const SNAPSHOT_TTL_MS = 30_000;

interface TabSnapshot {
  url: string;
  context: ProblemContext;
  at: number;
}

const snapshots = new Map<number, TabSnapshot>();

export function setTabSnapshot(
  tabId: number,
  url: string,
  context: ProblemContext,
): void {
  snapshots.set(tabId, { url, context, at: Date.now() });
}

export function getTabSnapshot(
  tabId: number,
  url: string,
): ProblemContext | null {
  const snapshot = snapshots.get(tabId);
  if (!snapshot) return null;
  if (snapshot.url !== url) return null;
  if (Date.now() - snapshot.at > SNAPSHOT_TTL_MS) return null;
  return snapshot.context;
}

export function clearTabSnapshot(tabId: number): void {
  snapshots.delete(tabId);
}
