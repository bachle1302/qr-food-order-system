"use client";

const ACCESS_TOKEN_KEY = "qrfood.accessToken";
const REFRESH_TOKEN_KEY = "qrfood.refreshToken";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function getAccessToken() {
  return getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function getRefreshToken() {
  return getStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export function setTokens(tokens: {
  accessToken: string;
  refreshToken?: string | null;
}) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  // Dev/demo storage only: localStorage is exposed to XSS. Move to httpOnly cookies if backend supports it.
  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);

  if (tokens.refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

export function clearTokens() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
}
