import { getCategories, getDishes } from "@/features/menu/api/menu.server";
import { CustomerOrderClient } from "@/features/public-order/components/customer-order-client";
import { getTableByQrToken } from "@/features/public-order/api/table.server";
import Link from "next/link";

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
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">
              QR Food/RMS
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Không thể mở trang đặt món
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Mã QR không hợp lệ, đã hết hiệu lực hoặc menu đang tạm thời
              không tải được. Vui lòng quét lại mã trên bàn hoặc liên hệ nhân
              viên.
            </p>
            <div className="mt-4 rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
              {data.message}
            </div>
            <Link
              className="mt-5 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
              href="/"
            >
              Về trang chủ
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <CustomerOrderClient
        categories={data.categories}
        dishes={data.dishes}
        qrToken={qrToken}
        table={data.table}
      />
    </main>
  );
}

export const dynamic = "force-dynamic";

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
          : "Không thể tải thông tin QR/menu.",
    };
  }
}

/*
 * This route stays a Server Component. Table lookup is no-store so rotated or
 * newly backfilled QR tokens are checked immediately; menu data can still use
 * the cache configured in the menu server API.
 * Cart and POST /api/orders/public/qr live in CustomerOrderClient.
 */
