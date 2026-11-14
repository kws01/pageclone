const PROMPT_VERSION = "v1";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 30;
const STORAGE_KEY = "pageclone:ai-cache";

interface CacheEntry {
  key: string;
  value: unknown;
  ts: number;
  hits: number;
}

interface CacheStore {
  entries: Record<string, CacheEntry>;
}

function loadStore(): CacheStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: {} };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.entries) return parsed as CacheStore;
    return { entries: {} };
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return { entries: {} };
  }
}

function saveStore(store: CacheStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota exceeded — evict oldest entries and retry
    const entries = Object.values(store.entries).sort((a, b) => a.ts - b.ts);
    const trimmed = entries.slice(Math.floor(entries.length / 2));
    store.entries = {};
    for (const e of trimmed) store.entries[e.key] = e;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* give up */ }
  }
}

function hashKey(task: string, input: unknown): string {
  const inputStr = typeof input === "string" ? input : JSON.stringify(input);
  return `${task}:${PROMPT_VERSION}:${inputStr}`;
}

export function getCached<T>(task: string, input: unknown): T | null {
  try {
    const store = loadStore();
    const key = hashKey(task, input);
    const entry = store.entries[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > TTL_MS) {
      delete store.entries[key];
      saveStore(store);
      return null;
    }
    entry.hits++;
    saveStore(store);
    return entry.value as T;
  } catch {
    return null;
  }
}

export function setCached(task: string, input: unknown, value: unknown): void {
  try {
    const store = loadStore();
    const key = hashKey(task, input);
    store.entries[key] = { key, value, ts: Date.now(), hits: 0 };
    const entries = Object.values(store.entries);
    if (entries.length > MAX_ENTRIES) {
      entries.sort((a, b) => (b.hits || 0) - (a.hits || 0) || b.ts - a.ts);
      store.entries = {};
      for (const e of entries.slice(0, MAX_ENTRIES)) store.entries[e.key] = e;
    }
    saveStore(store);
  } catch {
    // ignore cache write failures
  }
}

export function clearCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function cacheStats(): { count: number; sizeBytes: number } {
  try {
    const store = loadStore();
    const count = Object.keys(store.entries).length;
    const sizeBytes = JSON.stringify(store).length;
    return { count, sizeBytes };
  } catch {
    return { count: 0, sizeBytes: 0 };
  }
}
