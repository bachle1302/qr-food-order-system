"use client";

import { FormEvent, useState } from "react";
import { Loader2, Phone, ScanLine, Store, UserRound, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/error";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { checkInCustomer } from "../api/customer-session.client";
import type { CustomerSession } from "../types";

type GuestCheckInFormProps = {
  qrToken: string;
  tableName: string;
  message?: string | null;
  onCheckedIn: (session: CustomerSession) => void;
};

function getCheckInErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể check-in. Vui lòng thử lại.";
}

export function GuestCheckInForm({
  qrToken,
  tableName,
  message,
  onCheckedIn,
}: GuestCheckInFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("Vui lòng nhập tên để nhân viên nhận diện đơn.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const session = await checkInCustomer({
        qrToken,
        name: trimmedName,
        phone: trimmedPhone || undefined,
      });

      onCheckedIn(session);
    } catch (checkInError) {
      setError(getCheckInErrorMessage(checkInError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-foreground dark:bg-slate-950">
      <section className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center bg-transparent px-5 py-8">
        <div className="border-y border-gray-200 py-6 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">
              <ScanLine className="size-3.5" />
              Quét QR tại bàn
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="grid size-10 place-items-center rounded-lg bg-orange-500 text-white shadow-sm">
                <Utensils className="size-5" />
              </div>
            </div>
          </div>

          <div className="mt-7">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Store className="size-4" />
              {tableName || "Bàn của bạn"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Bạn muốn đặt món?
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Nhập tên để nhân viên biết ai đang đặt món và phục vụ đúng đơn
              của bạn.
            </p>
          </div>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            {message ? (
              <div className="border-l-4 border-orange-500 py-2 pl-3 text-sm text-gray-600 dark:text-slate-400">
                {message}
              </div>
            ) : null}

            <label className="block text-sm font-medium text-foreground">
              Tên khách hàng
              <span className="text-destructive"> *</span>
              <span className="relative mt-2 block">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoComplete="name"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-transparent pl-10 pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-800 dark:text-slate-100"
                  disabled={isSubmitting}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ví dụ: Anh Minh"
                  value={name}
                />
              </span>
            </label>

            <label className="block text-sm font-medium text-foreground">
              Số điện thoại
              <span className="ml-1 text-muted-foreground">
                (không bắt buộc)
              </span>
              <span className="relative mt-2 block">
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoComplete="tel"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-transparent pl-10 pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-800 dark:text-slate-100"
                  disabled={isSubmitting}
                  inputMode="tel"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  value={phone}
                />
              </span>
            </label>

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-background p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button className="h-12 w-full rounded-xl bg-orange-500 font-bold text-white shadow-lg hover:bg-orange-600" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Đang check-in
                </>
              ) : (
                "Bắt đầu đặt món"
              )}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
