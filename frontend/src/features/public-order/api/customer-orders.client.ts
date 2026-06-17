import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import type { OrderResponse } from "../types";

export function getCustomerSessionOrders(
  customerSessionId: string,
  qrToken: string,
) {
  return apiFetch<OrderResponse[]>(
    endpoints.orders.publicSession(customerSessionId, qrToken),
    {
      cache: "no-store",
    },
  );
}
