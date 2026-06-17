export const endpoints = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    refresh: "/api/auth/refresh",
  },
  users: {
    list: "/api/users",
    byId: (userId: string) =>
      `/api/users/${encodeURIComponent(userId)}`,
    status: (userId: string) =>
      `/api/users/${encodeURIComponent(userId)}/status`,
  },
  tables: {
    list: "/api/tables",
    create: "/api/tables",
    byId: (tableId: string) =>
      `/api/tables/${encodeURIComponent(tableId)}`,
    byQrToken: (qrToken: string) =>
      `/api/tables/qr/${encodeURIComponent(qrToken)}`,
    regenerateQrToken: (tableId: string) =>
      `/api/tables/${encodeURIComponent(tableId)}/regenerate-qr-token`,
  },
  categories: {
    list: "/api/categories",
    create: "/api/categories",
    byId: (categoryId: string) =>
      `/api/categories/${encodeURIComponent(categoryId)}`,
  },
  dishes: {
    list: "/api/dishes",
    create: "/api/dishes",
    byId: (dishId: string) =>
      `/api/dishes/${encodeURIComponent(dishId)}`,
  },
  discounts: {
    list: "/api/discounts",
    create: "/api/discounts",
    byId: (discountId: string) =>
      `/api/discounts/${encodeURIComponent(discountId)}`,
    byCode: (code: string) =>
      `/api/discounts/code/${encodeURIComponent(code)}`,
  },
  customerSessions: {
    checkIn: "/api/customer-sessions/check-in",
  },
  orders: {
    publicQr: "/api/orders/public/qr",
    publicSession: (customerSessionId: string, qrToken: string) =>
      `/api/orders/public/session/${encodeURIComponent(customerSessionId)}?qrToken=${encodeURIComponent(qrToken)}`,
    manage: "/api/orders/manage",
    manageNew: "/api/orders/manage/new",
    kitchen: "/api/orders/manage/kitchen",
    dailySummary: "/api/orders/summary/daily",
    dailyRevenue: "/api/orders/revenue/daily",
    monthlyRevenue: "/api/orders/revenue/monthly",
    updateStatus: (orderId: string) =>
      `/api/orders/${encodeURIComponent(orderId)}/status`,
    events: "/api/orders/events",
  },
} as const;
