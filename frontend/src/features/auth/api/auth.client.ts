import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string | null;
  avatar?: string | null;
  role: "ADMIN" | "STAFF";
  isActive: boolean;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: AuthUser;
};

export async function login(payload: { email: string; password: string }) {
  const response = await apiFetch<ApiResponse<AuthResponse>>(
    endpoints.auth.login,
    {
      method: "POST",
      body: payload,
      cache: "no-store",
    },
  );

  return response.data;
}
