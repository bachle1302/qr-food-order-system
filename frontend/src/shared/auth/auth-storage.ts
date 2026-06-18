"use client";

export type AuthRole = "ADMIN" | "STAFF";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  role: AuthRole;
  email?: string | null;
  displayName?: string | null;
};

const ACCESS_TOKEN_KEY = "qrfood.accessToken";
const REFRESH_TOKEN_KEY = "qrfood.refreshToken";
const ROLE_KEY = "qrfood.userRole";
const EMAIL_KEY = "qrfood.userEmail";
const DISPLAY_NAME_KEY = "qrfood.displayName";

const ACCESS_TOKEN_COOKIE = "qrfood_access_token";
const REFRESH_TOKEN_COOKIE = "qrfood_refresh_token";
const ROLE_COOKIE = "qrfood_role";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAccessToken() {
  return getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function getRefreshToken() {
  return getStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export function getAuthRole(): AuthRole | null {
  const role = getStorage()?.getItem(ROLE_KEY);
  return role === "ADMIN" || role === "STAFF" ? role : null;
}

export function getAuthEmail() {
  return getStorage()?.getItem(EMAIL_KEY) ?? null;
}

export function getAuthDisplayName() {
  return getStorage()?.getItem(DISPLAY_NAME_KEY) ?? null;
}

export function setAuthSession(session: AuthSession) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  storage.setItem(ROLE_KEY, session.role);

  if (session.email) {
    storage.setItem(EMAIL_KEY, session.email);
  } else {
    storage.removeItem(EMAIL_KEY);
  }

  if (session.displayName) {
    storage.setItem(DISPLAY_NAME_KEY, session.displayName);
  } else {
    storage.removeItem(DISPLAY_NAME_KEY);
  }

  // Client-set cookies allow Next.js middleware to guard routes early.
  // They are not a replacement for httpOnly server-set auth cookies.
  setCookie(ACCESS_TOKEN_COOKIE, session.accessToken);
  setCookie(REFRESH_TOKEN_COOKIE, session.refreshToken);
  setCookie(ROLE_COOKIE, session.role);
}

export function updateAuthTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  const role = getAuthRole();
  const email = getAuthEmail();
  const displayName = getAuthDisplayName();

  if (!role) {
    return;
  }

  setAuthSession({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    role,
    email,
    displayName,
  });
}

export function clearAuthSession() {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(ROLE_KEY);
    storage.removeItem(EMAIL_KEY);
    storage.removeItem(DISPLAY_NAME_KEY);
  }

  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
  deleteCookie(ROLE_COOKIE);
}
