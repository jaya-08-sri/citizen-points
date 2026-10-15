interface Options {
  method?: string;
  body?: unknown;
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: options.method ?? "GET",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new Error("Cannot reach the server. Check your internet connection.");
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    if (data.error) throw new Error(data.error);
    if (res.status >= 500) {
      throw new Error("The server is not responding. Make sure it is running (npm run dev:all).");
    }
    throw new Error("Something went wrong. Please try again.");
  }
  return data as T;
}
