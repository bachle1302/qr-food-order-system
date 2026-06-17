import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import type { AdminDiscount, DiscountPayload } from "../types";

export function getDiscounts(token: string) {
  return apiFetch<AdminDiscount[]>(endpoints.discounts.list, {
    token,
    cache: "no-store",
  });
}

export function getDiscountByCode(code: string, token: string) {
  return apiFetch<AdminDiscount>(endpoints.discounts.byCode(code), {
    token,
    cache: "no-store",
  });
}

export function createDiscount(payload: DiscountPayload, token: string) {
  return apiFetch<AdminDiscount>(endpoints.discounts.create, {
    method: "POST",
    body: payload,
    token,
    cache: "no-store",
  });
}

export function updateDiscount(
  discountId: string,
  payload: DiscountPayload,
  token: string,
) {
  return apiFetch<AdminDiscount>(endpoints.discounts.byId(discountId), {
    method: "PUT",
    body: payload,
    token,
    cache: "no-store",
  });
}

export function deleteDiscount(discountId: string, token: string) {
  return apiFetch<void>(endpoints.discounts.byId(discountId), {
    method: "DELETE",
    token,
    cache: "no-store",
  });
}
