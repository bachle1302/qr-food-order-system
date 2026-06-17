import Link from "next/link";
import { AppShell } from "@/shared/ui/app-shell";

export default function Home() {
  const links = [
    {
      href: "/qr/demo-token",
      title: "Customer QR flow",
      description: "Placeholder cho luong khach quet QR va dat mon.",
    },
    {
      href: "/login",
      title: "Staff/Admin login",
      description: "Dang nhap bang JWT Bearer token tu backend.",
    },
    {
      href: "/staff/orders",
      title: "Staff orders",
      description: "Man hinh nhan vien xem va cap nhat don hang.",
    },
    {
      href: "/admin",
      title: "Admin dashboard",
      description: "Khu vuc quan tri ban, mon, danh muc va nhan vien.",
    },
  ];

  return (
    <AppShell
      title="QR Food/RMS"
      description="Foundation frontend Next.js cho he thong dat mon bang QR va quan ly nha hang."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {links.map((item) => (
          <Link
            className="rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted"
            href={item.href}
            key={item.href}
          >
            <h2 className="font-semibold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
