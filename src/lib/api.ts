export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export function deviceId() {
  if (typeof window === "undefined") return "server";
  const key = "homex_device";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = `dev_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  window.localStorage.setItem(key, created);
  return created;
}
