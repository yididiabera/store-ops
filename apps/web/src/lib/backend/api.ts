const apiBaseUrl = process.env.STORE_OPS_API_URL?.trim();

function buildUrl(path: string) {
  if (!apiBaseUrl) {
    return null;
  }

  return new URL(path, apiBaseUrl).toString();
}

export function isApiEnabled() {
  return Boolean(apiBaseUrl);
}

export async function fetchApi<T>(path: string, init?: RequestInit) {
  const url = buildUrl(path);

  if (!url) {
    throw new Error("STORE_OPS_API_URL is not configured");
  }

  const hasBody = init?.body !== undefined && init?.body !== null;
  const headers = new Headers(init?.headers ?? {});

  if (hasBody && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `API request failed (${response.status})`;

    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {}

    throw new Error(message);
  }

  return (await response.json()) as T;
}
