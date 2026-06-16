import { AdminCategoriesPage as AdminCategoriesFeature } from "@/features/admin/categories/components/admin-categories-page";
import { AppShell } from "@/shared/ui/app-shell";

export default function AdminCategoriesPage() {
  return (
    <AppShell
      title="Quan ly danh muc"
      description="Tao, cap nhat va sap xep cac nhom mon trong menu."
    >
      <AdminCategoriesFeature />
    </AppShell>
  );
}
