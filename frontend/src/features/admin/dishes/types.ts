export type AdminDish = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  categoryId: string;
  available: boolean;
};

export type DishPayload = {
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  categoryId: string;
  available: boolean;
};
