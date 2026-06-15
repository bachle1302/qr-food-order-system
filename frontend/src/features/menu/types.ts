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

export type MenuFilter = {
  categoryId?: string;
  available?: boolean;
};
