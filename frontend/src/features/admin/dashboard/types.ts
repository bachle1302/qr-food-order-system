import type { Order, OrderStatus } from "@/features/orders/types";

export type DailySummary = {
  date: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  orderIds: string[];
};

export type DashboardOrder = Order;

export type DashboardOrderFilters = {
  status?: OrderStatus | "ALL";
  tableId?: string;
  fromDate?: string;
  toDate?: string;
};

