import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";

export type OrderDish = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

export function getOrderDishes(token: string) {
  return apiFetch<OrderDish[]>(endpoints.dishes.list, {
    cache: "no-store",
    token,
  });
}
