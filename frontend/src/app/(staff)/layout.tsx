"use client";

import type { ReactNode } from "react";
import { ManagementShell } from "@/shared/ui/management-shell";

export default function StaffGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ManagementShell>{children}</ManagementShell>;
}
