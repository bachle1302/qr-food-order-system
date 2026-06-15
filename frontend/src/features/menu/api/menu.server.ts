import { endpoints } from "@/shared/api/endpoints";
import { serverApiFetch } from "@/shared/api/server";

export type Category = {
  id: string;
  name: string;
  description?: string | null;
};

export type Dish = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  categoryId: string;
  available: boolean;
};

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
