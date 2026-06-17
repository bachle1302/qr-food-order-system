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
  customerSessionId?: string;
  items: PublicOrderDraftItem[];
  note?: string;
};

export type CustomerCheckInRequest = {
  qrToken: string;
  name: string;
  phone?: string;
};

export type CustomerSession = {
  sessionId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  tableId: string;
  tableName: string;
  qrToken: string;
  isNewCustomer: boolean;
  startedAt: string;
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
  customerSessionId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  items: OrderItemResponse[];
  totalPrice: number;
  finalPrice: number;
  note?: string | null;
  createdAt: string;
  status: string;
};
