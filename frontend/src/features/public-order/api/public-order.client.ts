import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import type { CreateQrOrderPayload, OrderResponse } from "../types";

export function createQrOrder(payload: CreateQrOrderPayload) {
  return apiFetch<OrderResponse>(endpoints.orders.publicQr, {
    method: "POST",
    body: {
      qrToken: payload.qrToken,
      note: payload.note,
      items: payload.items.map((item) => ({
        dishId: item.dishId,
        quantity: item.quantity,
        note: item.note,
      })),
    },
    cache: "no-store",
  });
}
