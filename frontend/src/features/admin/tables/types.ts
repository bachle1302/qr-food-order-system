export type AdminTable = {
  id: string;
  name: string;
  seats: number;
  available: boolean;
  qrToken?: string;
};

export type TablePayload = {
  name: string;
  seats: number;
};

export type TableQrTokenResponse = {
  tableId: string;
  qrToken: string;
};
