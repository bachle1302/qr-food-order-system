import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";

export type OrderTable = {
  id: string;
  name: string;
};

export function getOrderTables(token: string) {
  return apiFetch<OrderTable[]>(endpoints.tables.list, {
    cache: "no-store",
    token,
  });
}
