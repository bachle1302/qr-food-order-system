"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/error";
import { getAccessToken } from "@/shared/auth/token-storage";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../api/categories.client";
import type { AdminCategory, CategoryPayload } from "../types";

type FormState = {
  id?: string;
  name: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
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

  return "Không thể xử lý yêu cầu quản lý danh mục.";
}

function toPayload(form: FormState): CategoryPayload {
  const name = form.name.trim();

  if (!name) {
    throw new Error("Tên danh mục không được để trống.");
  }

  return {
    name,
    description: form.description.trim(),
  };
}

function upsertCategory(
  categories: AdminCategory[],
  nextCategory: AdminCategory,
) {
  if (!categories.some((category) => category.id === nextCategory.id)) {
    return [nextCategory, ...categories];
  }

  return categories.map((category) =>
    category.id === nextCategory.id ? nextCategory : category,
  );
}

export function AdminCategoriesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = Boolean(form.id);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) =>
        a.name.localeCompare(b.name, "vi"),
      ),
    [categories],
  );

  const loadCategories = useCallback(async (accessToken: string) => {
    setError(null);
    const response = await getCategories(accessToken);
    setCategories(response);
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
        await loadCategories(accessToken);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [loadCategories]);

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function startEdit(category: AdminCategory) {
    setForm({
      id: category.id,
      name: category.name,
      description: category.description ?? "",
    });
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
        ? await updateCategory(form.id, payload, token)
        : await createCategory(payload, token);

      setCategories((current) => upsertCategory(current, saved));
      setNotice(form.id ? "Đã cập nhật danh mục." : "Đã tạo danh mục mới.");
      resetForm();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(categoryId: string) {
    if (!token) {
      setError("Vui lòng đăng nhập bằng tài khoản ADMIN.");
      return;
    }

    if (!window.confirm("Xóa danh mục này?")) {
      return;
    }

    setActiveCategoryId(categoryId);
    setError(null);
    setNotice(null);

    try {
      await deleteCategory(categoryId, token);
      setCategories((current) =>
        current.filter((category) => category.id !== categoryId),
      );
      if (form.id === categoryId) {
        resetForm();
      }
      setNotice("Đã xóa danh mục.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setActiveCategoryId(null);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Cần đăng nhập"
          description="Vui lòng đăng nhập bằng tài khoản ADMIN để quản lý danh mục."
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
              {isEditing ? "Sửa danh mục" : "Tạo danh mục mới"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý nhóm món ăn hiển thị trong menu public.
            </p>
          </div>
          {isEditing ? (
            <Button onClick={resetForm} type="button" variant="outline">
              <X />
              Hủy sửa
            </Button>
          ) : null}
        </div>

        <form
          className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_auto]"
          onSubmit={handleSubmit}
        >
          <label className="grid gap-1 text-sm text-foreground">
            Tên danh mục
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Món chính"
              value={form.name}
            />
          </label>
          <label className="grid gap-1 text-sm text-foreground">
            Mô tả
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Các món ăn chính trong menu"
              value={form.description}
            />
          </label>
          <div className="flex items-end">
            <Button disabled={isSubmitting} type="submit">
              {isEditing ? <Save /> : <Plus />}
              {isEditing ? "Lưu" : "Tạo danh mục"}
            </Button>
          </div>
        </form>
      </section>

      {notice ? (
        <div className="rounded-lg border border-border bg-muted p-3 text-sm text-foreground">
          {notice}
        </div>
      ) : null}

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? (
        <LoadingState label="Đang tải danh sách danh mục..." />
      ) : null}

      {!isLoading && sortedCategories.length === 0 ? (
        <EmptyState
          title="Chưa có danh mục"
          description="Tạo danh mục đầu tiên để sắp xếp menu món ăn."
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {sortedCategories.map((category) => {
          const isActive = activeCategoryId === category.id;

          return (
            <article
              className="rounded-lg border border-border bg-card p-4"
              key={category.id}
            >
              <div className="flex h-full flex-col justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {category.description || "Chưa có mô tả."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => startEdit(category)}
                    type="button"
                    variant="outline"
                  >
                    Sửa
                  </Button>
                  <Button
                    disabled={isActive}
                    onClick={() => handleDelete(category.id)}
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
