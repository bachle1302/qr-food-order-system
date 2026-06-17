import { env } from "@/shared/config/env";
import { ApiError, getErrorMessage } from "./error";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  headers?: HeadersInit;
  cache?: RequestCache;
};

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, `Request failed with status ${response.status}`),
      response.status,
      data,
    );
  }

  return data as T;
}

export const apiFetch = apiRequest;
