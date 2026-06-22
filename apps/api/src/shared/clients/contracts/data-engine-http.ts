import {
  DATA_ENGINE_CONTRACT_VERSION,
  DATA_ENGINE_CONTRACT_VERSION_HEADER,
} from "./data-engine-contract-version";

export async function getJson<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ response: Response; data: T }> {
  const headers = withContractVersionHeader(options?.headers);
  const response = await fetch(endpoint, {
    ...options,
    headers,
  });
  const data = (await response.json()) as T;
  return { response, data };
}

export async function isDataEngineReachable(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      headers: withContractVersionHeader(undefined),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function withContractVersionHeader(headersInit: HeadersInit | undefined): Headers {
  const headers = new Headers(headersInit);
  headers.set(DATA_ENGINE_CONTRACT_VERSION_HEADER, DATA_ENGINE_CONTRACT_VERSION);
  return headers;
}
