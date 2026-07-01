export async function api<T = unknown>(
  input: string,
  init: RequestInit = {},
): Promise<T> {
  const resp = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!resp.ok) {
    let message = `Error ${resp.status}`;
    try {
      const data = await resp.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}
