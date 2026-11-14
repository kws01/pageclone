import type { ExtractedPage } from "@/parser/extractPage";

const KEY = "pageclone:current";
const HISTORY = "pageclone:history";

export function saveCurrent(page: ExtractedPage) {
  if (typeof window === "undefined") return;
  try {
    // rawHtml is the largest field; drop it to save quota
    const slim = { ...page, rawHtml: "", cleanedHtml: "" };
    localStorage.setItem(KEY, JSON.stringify(slim));
  } catch {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(HISTORY);
    } catch { /* ignore */ }
  }
  try {
    const hist = loadHistory();
    hist.unshift({ url: page.url, title: page.title, at: Date.now() });
    localStorage.setItem(HISTORY, JSON.stringify(hist.slice(0, 20)));
  } catch {
    try { localStorage.removeItem(HISTORY); } catch { /* ignore */ }
  }
}

export function loadCurrent(): ExtractedPage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExtractedPage;
  } catch {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    return null;
  }
}

export function loadHistory(): { url: string; title: string; at: number }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    try { localStorage.removeItem(HISTORY); } catch { /* ignore */ }
    return [];
  }
}
