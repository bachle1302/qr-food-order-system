import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import type { CustomerCheckInRequest, CustomerSession } from "../types";

export function checkInCustomer(payload: CustomerCheckInRequest) {
  return apiFetch<CustomerSession>(endpoints.customerSessions.checkIn, {
    method: "POST",
    body: {
      qrToken: payload.qrToken,
      name: payload.name,
      phone: payload.phone,
    },
    cache: "no-store",
  });
}
