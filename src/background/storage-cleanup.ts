import type { StorageRecord } from "@/shared/storage/storage.service";

const STORAGE_PREFIX = "if:";

export async function cleanupExpiredKeys(prefix = STORAGE_PREFIX): Promise<number> {
  const all = await chrome.storage.local.get(null);
  const now = Date.now();
  const keysToRemove: string[] = [];

  for (const [key, raw] of Object.entries(all)) {
    if (!key.startsWith(prefix)) continue;

    const record = raw as StorageRecord<unknown>;
    if (
      typeof record === "object" &&
      record !== null &&
      "expiresAt" in record &&
      typeof record.expiresAt === "number" &&
      record.expiresAt <= now
    ) {
      keysToRemove.push(key);
    }
  }

  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
  }

  return keysToRemove.length;
}
