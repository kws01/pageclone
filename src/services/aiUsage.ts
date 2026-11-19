const STORAGE_KEY = "pageclone:ai-usage";
const MIN_INTERVAL_MS = 4000;

interface UsageEntry {
  ts: number;
}

interface UsageStore {
  calls: UsageEntry[];
  lastCallTs: number;
}

function loadStore(): UsageStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { calls: [], lastCallTs: 0 };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.calls)) return parsed as UsageStore;
    return { calls: [], lastCallTs: 0 };
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return { calls: [], lastCallTs: 0 };
  }
}

function saveStore(store: UsageStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

function getLosAngelesMidnightMs(): number {
  const now = new Date();
  const laStr = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
  const laDate = new Date(laStr);
  laDate.setHours(0, 0, 0, 0);
  return laDate.getTime();
}

export function recordCall(): void {
  try {
    const store = loadStore();
    const now = Date.now();
    const midnight = getLosAngelesMidnightMs();
    store.calls = store.calls.filter((c) => c.ts >= midnight);
    store.calls.push({ ts: now });
    store.lastCallTs = now;
    if (store.calls.length > 500) store.calls = store.calls.slice(-500);
    saveStore(store);
  } catch {
    // ignore
  }
}

export function canCall(): { ok: boolean; waitMs: number } {
  try {
    const store = loadStore();
    if (!store.lastCallTs) return { ok: true, waitMs: 0 };
    const elapsed = Date.now() - store.lastCallTs;
    if (elapsed >= MIN_INTERVAL_MS) return { ok: true, waitMs: 0 };
    return { ok: false, waitMs: MIN_INTERVAL_MS - elapsed };
  } catch {
    return { ok: true, waitMs: 0 };
  }
}
