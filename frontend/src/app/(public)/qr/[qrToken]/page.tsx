import { endpoints } from "@/shared/api/endpoints";
import { AppShell } from "@/shared/ui/app-shell";
import { EmptyState } from "@/shared/ui/empty-state";

type QrPageProps = {
  params: Promise<{
    qrToken: string;
  }>;
};

export default async function QrPage({ params }: QrPageProps) {
  const { qrToken } = await params;

  return (
    <AppShell title="Customer QR order" description={`QR token: ${qrToken}`}>
      <EmptyState
        title="QR order flow placeholder"
        description={`Page nay la Server Component. Task sau se render du lieu tu cached fetch: ${endpoints.tables.byQrToken("{qrToken}")} revalidate 60s, ${endpoints.categories.list} revalidate 300s, ${endpoints.dishes.list} revalidate 60s; cart/order submit se la Client Component goi ${endpoints.orders.publicQr}.`}
      />
    </AppShell>
  );
}
