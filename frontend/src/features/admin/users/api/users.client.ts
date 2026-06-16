import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import type {
  AdminUser,
  ApiResponse,
  AuthResponse,
  CreateStaffPayload,
  UpdateUserPayload,
  UserRole,
} from "../types";

function withRoleParam(role?: UserRole | "ALL") {
  if (!role || role === "ALL") {
    return endpoints.users.list;
  }

  const params = new URLSearchParams({ role });
  return `${endpoints.users.list}?${params.toString()}`;
}

export async function getUsers(token: string) {
  const response = await apiFetch<ApiResponse<AdminUser[]>>(
    endpoints.users.list,
    {
      token,
      cache: "no-store",
    },
  );

  return response.data;
}

export async function getUsersByRole(role: UserRole | "ALL", token: string) {
  const response = await apiFetch<ApiResponse<AdminUser[]>>(
    withRoleParam(role),
    {
      token,
      cache: "no-store",
    },
  );

  return response.data;
}

export async function createStaff(
  payload: CreateStaffPayload,
  token: string,
) {
  const response = await apiFetch<ApiResponse<AuthResponse>>(
    endpoints.auth.register,
    {
      method: "POST",
      body: payload,
      token,
      cache: "no-store",
    },
  );

  return response.data.user;
}

export async function updateUser(
  userId: string,
  payload: UpdateUserPayload,
  token: string,
) {
  const response = await apiFetch<ApiResponse<AdminUser>>(
    endpoints.users.byId(userId),
    {
      method: "PUT",
      body: payload,
      token,
      cache: "no-store",
    },
  );

  return response.data;
}

export async function updateUserActiveStatus(
  userId: string,
  isActive: boolean,
  token: string,
) {
  const response = await apiFetch<ApiResponse<AdminUser>>(
    endpoints.users.status(userId),
    {
      method: "PUT",
      body: { isActive },
      token,
      cache: "no-store",
    },
  );

  return response.data;
}
