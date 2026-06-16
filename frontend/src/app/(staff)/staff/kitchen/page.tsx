import { KitchenDashboard } from "@/features/kitchen/components/kitchen-dashboard";
import { AppShell } from "@/shared/ui/app-shell";

export default function StaffKitchenPage() {
  return (
    <AppShell
      title="Kitchen screen"
      description="Man bep xem order CONFIRMED, PREPARING, READY va cap nhat nhanh."
    >
      <KitchenDashboard />
    </AppShell>
  );
}
