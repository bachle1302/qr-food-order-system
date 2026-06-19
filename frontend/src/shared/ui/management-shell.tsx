"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
  clearAuthSession,
  getAccessToken,
  getAuthRole,
  type AuthRole,
} from "@/shared/auth/auth-storage";
import { NotificationBell } from "@/shared/notifications/notification-bell";
import {
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingCart,
  Table2,
  Tags,
  TicketPercent,
  Users,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

type ManagementShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/staff/orders", label: "Đơn hàng", icon: ClipboardList },
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/tables", label: "Bàn", icon: Table2 },
  { href: "/admin/categories", label: "Danh mục", icon: Tags },
  { href: "/admin/dishes", label: "Món ăn", icon: ShoppingCart },
  { href: "/admin/discounts", label: "Mã giảm giá", icon: TicketPercent },
  { href: "/admin/users", label: "Nhân viên", icon: Users },
];

const pageMeta: Record<string, { title: string; description: string }> = {
  "/staff/orders": {
    title: "Đơn hàng",
    description: "Quản lý đơn hàng, trạng thái và realtime vận hành.",
  },
  "/admin": {
    title: "Tổng quan quản trị",
    description: "Theo dõi doanh thu, đơn hàng và lối tắt vận hành.",
  },
  "/admin/tables": {
    title: "Quản lý bàn",
    description: "Quản lý bàn ăn, QR token và mã QR cho khách.",
  },
  "/admin/categories": {
    title: "Quản lý danh mục",
    description: "Tạo và cập nhật nhóm món trong menu.",
  },
  "/admin/dishes": {
    title: "Quản lý món ăn",
    description: "Quản lý món, giá, hình ảnh và trạng thái bán.",
  },
  "/admin/discounts": {
    title: "Quản lý mã giảm giá",
    description: "Tạo, cập nhật và kiểm soát trạng thái discount.",
  },
  "/admin/users": {
    title: "Quản lý nhân viên",
    description: "Quản lý tài khoản ADMIN/STAFF và trạng thái hoạt động.",
  },
};

function getPageMeta(pathname: string) {
  const exact = pageMeta[pathname];
  if (exact) {
    return exact;
  }

  const activeItem = navItems.find((item) => isActivePath(pathname, item.href));
  if (activeItem) {
    return {
      title: activeItem.label,
      description: "Không gian quản lý vận hành QR Food/RMS.",
    };
  }

  return pageMeta["/admin"];
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ManagementShell({ children }: ManagementShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<AuthRole | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    const userRole = getAuthRole();
    if (!userRole) {
      clearAuthSession();
      router.push("/login");
      return;
    }

    setRole(userRole);
    setIsChecking(false);

    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      router.push("/staff/orders");
    }
  }, [pathname, router]);

  const meta = getPageMeta(pathname);

  if (isChecking) {
    return (
      <div className="grid h-screen place-items-center bg-gray-50 dark:bg-slate-950 text-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Đang xác thực quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return null;
  }

  const visibleNavItems = navItems.filter((item) => {
    if (item.href.startsWith("/admin")) {
      return role === "ADMIN";
    }
    return true;
  });

  function handleLogout() {
    clearAuthSession();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 text-foreground dark:bg-slate-950 md:flex">
      <aside className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50/95 px-3 text-foreground backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:h-screen md:w-16 md:flex-col md:border-b-0 md:border-r md:px-0 md:py-4">
        <div className="flex min-w-0 items-center gap-2 md:flex-col">
          <Link
            aria-label="Trang chủ"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
            href="/"
            title="Trang chủ"
          >
            <Home className="size-4" />
          </Link>
          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto md:mt-5 md:flex-col md:gap-2 md:overflow-visible">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  aria-label={item.label}
                  className={`grid size-9 shrink-0 place-items-center rounded-lg border text-muted-foreground transition hover:border-slate-300 hover:text-foreground dark:hover:border-slate-700 ${
                    active
                      ? "border-primary bg-primary text-primary-foreground hover:text-primary-foreground"
                      : "border-transparent"
                  }`}
                  href={item.href}
                  key={item.href}
                  title={item.label}
                >
                  <Icon className="size-4" />
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1 md:flex-col">
          <ThemeToggle />
          {role === "ADMIN" && (
            <Link
              aria-label="Cài đặt"
              className="grid size-9 place-items-center rounded-lg border border-transparent text-muted-foreground transition hover:border-slate-300 hover:text-foreground dark:hover:border-slate-700"
              href="/admin"
              title="Cài đặt"
            >
              <Settings className="size-4" />
            </Link>
          )}
          <button
            aria-label="Đăng xuất"
            className="grid size-9 place-items-center rounded-lg border border-transparent text-muted-foreground transition hover:border-slate-300 hover:text-foreground dark:hover:border-slate-700"
            onClick={handleLogout}
            title="Đăng xuất"
            type="button"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-3 md:p-5">
        <div className="mx-auto max-w-[1500px] space-y-4">
          <header className="border-b border-gray-200 pb-4 text-foreground dark:border-slate-800 md:pb-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  QR Food/RMS
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-foreground">
                  {meta.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {meta.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <NotificationBell />
                <Link
                  className="rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary dark:border-slate-800"
                  href="/staff/orders"
                >
                  Quản lý đơn
                </Link>
                {role === "ADMIN" && (
                  <Link
                    className="rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary dark:border-slate-800"
                    href="/admin"
                  >
                    Quản trị
                  </Link>
                )}
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary dark:border-slate-800"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
