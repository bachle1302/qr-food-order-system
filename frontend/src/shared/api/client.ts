import { env } from "@/shared/config/env";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  updateAuthTokens,
} from "@/shared/auth/auth-storage";
import { isJwtExpired } from "@/shared/auth/jwt";
import { ApiError, getErrorMessage } from "./error";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  headers?: HeadersInit;
  cache?: RequestCache;
  skipAuthRefresh?: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

let refreshRequest: Promise<RefreshResponse> | null = null;

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
  return executeRequest<T>(path, options, false);
}

async function executeRequest<T>(
  path: string,
  options: ApiRequestOptions,
  hasRetried: boolean,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = options.token ? getAccessToken() ?? options.token : null;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache,
  });

  const data = await parseResponse(response);

  if (response.status === 401 && token && !options.skipAuthRefresh && !hasRetried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return executeRequest<T>(
        path,
        {
          ...options,
          token: refreshed.accessToken,
        },
        true,
      );
    }
  }

  if (response.status === 401 && token && hasRetried) {
    clearAuthSession();
    redirectToLoginIfProtected();
  }

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, `Request failed with status ${response.status}`),
      response.status,
      data,
    );
  }

  return data as T;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthSession();
    redirectToLoginIfProtected();
    return null;
  }

  if (isJwtExpired(refreshToken)) {
    clearAuthSession();
    redirectToLoginIfProtected();
    return null;
  }

  if (!refreshRequest) {
    refreshRequest = requestNewTokens(refreshToken).finally(() => {
      refreshRequest = null;
    });
  }

  try {
    const tokens = await refreshRequest;
    updateAuthTokens(tokens);
    return tokens;
  } catch {
    clearAuthSession();
    redirectToLoginIfProtected();
    return null;
  }
}

function redirectToLoginIfProtected() {
  if (typeof window === "undefined") {
    return;
  }

  const pathname = window.location.pathname;
  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) {
    window.location.assign("/login");
  }
}

async function requestNewTokens(refreshToken: string) {
  const response = await fetch(`${env.apiBaseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, "Phiên đăng nhập đã hết hạn."),
      response.status,
      data,
    );
  }

  const auth = data as ApiResponse<RefreshResponse>;
  return auth.data;
}

export const apiFetch = apiRequest;
