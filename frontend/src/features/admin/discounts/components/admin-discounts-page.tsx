"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Save, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/error";
import { getAccessToken } from "@/shared/auth/token-storage";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import {
  createDiscount,
  deleteDiscount,
  getDiscountByCode,
  getDiscounts,
  updateDiscount,
} from "../api/discounts.client";
import type { AdminDiscount, DiscountPayload } from "../types";

type FormState = {
  id?: string;
  code: string;
  description: string;
  discountPercent: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  code: "",
  description: "",
  discountPercent: "10",
  minOrderAmount: "0",
  maxDiscountAmount: "0",
  startDate: "",
  endDate: "",
  usageLimit: "0",
  active: true,
};

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Phiên đăng nhập hết hạn hoặc không có quyền truy cập.";
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể xử lý yêu cầu quản lý mã giảm giá.";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) {
    return "Chưa có ngày";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeDateTime(value: string) {
  if (!value) {
    return "";
  }

  return value.length === 16 ? `${value}:00` : value;
}

function toDateTimeInput(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

function toPayload(form: FormState): DiscountPayload {
  const code = form.code.trim().toUpperCase();
  const discountPercent = Number(form.discountPercent);
  const minOrderAmount = Number(form.minOrderAmount);
  const maxDiscountAmount = Number(form.maxDiscountAmount);
  const usageLimit = Number(form.usageLimit);
  const startDate = normalizeDateTime(form.startDate);
  const endDate = normalizeDateTime(form.endDate);

  if (!code) {
    throw new Error("Mã giảm giá không được để trống.");
  }

  if (
    !Number.isFinite(discountPercent) ||
    discountPercent <= 0 ||
    discountPercent > 100
  ) {
    throw new Error("discountPercent phai > 0 va <= 100.");
  }

  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
    throw new Error("minOrderAmount phai >= 0.");
  }

  if (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount < 0) {
    throw new Error("maxDiscountAmount phai >= 0.");
  }

  if (!Number.isInteger(usageLimit) || usageLimit < 0) {
    throw new Error("usageLimit phai la so nguyen >= 0.");
  }

  if (!startDate || !endDate) {
    throw new Error("startDate va endDate la bat buoc.");
  }

  if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
    throw new Error("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.");
  }

  return {
    code,
    description: form.description.trim(),
    discountPercent,
    minOrderAmount,
    maxDiscountAmount,
    startDate,
    endDate,
    usageLimit,
    active: form.active,
  };
}

function upsertDiscount(
  discounts: AdminDiscount[],
  nextDiscount: AdminDiscount,
) {
  if (!discounts.some((discount) => discount.id === nextDiscount.id)) {
    return [nextDiscount, ...discounts];
  }

  return discounts.map((discount) =>
    discount.id === nextDiscount.id ? nextDiscount : discount,
  );
}

export function AdminDiscountsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [discounts, setDiscounts] = useState<AdminDiscount[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [codeQuery, setCodeQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDiscountId, setActiveDiscountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = Boolean(form.id);

  const visibleDiscounts = useMemo(() => {
    const query = codeQuery.trim().toUpperCase();

    return discounts
      .filter((discount) =>
        query ? discount.code.toUpperCase().includes(query) : true,
      )
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [codeQuery, discounts]);

  const loadDiscounts = useCallback(async (accessToken: string) => {
    setError(null);
    const response = await getDiscounts(accessToken);
    setDiscounts(response);
  }, []);

  useEffect(() => {
    async function load() {
      const accessToken = getAccessToken();
      setToken(accessToken);

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await loadDiscounts(accessToken);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [loadDiscounts]);

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function startEdit(discount: AdminDiscount) {
    setForm({
      id: discount.id,
      code: discount.code,
      description: discount.description ?? "",
      discountPercent: String(discount.discountPercent),
      minOrderAmount: String(discount.minOrderAmount),
      maxDiscountAmount: String(discount.maxDiscountAmount),
      startDate: toDateTimeInput(discount.startDate),
      endDate: toDateTimeInput(discount.endDate),
      usageLimit: String(discount.usageLimit),
      active: discount.active,
    });
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Vui lòng đăng nhập bằng tài khoản ADMIN.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const payload = toPayload(form);
      const saved = form.id
        ? await updateDiscount(form.id, payload, token)
        : await createDiscount(payload, token);

      setDiscounts((current) => upsertDiscount(current, saved));
      setNotice(form.id ? "Đã cập nhật mã giảm giá." : "Đã tạo mã giảm giá.");
      resetForm();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSearchByCode() {
    if (!token) {
      setError("Vui lòng đăng nhập bằng tài khoản ADMIN.");
      return;
    }

    const code = codeQuery.trim();
    if (!code) {
      await loadDiscounts(token);
      return;
    }

    setIsLoading(true);
    setError(null);
    setNotice(null);

    try {
      const found = await getDiscountByCode(code, token);
      setDiscounts((current) => upsertDiscount(current, found));
      setNotice("Đã tìm thấy mã giảm giá.");
    } catch (searchError) {
      setError(getErrorMessage(searchError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(discountId: string) {
    if (!token) {
      setError("Vui lòng đăng nhập bằng tài khoản ADMIN.");
      return;
    }

    if (!window.confirm("Xóa mã giảm giá này?")) {
      return;
    }

    setActiveDiscountId(discountId);
    setError(null);
    setNotice(null);

    try {
      await deleteDiscount(discountId, token);
      setDiscounts((current) =>
        current.filter((discount) => discount.id !== discountId),
      );
      if (form.id === discountId) {
        resetForm();
      }
      setNotice("Đã xóa mã giảm giá.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setActiveDiscountId(null);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Cần đăng nhập"
          description="Vui lòng đăng nhập bằng tài khoản ADMIN để quản lý mã giảm giá."
        />
        <Button asChild>
          <Link href="/login">Đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {isEditing ? "Sửa mã giảm giá" : "Tạo mã giảm giá mới"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Màn này chỉ quản lý mã giảm giá, chưa tích hợp vào luồng đặt món.
            </p>
          </div>
          {isEditing ? (
            <Button onClick={resetForm} type="button" variant="outline">
              <X />
              Hủy sửa
            </Button>
          ) : null}
        </div>

        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 lg:grid-cols-3">
            <label className="grid gap-1 text-sm text-foreground">
              Code
              <input
                className="h-9 rounded-md border border-border bg-background px-3 text-sm uppercase text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
                placeholder="WELCOME10"
                value={form.code}
              />
            </label>
            <label className="grid gap-1 text-sm text-foreground">
              Discount percent
              <input
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                max={100}
                min={1}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    discountPercent: event.target.value,
                  }))
                }
                type="number"
                value={form.discountPercent}
              />
            </label>
            <label className="grid gap-1 text-sm text-foreground">
              Usage limit
              <input
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                min={0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    usageLimit: event.target.value,
                  }))
                }
                type="number"
                value={form.usageLimit}
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm text-foreground">
            Description
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Mô tả mã giảm giá"
              value={form.description}
            />
          </label>

          <div className="grid gap-3 lg:grid-cols-2">
            <label className="grid gap-1 text-sm text-foreground">
              Giá trị đơn tối thiểu
              <input
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                min={0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    minOrderAmount: event.target.value,
                  }))
                }
                type="number"
                value={form.minOrderAmount}
              />
            </label>
            <label className="grid gap-1 text-sm text-foreground">
              Max discount amount
              <input
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                min={0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxDiscountAmount: event.target.value,
                  }))
                }
                type="number"
                value={form.maxDiscountAmount}
              />
            </label>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <label className="grid gap-1 text-sm text-foreground">
              Start date
              <input
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                type="datetime-local"
                value={form.startDate}
              />
            </label>
            <label className="grid gap-1 text-sm text-foreground">
              End date
              <input
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                type="datetime-local"
                value={form.endDate}
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                checked={form.active}
                className="size-4 accent-primary"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              Active
            </label>
            <Button disabled={isSubmitting} type="submit">
              {isEditing ? <Save /> : <Plus />}
              {isEditing ? "Lưu" : "Tạo mã"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-1 text-sm text-foreground">
            Search code
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm uppercase text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setCodeQuery(event.target.value)}
              placeholder="WELCOME10"
              value={codeQuery}
            />
          </label>
          <Button onClick={handleSearchByCode} type="button" variant="outline">
            <Search />
            Tim theo code
          </Button>
          <Button
            onClick={() => {
              setCodeQuery("");
              if (token) {
                void loadDiscounts(token);
              }
            }}
            type="button"
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </section>

      {notice ? (
        <div className="rounded-lg border border-border bg-muted p-3 text-sm text-foreground">
          {notice}
        </div>
      ) : null}

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? (
        <LoadingState label="Đang tải danh sách mã giảm giá..." />
      ) : null}

      {!isLoading && visibleDiscounts.length === 0 ? (
        <EmptyState
          title="Chưa có mã giảm giá"
          description="Không có mã nào phù hợp với điều kiện hiện tại."
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleDiscounts.map((discount) => {
          const isActive = activeDiscountId === discount.id;

          return (
            <article
              className="rounded-lg border border-border bg-card p-4"
              key={discount.id}
            >
              <div className="flex h-full flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {discount.code}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {discount.description || "Chưa có mô tả."}
                      </p>
                    </div>
                    <span className="w-fit rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground">
                      {discount.active ? "active" : "inactive"}
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p className="text-muted-foreground">
                      Percent:{" "}
                      <span className="text-foreground">
                        {discount.discountPercent}%
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Usage:{" "}
                      <span className="text-foreground">
                        {discount.usageCount}/{discount.usageLimit}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Đơn tối thiểu:{" "}
                      <span className="text-foreground">
                        {formatCurrency(discount.minOrderAmount)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Max discount:{" "}
                      <span className="text-foreground">
                        {formatCurrency(discount.maxDiscountAmount)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Start:{" "}
                      <span className="text-foreground">
                        {formatDate(discount.startDate)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      End:{" "}
                      <span className="text-foreground">
                        {formatDate(discount.endDate)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => startEdit(discount)}
                    type="button"
                    variant="outline"
                  >
                    Sửa
                  </Button>
                  <Button
                    disabled={isActive}
                    onClick={() => handleDelete(discount.id)}
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 />
                    Xóa
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
