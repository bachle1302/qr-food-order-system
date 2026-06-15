import { endpoints } from "@/shared/api/endpoints";
import { serverApiFetch } from "@/shared/api/server";

export type TableQrInfo = {
  id: string;
  name: string;
  seats: number;
  available: boolean;
};

export function getTableByQrToken(qrToken: string) {
  return serverApiFetch<TableQrInfo>(endpoints.tables.byQrToken(qrToken), {
    next: { revalidate: 60, tags: [`table-qr-${qrToken}`] },
  });
}
