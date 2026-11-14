import { getCached, setCached } from "@/services/aiCache";
import { recordCall, canCall } from "@/services/aiUsage";

const DEFAULT_MODEL = "gemini-3.8-flash";
function getModel(): string {
  return (import.meta.env.VITE_GEMINI_MODEL || "").trim() || DEFAULT_MODEL;
}
function getFastModel(): string {
  try {
    return (localStorage.getItem("pageclone:ai-fast-model") || "").trim() || getModel();
  } catch {
    return getModel();
  }
}

function getApiKey(): string {
  return (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
}

export function isGeminiConfigured(): boolean {
  return getApiKey().length > 0;
}

interface CallOptions {
  timeoutMs?: number;
  maxOutputTokens?: number;
  retries?: number;
  signal?: AbortSignal;
  label?: string;
  onChunk?: (partialText: string) => void;
  cacheKey?: string;
  useCache?: boolean;
  fast?: boolean;
  model?: string;
}

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503]);
const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_MAX_TOKENS = 8192;
const INCOMPLETE_RESPONSE_MESSAGE = "A IA devolveu uma resposta incompleta. Tente novamente.";
const DEFAULT_RETRIES = 3;
const RETRY_DELAY_BASE_MS = 1200;
const RATE_LIMIT_RETRY_DELAY_MS = 12000;
const RATE_LIMIT_MAX_RETRIES = 3;
const OVERLOAD_RETRY_DELAYS_MS = [2000, 4000];

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException("Cancelado", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function friendlyError(err: unknown, timeoutMs: number): string {
  if (err instanceof DOMException && err.name === "AbortError") return "Cancelado";
  if (err instanceof Error) {
    if (/timeout|abort/i.test(err.message)) return `Tempo esgotado (${Math.round(timeoutMs / 1000)} s)`;
    return err.message;
  }
  return "Erro desconhecido";
}

function friendlyHttpError(status: number, body: string, model: string): string {
  let msg = body.slice(0, 300);
  try { msg = JSON.parse(body)?.error?.message ?? msg; } catch { /* corpo nao-JSON */ }
  if (status === 429) {
    if (/PerDay/i.test(body)) return "Cota diária da API Gemini esgotada para este modelo.";
    const wait = /retry in ([\d.]+)s/i.exec(msg)?.[1];
    return `Limite por minuto da API Gemini atingido${wait ? `, tente em ${Math.ceil(Number(wait))} s` : ""}.`;
  }
  if (status === 503) return `Modelo "${model}" sobrecarregado no momento. Tente novamente em instantes.`;
  if (status === 404) return `Modelo "${model}" não encontrado: ${msg}`;
  if (status === 401 || status === 403) return `Chave da API recusada (${status}): ${msg}`;
  return `Gemini API ${status}: ${msg}`;
}

type ModelParseResult<T> = { ok: true; value: T } | { ok: false };

function parseModelResponse<T>(raw: string, stream: boolean): ModelParseResult<T> {
  try {
    let text = raw;
    if (!stream) {
      const data = JSON.parse(raw);
      text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") || "";
    }
    if (!text) return { ok: false };
    return { ok: true, value: parseJsonResponse(text) as T };
  } catch {
    return { ok: false };
  }
}

function parseJsonResponse(text: string): unknown {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const objStart = cleaned.indexOf("{");
    const objEnd = cleaned.lastIndexOf("}");
    const arrStart = cleaned.indexOf("[");
    const arrEnd = cleaned.lastIndexOf("]");
    if (arrStart !== -1 && arrEnd !== -1 && (objStart === -1 || arrStart < objStart)) {
      return JSON.parse(cleaned.slice(arrStart, arrEnd + 1));
    }
    if (objStart !== -1 && objEnd !== -1) {
      return JSON.parse(cleaned.slice(objStart, objEnd + 1));
    }
    throw new Error("JSON invalido na resposta do modelo");
  }
}

async function doFetch(
  url: string,
  body: Record<string, unknown>,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<{ ok: boolean; status: number; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text().catch(() => res.statusText);
    return { ok: res.ok, status: res.status, text };
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

async function doStreamFetch(
  url: string,
  body: Record<string, unknown>,
  timeoutMs: number,
  externalSignal: AbortSignal | undefined,
  onChunk: (partialText: string) => void,
): Promise<{ ok: boolean; status: number; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, status: res.status, text };
    }
    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      return { ok: true, status: res.status, text };
    }
    let fullText = "";
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const jsonStr = trimmed.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const chunk = JSON.parse(jsonStr);
          const parts = chunk?.candidates?.[0]?.content?.parts;
          if (Array.isArray(parts)) {
            for (const p of parts) {
              if (typeof p.text === "string" && p.text) {
                fullText += p.text;
                onChunk(p.text);
              }
            }
          }
        } catch { /* skip malformed chunk */ }
      }
    }
    return { ok: true, status: res.status, text: fullText };
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

export async function callGeminiJson<T>(prompt: string, opts?: CallOptions): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY nao configurada");

  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxOutputTokens = opts?.maxOutputTokens ?? DEFAULT_MAX_TOKENS;
  const maxAttempts = opts?.retries ?? DEFAULT_RETRIES;
  const label = opts?.label || "gemini";
  const useStream = !!opts?.onChunk;
  const endpoint = useStream ? "streamGenerateContent" : "generateContent";
  const model = opts?.model ?? (opts?.fast ? getFastModel() : getModel());
  const url = useStream
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Cache lookup
  const cacheTask = opts?.cacheKey || label;
  const shouldCache = opts?.useCache !== false;
  if (shouldCache && !opts?.fast) {
    const cached = getCached<T>(cacheTask, prompt);
    if (cached !== null) return cached;
  }

  // Rate limiting
  const rateCheck = canCall();
  if (!rateCheck.ok) {
    const secs = Math.ceil(rateCheck.waitMs / 1000);
    throw new Error(`Aguarde ${secs}s antes de nova chamada a IA.`);
  }

  const buildBody = (includeThinking: boolean, includeMime: boolean): Record<string, unknown> => {
    const genConfig: Record<string, unknown> = {
      temperature: 0.7,
      maxOutputTokens,
    };
    if (includeMime) genConfig.responseMimeType = "application/json";
    if (includeThinking) genConfig.thinkingConfig = { thinkingBudget: 0 };
    return {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: genConfig,
    };
  };

  let includeThinking = true;
  let includeMime = true;
  let lastError = "";
  let rateLimitRetries = 0;
  let overloadRetries = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const body = buildBody(includeThinking, includeMime);
    const start = performance.now();
    try {
      const res = useStream
        ? await doStreamFetch(url, body, timeoutMs, opts?.signal, opts!.onChunk!)
        : await doFetch(url, body, timeoutMs, opts?.signal);
      const elapsedMs = Math.round(performance.now() - start);
      console.info(`[${label}] ${elapsedMs} ms`);

      if (res.ok) {
        const result = parseModelResponse<T>(res.text, useStream);
        if (result.ok) {
          if (shouldCache && !opts?.fast) {
            setCached(cacheTask, prompt, result.value);
          }
          recordCall();
          return result.value;
        }
        lastError = INCOMPLETE_RESPONSE_MESSAGE;
        if (attempt < maxAttempts) {
          await sleep(RETRY_DELAY_BASE_MS * attempt, opts?.signal);
          continue;
        }
        throw new Error(INCOMPLETE_RESPONSE_MESSAGE);
      }

      const errLower = res.text.toLowerCase();

      if (res.status === 400 && includeThinking && errLower.includes("thinking")) {
        includeThinking = false;
        attempt--;
        continue;
      }
      if (res.status === 400 && includeMime && errLower.includes("responsemimetype")) {
        includeMime = false;
        attempt--;
        continue;
      }

      lastError = `Gemini API error (${res.status}): ${res.text}`;
      console.error(`[${label}] HTTP ${res.status} (model=${model})`, res.text);

      if (res.status === 429 && rateLimitRetries < RATE_LIMIT_MAX_RETRIES) {
        rateLimitRetries++;
        attempt--;
        await sleep(RATE_LIMIT_RETRY_DELAY_MS, opts?.signal);
        continue;
      }

      if (res.status === 503 && overloadRetries < OVERLOAD_RETRY_DELAYS_MS.length) {
        await sleep(OVERLOAD_RETRY_DELAYS_MS[overloadRetries++], opts?.signal);
        attempt--;
        continue;
      }

      if (RETRYABLE_STATUSES.has(res.status) && attempt < maxAttempts) {
        await sleep(RETRY_DELAY_BASE_MS * attempt, opts?.signal);
        continue;
      }
      throw new Error(friendlyHttpError(res.status, res.text, model));
    } catch (err) {
      const elapsedMsCatch = Math.round(performance.now() - start);
      console.info(`[${label}] ${elapsedMsCatch} ms (error)`);

      if (err instanceof DOMException && err.name === "AbortError" && opts?.signal?.aborted) {
        throw new Error("Cancelado");
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        lastError = `Tempo esgotado (${Math.round(timeoutMs / 1000)} s)`;
      } else {
        lastError = err instanceof Error ? err.message : "Erro de conexao";
      }

      const isTimeoutOrAbort = err instanceof DOMException && err.name === "AbortError";
      if ((RETRYABLE_STATUSES.has(0) || isTimeoutOrAbort) && attempt < maxAttempts) {
        try {
          await sleep(RETRY_DELAY_BASE_MS * attempt, opts?.signal);
          continue;
        } catch {
          throw new Error("Cancelado");
        }
      }
      throw new Error(lastError);
    }
  }

  throw new Error(friendlyError(new Error(lastError), timeoutMs));
}
