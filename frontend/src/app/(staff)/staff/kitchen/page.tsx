import { endpoints } from "@/shared/api/endpoints";
import { AppShell } from "@/shared/ui/app-shell";
import { EmptyState } from "@/shared/ui/empty-state";

export default function StaffKitchenPage() {
  return (
    <AppShell
      title="Kitchen screen"
      description="Placeholder cho man bep xem don CONFIRMED, PREPARING va READY."
    >
      <EmptyState
        title="Kitchen queue chua implement"
        description={`Task sau se goi ${endpoints.orders.kitchen}, ${endpoints.orders.updateStatus("{orderId}")}, va ket noi SSE ${endpoints.orders.events}.`}
      />
    </AppShell>
  );
}
