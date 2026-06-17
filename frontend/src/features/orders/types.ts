export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "PAID"
  | "CANCELLED"
  | "COMPLETED";

export type OrderItem = {
  orderId?: string;
  dishId: string;
  quantity: number;
  pricePerUnit: number;
  note?: string | null;
  dishName?: string;
  dishImageUrl?: string;
};

export type Order = {
  id: string;
  tableId: string;
  customerSessionId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  items: OrderItem[];
  totalPrice: number;
  finalPrice: number;
  note?: string | null;
  createdAt: string;
  status: OrderStatus;
};

export type OrderEventPayload = {
  type: "ORDER_CREATED" | "ORDER_STATUS_CHANGED";
  order: Order;
};

export const ORDER_STATUSES: Array<"ALL" | OrderStatus> = [
  "ALL",
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "PAID",
  "COMPLETED",
  "CANCELLED",
];

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED", "CANCELLED"],
  SERVED: ["PAID", "COMPLETED"],
  PAID: ["COMPLETED"],
  CANCELLED: [],
  COMPLETED: [],
};
