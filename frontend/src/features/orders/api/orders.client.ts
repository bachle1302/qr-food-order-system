import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import type { Order, OrderStatus } from "../types";

type ManageOrderParams = {
  status?: OrderStatus | "ALL";
  tableId?: string;
  fromDate?: string;
  toDate?: string;
};

function buildQuery(params: ManageOrderParams = {}) {
  const query = new URLSearchParams();

  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }
  if (params.tableId) {
    query.set("tableId", params.tableId);
  }
  if (params.fromDate) {
    query.set("fromDate", params.fromDate);
  }
  if (params.toDate) {
    query.set("toDate", params.toDate);
  }

  const value = query.toString();
  return value ? `?${value}` : "";
}

export function getManagedOrders(
  params: ManageOrderParams,
  token: string,
) {
  return apiFetch<Order[]>(`${endpoints.orders.manage}${buildQuery(params)}`, {
    cache: "no-store",
    token,
  });
}
export function getNewOrders(token: string) {
  return apiFetch<Order[]>(endpoints.orders.manageNew, {
    cache: "no-store",
    token,
  });
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  token: string,
) {
  return apiFetch<Order>(endpoints.orders.updateStatus(orderId), {
    method: "PUT",
    body: { status },
    cache: "no-store",
    token,
  });
}
