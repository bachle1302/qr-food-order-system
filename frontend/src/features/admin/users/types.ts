export type UserRole = "ADMIN" | "STAFF";

export type AdminUser = {
  id: string;
  email: string;
  displayName?: string | null;
  avatar?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateStaffPayload = {
  email: string;
  password: string;
  displayName: string;
  role: "STAFF";
};

export type UpdateUserPayload = {
  email?: string;
  displayName?: string;
  avatar?: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: AdminUser;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};
