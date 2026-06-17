import { endpoints } from "@/shared/api/endpoints";
import { serverApiFetch } from "@/shared/api/server";
import type { Category, Dish } from "../types";

export function getCategories() {
  return serverApiFetch<Category[]>(endpoints.categories.list, {
    next: { revalidate: 300, tags: ["categories"] },
  });
}

export function getDishes() {
  return serverApiFetch<Dish[]>(endpoints.dishes.list, {
    next: { revalidate: 60, tags: ["dishes"] },
  });
}
