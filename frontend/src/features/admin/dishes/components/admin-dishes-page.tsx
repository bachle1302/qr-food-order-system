"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ImagePlus, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/features/admin/categories/api/categories.client";
import type { AdminCategory } from "@/features/admin/categories/types";
import { ApiError } from "@/shared/api/error";
import { getAccessToken } from "@/shared/auth/token-storage";
import { env } from "@/shared/config/env";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import {
  createDish,
  deleteDish,
  getDishes,
  updateDish,
} from "../api/dishes.client";
import { uploadDishImageToCloudinary } from "../api/cloudinary-upload.client";
import type { AdminDish, DishPayload } from "../types";

type FormState = {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  categoryId: string;
  available: boolean;
};

type AvailableFilter = "ALL" | "AVAILABLE" | "UNAVAILABLE";

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  imageUrl: "",
  price: "",
  categoryId: "",
  available: true,
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

  return "Không thể xử lý yêu cầu quản lý món ăn.";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function toPayload(form: FormState): DishPayload {
  const name = form.name.trim();
  const price = Number(form.price);
  const categoryId = form.categoryId.trim();

  if (!name) {
    throw new Error("Tên món không được để trống.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Giá món phải lớn hơn 0.");
  }

  if (!categoryId) {
    throw new Error("Vui lòng chọn danh mục.");
  }

  return {
    name,
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim(),
    price,
    categoryId,
    available: form.available,
  };
}

function upsertDish(dishes: AdminDish[], nextDish: AdminDish) {
  if (!dishes.some((dish) => dish.id === nextDish.id)) {
    return [nextDish, ...dishes];
  }

  return dishes.map((dish) => (dish.id === nextDish.id ? nextDish : dish));
}

export function AdminDishesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [dishes, setDishes] = useState<AdminDish[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [availableFilter, setAvailableFilter] =
    useState<AvailableFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [activeDishId, setActiveDishId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = Boolean(form.id);
  const isCloudinaryConfigured = Boolean(
    env.cloudinaryCloudName && env.cloudinaryUploadPreset,
  );

  const categoryNameById = useMemo(
    () =>
      new Map(
        categories.map((category) => [category.id, category.name] as const),
      ),
    [categories],
  );

  const visibleDishes = useMemo(() => {
    return dishes
      .filter((dish) =>
        categoryFilter === "ALL" ? true : dish.categoryId === categoryFilter,
      )
      .filter((dish) => {
        if (availableFilter === "ALL") {
          return true;
        }
        return availableFilter === "AVAILABLE"
          ? dish.available
          : !dish.available;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [availableFilter, categoryFilter, dishes]);

  const loadData = useCallback(async (accessToken: string) => {
    setError(null);
    const [dishResponse, categoryResponse] = await Promise.all([
      getDishes(accessToken),
      getCategories(accessToken),
    ]);

    setDishes(dishResponse);
    setCategories(categoryResponse);
    setForm((current) =>
      current.categoryId || categoryResponse.length === 0
        ? current
        : { ...current, categoryId: categoryResponse[0].id },
    );
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
        await loadData(accessToken);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [loadData]);

  function resetForm() {
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id ?? "",
    });
    setSelectedImageFile(null);
    setImageUploadError(null);
  }

  function startEdit(dish: AdminDish) {
    setForm({
      id: dish.id,
      name: dish.name,
      description: dish.description ?? "",
      imageUrl: dish.imageUrl ?? "",
      price: String(dish.price),
      categoryId: dish.categoryId,
      available: dish.available,
    });
    setSelectedImageFile(null);
    setImageUploadError(null);
    setError(null);
    setNotice(null);
  }

  function handleImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedImageFile(file);
    setImageUploadError(null);
  }

  async function handleUploadImage() {
    if (!selectedImageFile) {
      setImageUploadError("Vui lòng chọn ảnh trước khi upload.");
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);
    setNotice(null);

    try {
      const secureUrl = await uploadDishImageToCloudinary(selectedImageFile);
      setForm((current) => ({
        ...current,
        imageUrl: secureUrl,
      }));
      setSelectedImageFile(null);
      setNotice("Đã upload ảnh món ăn.");
    } catch (uploadError) {
      setImageUploadError(getErrorMessage(uploadError));
    } finally {
      setIsUploadingImage(false);
    }
  }

  function clearImageUrl() {
    setForm((current) => ({
      ...current,
      imageUrl: "",
    }));
    setSelectedImageFile(null);
    setImageUploadError(null);
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
        ? await updateDish(form.id, payload, token)
        : await createDish(payload, token);

      setDishes((current) => upsertDish(current, saved));
      setNotice(form.id ? "Đã cập nhật món ăn." : "Đã tạo món ăn mới.");
      resetForm();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(dishId: string) {
    if (!token) {
      setError("Vui lòng đăng nhập bằng tài khoản ADMIN.");
      return;
    }

    if (!window.confirm("Xóa món ăn này?")) {
      return;
    }

    setActiveDishId(dishId);
    setError(null);
    setNotice(null);

    try {
      await deleteDish(dishId, token);
      setDishes((current) => current.filter((dish) => dish.id !== dishId));
      if (form.id === dishId) {
        resetForm();
      }
      setNotice("Đã xóa món ăn.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setActiveDishId(null);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Cần đăng nhập"
          description="Vui lòng đăng nhập bằng tài khoản ADMIN để quản lý món ăn."
        />
        <Button asChild>
          <Link href="/login">Đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.length === 0 && !isLoading ? (
        <ErrorState
          title="Cần tạo danh mục trước"
          message="Chưa có danh mục nào để gán món ăn. Hãy tạo danh mục trước."
        />
      ) : null}

      <section className="border-y border-gray-200 py-4 dark:border-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {isEditing ? "Sửa món ăn" : "Tạo món ăn mới"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Chọn ảnh để upload lên Cloudinary hoặc nhập trực tiếp imageUrl.
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
              Tên món
              <input
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Com ga sot tieu"
                value={form.name}
              />
            </label>
            <label className="grid gap-1 text-sm text-foreground">
              Gia
              <input
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                min={1}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
                placeholder="45000"
                type="number"
                value={form.price}
              />
            </label>
            <label className="grid gap-1 text-sm text-foreground">
              Danh muc
              <select
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                value={form.categoryId}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3">
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
                placeholder="Mô tả ngắn về món ăn"
                value={form.description}
              />
            </label>
            <div className="grid gap-3 border-y border-border py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ImagePlus className="size-4 text-primary" />
                    Ảnh món ăn
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload ảnh lên Cloudinary để lấy secure_url, hoặc nhập imageUrl thủ công.
                  </p>
                  {!isCloudinaryConfigured ? (
                    <p className="mt-2 text-xs text-destructive">
                      Chưa cấu hình Cloudinary. Vui lòng thêm NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME và NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
                    </p>
                  ) : null}
                </div>
                {form.imageUrl ? (
                  <Button onClick={clearImageUrl} type="button" variant="outline">
                    <X />
                    Xóa ảnh
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 lg:grid-cols-[14rem_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-lg border border-border bg-muted">
                  {form.imageUrl ? (
                    <div
                      aria-label="Ảnh món ăn"
                      className="aspect-[4/3] bg-cover bg-center"
                      role="img"
                      style={{ backgroundImage: `url("${form.imageUrl}")` }}
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center px-4 text-center text-sm text-muted-foreground">
                      Chưa có ảnh
                    </div>
                  )}
                </div>

                <div className="grid gap-3">
                  <label className="grid gap-1 text-sm text-foreground">
                    Chọn ảnh từ máy
                    <input
                      accept="image/*"
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                      onChange={handleImageFileChange}
                      type="file"
                    />
                  </label>

                  {selectedImageFile ? (
                    <p className="text-xs text-muted-foreground">
                      Đã chọn: {selectedImageFile.name}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={isUploadingImage || !selectedImageFile}
                      onClick={handleUploadImage}
                      type="button"
                      variant="outline"
                    >
                      <Upload />
                      {isUploadingImage ? "Đang upload..." : "Upload ảnh"}
                    </Button>
                  </div>

                  {imageUploadError ? (
                    <p className="text-sm text-destructive">{imageUploadError}</p>
                  ) : null}

                  <label className="grid gap-1 text-sm text-foreground">
                    imageUrl
                    <input
                      className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          imageUrl: event.target.value,
                        }))
                      }
                      placeholder="https://res.cloudinary.com/..."
                      value={form.imageUrl}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                checked={form.available}
                className="size-4 accent-primary"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    available: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              Available
            </label>
            <Button
              disabled={isSubmitting || categories.length === 0}
              type="submit"
            >
              {isEditing ? <Save /> : <Plus />}
              {isEditing ? "Lưu" : "Tạo món"}
            </Button>
          </div>
        </form>
      </section>

      <section className="border-y border-gray-200 py-4 dark:border-slate-800">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm text-foreground">
            Lọc theo danh mục
            <select
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setCategoryFilter(event.target.value)}
              value={categoryFilter}
            >
              <option value="ALL">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-foreground">
            Lọc theo trạng thái bán
            <select
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                setAvailableFilter(event.target.value as AvailableFilter)
              }
              value={availableFilter}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </label>
        </div>
      </section>

      {notice ? (
        <div className="border-l-4 border-primary py-2 pl-3 text-sm text-foreground">
          {notice}
        </div>
      ) : null}

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingState label="Đang tải danh sách món ăn..." /> : null}

      {!isLoading && visibleDishes.length === 0 ? (
        <EmptyState
          title="Chưa có món ăn"
          description="Không có món nào phù hợp bộ lọc hiện tại."
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleDishes.map((dish) => {
          const isActive = activeDishId === dish.id;
          const categoryName =
            categoryNameById.get(dish.categoryId) ?? "Unknown category";

          return (
            <article
              className="overflow-hidden border-y border-gray-200 dark:border-slate-800"
              key={dish.id}
            >
              <div className="grid gap-0 sm:grid-cols-[160px_minmax(0,1fr)]">
                <div className="aspect-[4/3] bg-muted sm:aspect-auto">
                  {dish.imageUrl ? (
                    <div
                      aria-label={dish.name}
                      className="h-full min-h-40 bg-cover bg-center"
                      role="img"
                      style={{ backgroundImage: `url(${dish.imageUrl})` }}
                    />
                  ) : (
                    <div className="flex h-full min-h-40 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                      Chưa có ảnh
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-col justify-between gap-4 p-4">
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {dish.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {categoryName}
                        </p>
                      </div>
                      <span className="w-fit rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground">
                        {dish.available ? "available" : "unavailable"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dish.description || "Chưa có mô tả."}
                    </p>
                    <p className="font-medium text-foreground">
                      {formatCurrency(dish.price)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => startEdit(dish)}
                      type="button"
                      variant="outline"
                    >
                      Sửa
                    </Button>
                    <Button
                      disabled={isActive}
                      onClick={() => handleDelete(dish.id)}
                      type="button"
                      variant="destructive"
                    >
                      <Trash2 />
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
