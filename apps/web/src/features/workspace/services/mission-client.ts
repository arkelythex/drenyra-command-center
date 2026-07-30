import { mapAPIErrorToHarnessError } from "./mission-errors";

const API_BASE =
  import.meta.env.VITE_DRENYRA_API_URL ?? "http://localhost:3000";

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${sessionStorage.getItem("drenyra-auth-token") ?? ""}`,
  };
}

export async function missionFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw mapAPIErrorToHarnessError(response.status, body);
  }

  return response.json() as Promise<T>;
}

export async function missionFetchStream(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw mapAPIErrorToHarnessError(response.status, body);
  }

  return response;
}
