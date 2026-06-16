import { AdminDishesPage as AdminDishesFeature } from "@/features/admin/dishes/components/admin-dishes-page";
import { AppShell } from "@/shared/ui/app-shell";

export default function AdminDishesPage() {
  return (
    <AppShell
      title="Quan ly mon an"
      description="Tao, cap nhat, loc va quan ly trang thai mon trong menu."
    >
      <AdminDishesFeature />
    </AppShell>
  );
}
