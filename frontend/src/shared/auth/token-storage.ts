"use client";

import {
  clearAuthSession,
  getAccessToken,
  getAuthRole,
  getRefreshToken,
  setAuthSession,
  type AuthRole,
} from "./auth-storage";

export { getAccessToken, getRefreshToken };

export function getUserRole() {
  return getAuthRole();
}

export function setUserRole(role: string) {
  if (role !== "ADMIN" && role !== "STAFF") {
    return;
  }

  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) {
    return;
  }

  setAuthSession({
    accessToken,
    refreshToken,
    role,
  });
}

export function setTokens(tokens: {
  accessToken: string;
  refreshToken?: string | null;
  role?: AuthRole;
  email?: string | null;
  displayName?: string | null;
}) {
  if (!tokens.refreshToken || !tokens.role) {
    return;
  }

  setAuthSession({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    role: tokens.role,
    email: tokens.email,
    displayName: tokens.displayName,
  });
}

export function clearTokens() {
  clearAuthSession();
}
