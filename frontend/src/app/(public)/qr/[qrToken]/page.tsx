import { AppShell } from "@/shared/ui/app-shell";
import { ErrorState } from "@/shared/ui/error-state";
import { getCategories, getDishes } from "@/features/menu/api/menu.server";
import { CustomerOrderClient } from "@/features/public-order/components/customer-order-client";
import { getTableByQrToken } from "@/features/public-order/api/table.server";

type QrPageProps = {
  params: Promise<{
    qrToken: string;
  }>;
};

export default async function QrPage({ params }: QrPageProps) {
  const { qrToken } = await params;
  const data = await loadQrOrderData(qrToken);

  if (!data.ok) {
    return (
      <AppShell
        title="Khong the mo QR order"
        description="Vui long kiem tra lai ma QR hoac lien he nhan vien."
      >
        <ErrorState
          title="QR khong hop le hoac menu dang loi"
          message={data.message}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Dat mon tai ${data.table.name}`}
      description="Chon mon tu menu va gui order bang QR token an toan."
    >
      <CustomerOrderClient
        categories={data.categories}
        dishes={data.dishes}
        qrToken={qrToken}
        table={data.table}
      />
    </AppShell>
  );
}

export const revalidate = 60;

async function loadQrOrderData(qrToken: string) {
  try {
    const [table, categories, dishes] = await Promise.all([
      getTableByQrToken(qrToken),
      getCategories(),
      getDishes(),
    ]);

    return { ok: true as const, table, categories, dishes };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Khong the tai thong tin QR/menu.",
    };
  }
}

/*
 * This route stays a Server Component. Public data uses Next.js fetch cache:
 * table by QR: 60s, categories: 300s, dishes: 60s.
 * Cart and POST /api/orders/public/qr live in CustomerOrderClient.
 */
