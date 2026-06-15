import { endpoints } from "@/shared/api/endpoints";
import { serverApiFetch } from "@/shared/api/server";
import type { OrderStatus } from "../types";

export type OrderItem = {
  orderId: string;
  dishId: string;
  quantity: number;
  pricePerUnit: number;
  note?: string | null;
};

export type Order = {
  id: string;
  tableId: string;
  items: OrderItem[];
  totalPrice: number;
  finalPrice: number;
  note?: string | null;
  createdAt: string;
  status: OrderStatus;
};

type AuthenticatedRequest = {
  token: string;
};

export function getManagedOrders({ token }: AuthenticatedRequest) {
  return serverApiFetch<Order[]>(endpoints.orders.manage, {
    cache: "no-store",
    token,
  });
}

export function getNewOrders({ token }: AuthenticatedRequest) {
  return serverApiFetch<Order[]>(endpoints.orders.manageNew, {
    cache: "no-store",
    token,
  });
}

export function getKitchenOrders({ token }: AuthenticatedRequest) {
  return serverApiFetch<Order[]>(endpoints.orders.kitchen, {
    cache: "no-store",
    token,
  });
}
