export const endpoints = {
  auth: {
    login: "/api/auth/login",
    refresh: "/api/auth/refresh",
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
  },
  dishes: {
    list: "/api/dishes",
  },
  orders: {
    publicQr: "/api/orders/public/qr",
    manage: "/api/orders/manage",
    manageNew: "/api/orders/manage/new",
    kitchen: "/api/orders/manage/kitchen",
    updateStatus: (orderId: string) =>
      `/api/orders/${encodeURIComponent(orderId)}/status`,
    events: "/api/orders/events",
  },
} as const;
