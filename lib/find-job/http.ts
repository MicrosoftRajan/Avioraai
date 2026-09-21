import { gunzipSync } from "zlib";

const UA = "AvioraFindJob/1.0 (job search; +https://aviora.ai)";

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8_000,
): Promise<Response> {
  return fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/html;q=0.9, */*;q=0.8",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export async function fetchBrowserText(
  url: string,
  timeoutMs = 14_000,
): Promise<string> {
  const res = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    headers: {
      "User-Agent": BROWSER_UA,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8_000,
): Promise<T> {
  const res = await fetchWithTimeout(
    url,
    {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    },
    timeoutMs,
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchText(
  url: string,
  timeoutMs = 8_000,
): Promise<string> {
  const res = await fetchWithTimeout(
    url,
    { headers: { Accept: "text/html,application/xhtml+xml" } },
    timeoutMs,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function fetchMaybeGzipText(
  url: string,
  timeoutMs = 22_000,
): Promise<string> {
  const res = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "application/xml,text/xml,application/gzip,*/*",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
    return gunzipSync(buf).toString("utf8");
  }
  return buf.toString("utf8");
}

export function hashId(parts: string[]): string {
  const raw = parts.join("|").toLowerCase();
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (h * 31 + raw.charCodeAt(i)) | 0;
  }
  return `job_${Math.abs(h).toString(36)}`;
}

export function truncate(text: string, max = 4_000): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function settledValues<T>(results: PromiseSettledResult<T>[]): T[] {
  const out: T[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") out.push(r.value);
  }
  return out;
}

export function postedDate(value: string | number | undefined): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  return value;
}
