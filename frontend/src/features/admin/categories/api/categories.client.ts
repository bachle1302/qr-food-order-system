import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import type { AdminCategory, CategoryPayload } from "../types";

export function getCategories(token: string) {
  return apiFetch<AdminCategory[]>(endpoints.categories.list, {
    token,
    cache: "no-store",
  });
}

export function createCategory(payload: CategoryPayload, token: string) {
  return apiFetch<AdminCategory>(endpoints.categories.create, {
    method: "POST",
    body: payload,
    token,
    cache: "no-store",
  });
}

export function updateCategory(
  categoryId: string,
  payload: CategoryPayload,
  token: string,
) {
  return apiFetch<AdminCategory>(endpoints.categories.byId(categoryId), {
    method: "PUT",
    body: payload,
    token,
    cache: "no-store",
  });
}

export function deleteCategory(categoryId: string, token: string) {
  return apiFetch<void>(endpoints.categories.byId(categoryId), {
    method: "DELETE",
    token,
    cache: "no-store",
  });
}
