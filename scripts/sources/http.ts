export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  attempts = 3,
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
      if (res.ok) return res;
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        throw new Error(`${res.status} ${res.statusText} for ${url}`);
      }
      lastError = new Error(`${res.status} for ${url}`);
    } catch (err) {
      lastError = err;
      if (err instanceof Error && /^4\d\d /.test(err.message)) throw err;
    }
    await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
  }
  throw lastError;
}

export async function fetchJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  return (await fetchWithRetry(url, init)).json() as Promise<T>;
}

export function maxInto(target: Record<string, number>, key: string, value: unknown) {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return;
  if (target[key] == null || n > target[key]) target[key] = n;
}
