import "server-only";

import { env } from "@/shared/config/env";
import { ApiError, getErrorMessage } from "./error";

type JsonLikeBody = Record<string, unknown> | unknown[];

type ServerApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | JsonLikeBody | null;
  token?: string | null;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

const serverApiBaseUrl = (
  process.env.SERVER_API_BASE_URL ?? env.apiBaseUrl
).replace(/\/$/, "");

function isJsonLikeBody(body: ServerApiFetchOptions["body"]) {
  return (
    body !== null &&
    body !== undefined &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    !(body instanceof URLSearchParams)
  );
}

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

export async function serverApiFetch<T>(
  path: string,
  options: ServerApiFetchOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  let body = options.body;

  if (isJsonLikeBody(body)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${serverApiBaseUrl}${path}`, {
    ...options,
    headers,
    body: body as BodyInit | null | undefined,
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
