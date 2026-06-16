import { AdminDiscountsPage as AdminDiscountsFeature } from "@/features/admin/discounts/components/admin-discounts-page";
import { AppShell } from "@/shared/ui/app-shell";

export default function AdminDiscountsPage() {
  return (
    <AppShell
      title="Quan ly ma giam gia"
      description="Tao, cap nhat, tim kiem va quan ly trang thai discount."
    >
      <AdminDiscountsFeature />
    </AppShell>
  );
}
