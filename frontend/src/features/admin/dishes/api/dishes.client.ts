import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import type { AdminDish, DishPayload } from "../types";

export function getDishes(token: string) {
  return apiFetch<AdminDish[]>(endpoints.dishes.list, {
    token,
    cache: "no-store",
  });
}

export function createDish(payload: DishPayload, token: string) {
  return apiFetch<AdminDish>(endpoints.dishes.create, {
    method: "POST",
    body: payload,
    token,
    cache: "no-store",
  });
}

export function updateDish(
  dishId: string,
  payload: DishPayload,
  token: string,
) {
  return apiFetch<AdminDish>(endpoints.dishes.byId(dishId), {
    method: "PUT",
    body: payload,
    token,
    cache: "no-store",
  });
}

export function deleteDish(dishId: string, token: string) {
  return apiFetch<void>(endpoints.dishes.byId(dishId), {
    method: "DELETE",
    token,
    cache: "no-store",
  });
}
