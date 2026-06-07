export interface StorageRecord<T> {
  version: number;
  expiresAt?: number;
  data: T;
}

export interface SetOptions {
  version?: number;
  ttlMs?: number;
}

const DEFAULT_VERSION = 1;

function isStorageRecord(value: unknown): value is StorageRecord<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    "data" in value
  );
}

function isExpired(record: StorageRecord<unknown>, now = Date.now()): boolean {
  return record.expiresAt !== undefined && record.expiresAt <= now;
}

class StorageService {
  async get<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.local.get(key);
    const raw = result[key];

    if (raw === undefined) return null;

    if (!isStorageRecord(raw)) {
      return raw as T;
    }

    if (isExpired(raw)) {
      await this.remove(key);
      return null;
    }

    return raw.data as T;
  }

  async set<T>(key: string, data: T, options: SetOptions = {}): Promise<void> {
    const version = options.version ?? DEFAULT_VERSION;
    const record: StorageRecord<T> = { version, data };

    if (options.ttlMs !== undefined) {
      record.expiresAt = Date.now() + options.ttlMs;
    }

    await chrome.storage.local.set({ [key]: record });
  }

  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }

  async clear(): Promise<void> {
    await chrome.storage.local.clear();
  }
}

export const storageService = new StorageService();
