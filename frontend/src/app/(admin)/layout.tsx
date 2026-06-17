import type { ReactNode } from "react";
import { ManagementShell } from "@/shared/ui/management-shell";

export default function AdminGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ManagementShell>{children}</ManagementShell>;
}
