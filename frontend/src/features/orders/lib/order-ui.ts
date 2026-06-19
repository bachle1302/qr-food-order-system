import type { Order, OrderStatus } from "../types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Chờ xử lý",
  CONFIRMED: "Đã nhận",
  PREPARING: "Đang nấu",
  READY: "Sẵn sàng",
  SERVED: "Đã phục vụ",
  PAID: "Đã thanh toán",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

export const STATUS_SUMMARY: Array<{
  label: string;
  statuses: OrderStatus[];
}> = [
  { label: "Chờ xử lý", statuses: ["NEW"] },
  { label: "Đã nhận", statuses: ["CONFIRMED"] },
  { label: "Đang nấu", statuses: ["PREPARING"] },
  { label: "Sẵn sàng", statuses: ["READY"] },
  { label: "Đã phục vụ", statuses: ["SERVED"] },
  { label: "Đã thanh toán", statuses: ["PAID", "COMPLETED"] },
  { label: "Đã hủy", statuses: ["CANCELLED"] },
];

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export type DishNameMap = Record<string, string>;
export type DishImageMap = Record<string, string>;
export type TableNameMap = Record<string, string>;

export function getDishLabel(dishId: string, dishNameById?: DishNameMap) {
  return dishNameById?.[dishId] ?? `Món chưa tìm thấy (${dishId})`;
}

export function getDishImageUrl(
  dishId: string,
  dishImageById?: DishImageMap,
) {
  return dishImageById?.[dishId] ?? "";
}

export function getCustomerLabel(order: Order) {
  return order.customerName?.trim() || "Khách chưa rõ";
}

export function getTableLabel(tableId: string, tableNameById?: TableNameMap) {
  return tableNameById?.[tableId] ?? `Bàn chưa tìm thấy (${tableId})`;
}

export function getOrderItemCount(order: Order) {
  return order.items.reduce((total, item) => total + item.quantity, 0);
}

export function getOrderTotal(order: Order) {
  return order.finalPrice ?? order.totalPrice ?? 0;
}
