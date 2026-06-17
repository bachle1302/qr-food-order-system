"use client";

import { useState } from "react";
import { Minus, Plus, Utensils, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dish } from "@/features/menu/types";

type DishDetailSheetProps = {
  categoryName: string;
  dish: Dish | null;
  initialNote?: string;
  initialQuantity: number;
  onClose: () => void;
  onSave: (dishId: string, quantity: number, note?: string) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function DishDetailSheet({
  categoryName,
  dish,
  initialNote,
  initialQuantity,
  onClose,
  onSave,
}: DishDetailSheetProps) {
  const [quantity, setQuantity] = useState(Math.max(initialQuantity, 1));
  const [note, setNote] = useState(initialNote ?? "");

  if (!dish) {
    return null;
  }

  const isAvailable = dish.available;
  const subtotal = dish.price * quantity;

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[520px] bg-foreground/50 backdrop-blur-sm">
      <button
        aria-label="Đóng chi tiết món"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        type="button"
      />
      <section className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-hidden border-t border-gray-200 bg-gray-50 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="max-h-[calc(92vh-5rem)] overflow-y-auto">
          <div className="relative h-56 bg-gray-200 dark:bg-slate-800">
            {dish.imageUrl ? (
              <div
                aria-label={dish.name}
                className="h-full w-full bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url("${dish.imageUrl}")` }}
              />
            ) : (
              <div className="grid h-full place-items-center text-primary">
                <Utensils className="size-12" />
              </div>
            )}
            <Button
              aria-label="Đóng chi tiết món"
              className="absolute right-3 top-3 rounded-full bg-foreground/50 text-background backdrop-blur hover:bg-foreground/60"
              onClick={onClose}
              size="icon"
              type="button"
              variant="outline"
            >
              <X />
            </Button>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {categoryName}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-foreground">
                    {dish.name}
                  </h2>
                </div>
                {!isAvailable ? (
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Hết hàng
                  </span>
                ) : null}
              </div>
              {dish.description ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {dish.description}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Món chưa có mô tả chi tiết.
                </p>
              )}
              <p className="mt-2 text-xl font-bold text-primary">
                {formatCurrency(dish.price)}
              </p>
            </div>

            <label className="block text-sm font-medium text-foreground">
              Ghi chú cho món này
              <textarea
                className="mt-2 min-h-20 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm font-normal text-gray-800 outline-none placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-800 dark:text-slate-100"
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ít cay, không hành..."
                value={note}
              />
            </label>

            <div className="flex items-center justify-center gap-6 border-y border-gray-200 py-3 dark:border-slate-800">
              <span className="text-sm font-medium text-foreground">
                Số lượng
              </span>
              <div className="flex items-center gap-4">
                <Button
                  disabled={!isAvailable || quantity <= 1}
                  onClick={() => setQuantity((current) => current - 1)}
                  className="size-11 rounded-full bg-card"
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Minus />
                </Button>
                <span className="w-9 text-center text-2xl font-bold text-foreground">
                  {quantity}
                </span>
                <Button
                  disabled={!isAvailable}
                  onClick={() => setQuantity((current) => current + 1)}
                  className="size-11 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-500/15 dark:text-orange-300"
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Plus />
                </Button>
              </div>
            </div>

            {!isAvailable ? (
              <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                Món hiện chưa khả dụng. Vui lòng chọn món khác.
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <Button
            className="h-12 w-full justify-between rounded-xl bg-orange-500 px-4 text-base font-bold text-white shadow-md hover:bg-orange-600"
            disabled={!isAvailable}
            onClick={() =>
              onSave(dish.id, quantity, note.trim() || undefined)
            }
            type="button"
          >
            <span>
              {initialQuantity > 0 ? "Cập nhật giỏ" : "Thêm vào giỏ"}
            </span>
            <span>{formatCurrency(subtotal)}</span>
          </Button>
        </div>
      </section>
    </div>
  );
}
