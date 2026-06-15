export type PublicOrderDraftItem = {
  dishId: string;
  quantity: number;
  note?: string;
};

export type TableQrInfo = {
  id: string;
  name: string;
  seats: number;
  available: boolean;
};

export type CreateQrOrderPayload = {
  qrToken: string;
  items: PublicOrderDraftItem[];
  note?: string;
};

export type OrderItemResponse = {
  orderId: string;
  dishId: string;
  quantity: number;
  pricePerUnit: number;
  note?: string | null;
};

export type OrderResponse = {
  id: string;
  tableId: string;
  items: OrderItemResponse[];
  totalPrice: number;
  finalPrice: number;
  note?: string | null;
  createdAt: string;
  status: string;
};
