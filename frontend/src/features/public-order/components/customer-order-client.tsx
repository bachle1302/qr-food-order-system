"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Clock3,
  Loader2,
  Minus,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  Utensils,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/error";
import { useNotifications } from "@/shared/notifications/notification-store";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { getCustomerSessionOrders } from "../api/customer-orders.client";
import { createQrOrder } from "../api/public-order.client";
import { CustomerOrdersSection as CustomerOrdersSectionView } from "./customer-orders-section";
import { DishDetailSheet } from "./dish-detail-sheet";
import { GuestCheckInForm } from "./guest-check-in-form";
import type {
  CustomerSession,
  OrderResponse,
  PublicOrderDraftItem,
  TableQrInfo,
} from "../types";
import type { Category, Dish } from "@/features/menu/types";

type CustomerOrderClientProps = {
  qrToken: string;
  table: TableQrInfo;
  categories: Category[];
  dishes: Dish[];
};

type CartLine = PublicOrderDraftItem;

type CartLineWithDish = CartLine & {
  dish: Dish;
};

type ActiveTab = "menu" | "orders";
type MenuSection = {
  id: string;
  name: string;
  dishes: Dish[];
};

const ALL_CATEGORIES = "all";
const TERMINAL_ORDER_STATUSES = new Set(["PAID", "COMPLETED", "CANCELLED"]);

const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Chờ xử lý",
  CONFIRMED: "Đã nhận",
  PREPARING: "Đang nấu",
  READY: "Sẵn sàng",
  SERVED: "Đã phục vụ",
  PAID: "Đã thanh toán",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getOrderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] ?? status;
}

function getShortOrderId(orderId: string) {
  return orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId;
}

function hasOpenOrder(orders: OrderResponse[]) {
  return orders.some((order) => !TERMINAL_ORDER_STATUSES.has(order.status));
}

function getSubmitErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể tạo đơn. Vui lòng thử lại.";
}

function getCategoryName(categories: Category[], categoryId: string) {
  return (
    categories.find((category) => category.id === categoryId)?.name ??
    "Chưa phân loại"
  );
}

function getDishName(dishes: Dish[], dishId: string) {
  return dishes.find((dish) => dish.id === dishId)?.name ?? `Món ${dishId}`;
}

function getCustomerSessionStorageKey(qrToken: string) {
  return `qrfood_customer_session_${qrToken}`;
}

function readStoredSession(qrToken: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const key = getCustomerSessionStorageKey(qrToken);
  const rawSession =
    window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as Partial<CustomerSession>;
    if (
      session.sessionId &&
      session.customerId &&
      session.customerName &&
      session.qrToken === qrToken
    ) {
      window.localStorage.setItem(key, rawSession);
      window.sessionStorage.removeItem(key);
      return session as CustomerSession;
    }
  } catch {
    // Invalid browser storage should not block a guest from checking in again.
  }

  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
  return null;
}

function storeCustomerSession(qrToken: string, session: CustomerSession) {
  if (typeof window === "undefined") {
    return;
  }

  const key = getCustomerSessionStorageKey(qrToken);
  window.localStorage.setItem(key, JSON.stringify(session));
  window.sessionStorage.removeItem(key);
}

function clearStoredSession(qrToken: string) {
  if (typeof window === "undefined") {
    return;
  }

  const key = getCustomerSessionStorageKey(qrToken);
  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
}

function isCustomerSessionError(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 400) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("customer session") ||
    message.includes("session") ||
    message.includes("khách")
  );
}

export function CustomerOrderClient({
  qrToken,
  table,
  categories,
  dishes,
}: CustomerOrderClientProps) {
  const { addNotification } = useNotifications();
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>(ALL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<OrderResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("menu");
  const [customerSession, setCustomerSession] =
    useState<CustomerSession | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderResponse[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const categoryPillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastScrollYRef = useRef(0);
  const knownOrderStatusRef = useRef<Record<string, string>>({});
  const hasLoadedCustomerOrdersRef = useRef(false);

  const loadCustomerOrders = useCallback(
    async (session: CustomerSession, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsLoadingOrders(true);
      }
      setOrdersError(null);

      try {
        const orders = await getCustomerSessionOrders(
          session.sessionId,
          qrToken,
        );
        const previousStatuses = knownOrderStatusRef.current;

        if (hasLoadedCustomerOrdersRef.current) {
          for (const order of orders) {
            const previousStatus = previousStatuses[order.id];
            if (previousStatus && previousStatus !== order.status) {
              addNotification({
                message: `Đơn #${getShortOrderId(order.id)}: ${getOrderStatusLabel(order.status)}`,
                title: "Trạng thái đơn đã cập nhật",
                type:
                  order.status === "READY" ||
                  order.status === "SERVED" ||
                  order.status === "PAID" ||
                  order.status === "COMPLETED"
                    ? "success"
                    : "info",
              });
            }
          }
        }

        knownOrderStatusRef.current = Object.fromEntries(
          orders.map((order) => [order.id, order.status]),
        );
        hasLoadedCustomerOrdersRef.current = true;
        setCustomerOrders(orders);
      } catch (error) {
        if (isCustomerSessionError(error)) {
          clearStoredSession(qrToken);
          setCustomerSession(null);
          setCustomerOrders([]);
          knownOrderStatusRef.current = {};
          hasLoadedCustomerOrdersRef.current = false;
          setCheckInMessage(
            "Phiên gọi món đã hết hạn hoặc không còn khớp với bàn. Vui lòng check-in lại để xem đơn.",
          );
          return;
        }

        setOrdersError(
          error instanceof Error
            ? error.message
            : "Không thể tải trạng thái đơn.",
        );
      } finally {
        if (!options?.silent) {
          setIsLoadingOrders(false);
        }
      }
    },
    [addNotification, qrToken],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedSession = readStoredSession(qrToken);
      setCustomerSession(storedSession);
      if (storedSession) {
        void loadCustomerOrders(storedSession);
      }
      setIsRestoringSession(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadCustomerOrders, qrToken]);

  useEffect(() => {
    if (!customerSession || !hasOpenOrder(customerOrders)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadCustomerOrders(customerSession, { silent: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [customerOrders, customerSession, loadCustomerOrders]);

  const categorySections = useMemo<MenuSection[]>(() => {
    const knownCategoryIds = new Set(categories.map((category) => category.id));
    const sections = categories.map((category) => ({
      id: category.id,
      name: category.name,
      dishes: dishes.filter((dish) => dish.categoryId === category.id),
    }));

    const uncategorizedDishes = dishes.filter(
      (dish) => !knownCategoryIds.has(dish.categoryId),
    );

    if (uncategorizedDishes.length > 0) {
      sections.push({
        id: "uncategorized",
        name: "Khác",
        dishes: uncategorizedDishes,
      });
    }

    return sections;
  }, [categories, dishes]);

  const sectionCounts = useMemo(() => {
    return categorySections.reduce<Record<string, number>>((counts, section) => {
      counts[section.id] = section.dishes.length;
      return counts;
    }, {});
  }, [categorySections]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return dishes.filter(
      (dish) =>
        dish.name.toLowerCase().includes(query) ||
        (dish.description ?? "").toLowerCase().includes(query),
    );
  }, [dishes, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  const cartWithDishes = useMemo<CartLineWithDish[]>(() => {
    return cart.flatMap((item) => {
      const dish = dishes.find((currentDish) => currentDish.id === item.dishId);
      return dish ? [{ ...item, dish }] : [];
    });
  }, [cart, dishes]);

  const totalItems = cartWithDishes.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const previewTotal = cartWithDishes.reduce(
    (sum, item) => sum + item.dish.price * item.quantity,
    0,
  );

  useEffect(() => {
    if (activeTab !== "menu") {
      return;
    }

    let frameId = 0;

    function handleScroll() {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const lastY = lastScrollYRef.current;

        if (currentY > lastY + 12 && currentY > 80) {
          setIsHeaderCompact(true);
        } else if (currentY < lastY - 12 || currentY < 24) {
          setIsHeaderCompact(false);
        }

        if (!isSearching) {
          let nextActive = ALL_CATEGORIES;
          for (const section of categorySections) {
            const element = sectionRefs.current[section.id];
            if (!element) {
              continue;
            }

            const top = element.getBoundingClientRect().top;
            if (top <= 170) {
              nextActive = section.id;
            }
          }
          setSelectedCategoryId(nextActive);
        }

        lastScrollYRef.current = currentY;
        frameId = 0;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [activeTab, categorySections, isSearching]);

  useEffect(() => {
    categoryPillRefs.current[selectedCategoryId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedCategoryId]);

  function scrollToCategory(categoryId: string) {
    setSelectedCategoryId(categoryId);

    if (categoryId === ALL_CATEGORIES) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const element = sectionRefs.current[categoryId];
    if (!element) {
      return;
    }

    const topOffset = isHeaderCompact ? 72 : 240;
    const top = element.getBoundingClientRect().top + window.scrollY - topOffset;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }

  function updateQuantity(dishId: string, quantity: number) {
    setSubmitError(null);
    setSuccessOrder(null);
    setCart((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.dishId !== dishId);
      }

      const existing = current.find((item) => item.dishId === dishId);
      if (!existing) {
        return [...current, { dishId, quantity }];
      }

      return current.map((item) =>
        item.dishId === dishId ? { ...item, quantity } : item,
      );
    });
  }

  function updateItemNote(dishId: string, note: string) {
    setCart((current) =>
      current.map((item) =>
        item.dishId === dishId ? { ...item, note } : item,
      ),
    );
  }

  function saveDishDetail(dishId: string, quantity: number, note?: string) {
    setSubmitError(null);
    setSuccessOrder(null);
    setCart((current) => {
      const existing = current.find((item) => item.dishId === dishId);
      if (!existing) {
        return [...current, { dishId, quantity, note }];
      }

      return current.map((item) =>
        item.dishId === dishId ? { ...item, quantity, note } : item,
      );
    });
    setSelectedDish(null);
  }

  function getQuantity(dishId: string) {
    return cart.find((item) => item.dishId === dishId)?.quantity ?? 0;
  }

  function handleCheckedIn(session: CustomerSession) {
    storeCustomerSession(qrToken, session);
    setCustomerSession(session);
    knownOrderStatusRef.current = {};
    hasLoadedCustomerOrdersRef.current = false;
    setCheckInMessage(null);
    setSubmitError(null);
    setActiveTab("menu");
    void loadCustomerOrders(session);
  }

  function handleSwitchGuest() {
    clearStoredSession(qrToken);
    setCustomerSession(null);
    setCustomerOrders([]);
    knownOrderStatusRef.current = {};
    hasLoadedCustomerOrdersRef.current = false;
    setCart([]);
    setOrderNote("");
    setSuccessOrder(null);
    setIsCartOpen(false);
    setCheckInMessage("Bạn có thể nhập tên khách mới để bắt đầu phiên gọi món.");
  }

  async function handleSubmit() {
    if (cartWithDishes.length === 0 || isSubmitting) {
      return;
    }

    if (!customerSession) {
      setSubmitError("Vui lòng check-in trước khi gửi đơn.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const order = await createQrOrder({
        qrToken,
        customerSessionId: customerSession.sessionId,
        note: orderNote.trim() || undefined,
        items: cartWithDishes.map((item) => ({
          dishId: item.dishId,
          quantity: item.quantity,
          note: item.note?.trim() || undefined,
        })),
      });

      setSuccessOrder(order);
      knownOrderStatusRef.current = {
        ...knownOrderStatusRef.current,
        [order.id]: order.status,
      };
      hasLoadedCustomerOrdersRef.current = true;
      addNotification({
        message: "Nhân viên sẽ xác nhận đơn của bạn.",
        title: "Đã gửi đơn thành công",
        type: "success",
      });
      setCustomerOrders((currentOrders) => [
        order,
        ...currentOrders.filter((currentOrder) => currentOrder.id !== order.id),
      ]);
      void loadCustomerOrders(customerSession, { silent: true });
      setCart([]);
      setOrderNote("");
      setIsCartOpen(false);
      setActiveTab("orders");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (isCustomerSessionError(error)) {
        clearStoredSession(qrToken);
        setCustomerSession(null);
        knownOrderStatusRef.current = {};
        hasLoadedCustomerOrdersRef.current = false;
        setCheckInMessage(
          "Phiên gọi món đã hết hạn hoặc không còn khớp với bàn. Vui lòng check-in lại để gửi đơn.",
        );
        setIsCartOpen(false);
        return;
      }

      setSubmitError(getSubmitErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isRestoringSession) {
    return (
      <section className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center bg-background px-5 py-10">
        <div className="rounded-lg border border-border bg-card p-5 text-card-foreground">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Đang kiểm tra phiên gọi món...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!customerSession) {
    return (
      <GuestCheckInForm
        message={checkInMessage}
        onCheckedIn={handleCheckedIn}
        qrToken={qrToken}
        tableName={table.name}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-foreground dark:bg-slate-950">
      <div className="mx-auto min-h-screen max-w-[520px] overflow-hidden bg-transparent">
        <div
          className={`fixed inset-x-0 top-0 z-30 mx-auto max-w-[520px] border-b border-gray-200 bg-gray-50/95 backdrop-blur transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950/95 ${
            isHeaderCompact && activeTab === "menu"
              ? "-translate-y-[calc(100%-0.75rem)]"
              : "translate-y-0"
          }`}
        >
          <CustomerSampleHeader
            customerName={customerSession.customerName}
            onViewOrders={() => setActiveTab("orders")}
            onSwitchGuest={handleSwitchGuest}
            orderCount={customerOrders.length}
            tableName={table.name}
          />
          <div className="space-y-3 px-4 pb-3">
            {activeTab === "menu" ? (
              <>
                <SearchBox
                  onChange={setSearchQuery}
                  searchQuery={searchQuery}
                />
                <CategoryPills
                  categories={categorySections}
                  categoryCounts={sectionCounts}
                  onRegisterPill={(categoryId, element) => {
                    categoryPillRefs.current[categoryId] = element;
                  }}
                  onSelect={scrollToCategory}
                  selectedCategoryId={selectedCategoryId}
                  totalCount={dishes.length}
                />
              </>
            ) : null}
          </div>
        </div>

        <main
          className={`space-y-5 bg-transparent px-4 pb-28 ${
            activeTab === "menu"
              ? "pt-[calc(env(safe-area-inset-top)+16.5rem)]"
              : "pt-[calc(env(safe-area-inset-top)+10rem)]"
          }`}
        >
          {successOrder ? (
            <SuccessNotice activeTab={activeTab} onToggleTab={setActiveTab} />
          ) : null}

          {activeTab === "menu" ? (
            <>
              <NoticeCard />

              {isSearching ? (
                searchResults.length === 0 ? (
                  <EmptyMenuState
                    description="Không tìm thấy món phù hợp. Xóa từ khóa để xem toàn bộ menu."
                    title="Không có món phù hợp"
                  />
                ) : (
                  <section className="space-y-3">
                    <SectionTitle
                      count={searchResults.length}
                      title="Kết quả tìm kiếm"
                    />
                    {searchResults.map((dish) => (
                      <DishCard
                        categoryName={getCategoryName(
                          categories,
                          dish.categoryId,
                        )}
                        dish={dish}
                        key={dish.id}
                        onOpenDetail={setSelectedDish}
                        onUpdateQuantity={updateQuantity}
                        quantity={getQuantity(dish.id)}
                      />
                    ))}
                  </section>
                )
              ) : (
                <section className="space-y-6">
                  {categorySections.length === 0 ? (
                    <EmptyMenuState
                      description="Menu hiện chưa có danh mục hoặc món ăn."
                      title="Chưa có món trong menu"
                    />
                  ) : (
                    categorySections.map((section) => (
                      <section
                        className="scroll-mt-40 space-y-3"
                        key={section.id}
                        ref={(element) => {
                          sectionRefs.current[section.id] = element;
                        }}
                      >
                        <SectionTitle
                          count={section.dishes.length}
                          title={section.name}
                        />
                        {section.dishes.length === 0 ? (
                          <div className="border-y border-dashed border-gray-200 py-4 text-sm text-muted-foreground dark:border-slate-800">
                            Danh mục này chưa có món.
                          </div>
                        ) : (
                          section.dishes.map((dish) => (
                            <DishCard
                              categoryName={section.name}
                              dish={dish}
                              key={dish.id}
                              onOpenDetail={setSelectedDish}
                              onUpdateQuantity={updateQuantity}
                              quantity={getQuantity(dish.id)}
                            />
                          ))
                        )}
                      </section>
                    ))
                  )}
                </section>
              )}
            </>
          ) : (
            <section className="space-y-3">
              <Button
                onClick={() => setActiveTab("menu")}
                size="sm"
                type="button"
                variant="outline"
              >
                <ChevronLeft />
                Quay lại Menu
              </Button>
              <CustomerOrdersSectionView
                dishes={dishes}
                error={ordersError}
                isLoading={isLoadingOrders}
                onRefresh={() => void loadCustomerOrders(customerSession)}
                orders={customerOrders}
              />
            </section>
          )}
        </main>

        <CartStickyBar
          onOpenCart={() => setIsCartOpen(true)}
          previewTotal={previewTotal}
          totalItems={totalItems}
        />

        {isCartOpen ? (
          <CustomerCartSheet
            cartLines={cartWithDishes}
            isSubmitting={isSubmitting}
            onClose={() => setIsCartOpen(false)}
            onSubmit={handleSubmit}
            onUpdateItemNote={updateItemNote}
            onUpdateQuantity={updateQuantity}
            orderNote={orderNote}
            previewTotal={previewTotal}
            setOrderNote={setOrderNote}
            submitError={submitError}
            totalItems={totalItems}
          />
        ) : null}

        <DishDetailSheet
          categoryName={
            selectedDish
              ? getCategoryName(categories, selectedDish.categoryId)
              : ""
          }
          dish={selectedDish}
          initialNote={
            selectedDish
              ? cart.find((item) => item.dishId === selectedDish.id)?.note
              : undefined
          }
          initialQuantity={selectedDish ? getQuantity(selectedDish.id) : 0}
          key={selectedDish?.id ?? "empty-dish-detail"}
          onClose={() => setSelectedDish(null)}
          onSave={saveDishDetail}
        />
      </div>
    </div>
  );
}

type CustomerSampleHeaderProps = {
  customerName: string;
  orderCount: number;
  tableName: string;
  onSwitchGuest: () => void;
  onViewOrders: () => void;
};

function CustomerSampleHeader({
  customerName,
  orderCount,
  tableName,
  onSwitchGuest,
  onViewOrders,
}: CustomerSampleHeaderProps) {
  return (
    <header className="px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-gray-800 dark:text-slate-100">
                QR Food
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Bàn số:{" "}
                <span className="font-semibold text-orange-600 dark:text-orange-300">
                  {tableName || "Bàn của bạn"}
                </span>
              </p>
            </div>
          </div>
          <div className="hidden">
            <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25">
              <Store className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                QR Food
              </p>
              <h1 className="truncate text-lg font-semibold text-foreground">
                {tableName || "Bàn của bạn"}
              </h1>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Đang phục vụ tại bàn
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-transparent px-2.5 py-1 text-xs text-muted-foreground dark:border-slate-700">
              <UserRound className="size-3" />
              {customerName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {orderCount > 0 ? (
            <button
              className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1.5 text-xs sm:text-sm font-medium text-orange-600 dark:bg-orange-500/15 dark:text-orange-300 animate-pulse"
              onClick={onViewOrders}
              type="button"
            >
              <ReceiptText className="size-3.5 sm:size-4" />
              Đơn của bạn
            </button>
          ) : null}
          <ThemeToggle />
          <Button onClick={onSwitchGuest} size="sm" type="button" variant="ghost" className="h-9 px-2.5 sm:px-3 text-xs sm:text-sm">
            Đổi khách
          </Button>
        </div>
      </div>
    </header>
  );
}

type CustomerTabsProps = {
  activeTab: ActiveTab;
  orderCount: number;
  onChange: (tab: ActiveTab) => void;
};

// Kept temporarily for future compact tab UX, but not rendered in the current customer layout.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CustomerTabs({ activeTab, orderCount, onChange }: CustomerTabsProps) {
  return (
    <div className="grid grid-cols-2 rounded-full border border-gray-200 bg-transparent p-1 dark:border-slate-800">
      <button
        className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
          activeTab === "menu"
            ? "bg-orange-500 text-white shadow-md"
            : "text-gray-600 hover:bg-gray-200 dark:text-slate-400 dark:hover:bg-slate-800"
        }`}
        onClick={() => onChange("menu")}
        type="button"
      >
        Menu
      </button>
      <button
        className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
          activeTab === "orders"
            ? "bg-orange-500 text-white shadow-md"
            : "text-gray-600 hover:bg-gray-200 dark:text-slate-400 dark:hover:bg-slate-800"
        }`}
        onClick={() => onChange("orders")}
        type="button"
      >
        Đơn của bạn {orderCount > 0 ? `(${orderCount})` : ""}
      </button>
    </div>
  );
}

type SearchBoxProps = {
  searchQuery: string;
  onChange: (value: string) => void;
};

function SearchBox({ searchQuery, onChange }: SearchBoxProps) {
  return (
    <div className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        className="h-11 w-full rounded-full border border-gray-200 bg-transparent pl-9 pr-10 text-sm text-gray-800 outline-none placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tìm món ăn..."
        value={searchQuery}
      />
      {searchQuery ? (
        <button
          className="absolute right-3 top-1/2 size-6 -translate-y-1/2 flex items-center justify-center rounded-full text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          onClick={() => onChange("")}
          type="button"
          aria-label="Xóa tìm kiếm"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

type CategoryPillsProps = {
  categories: Category[];
  categoryCounts: Record<string, number>;
  totalCount: number;
  selectedCategoryId: string;
  onRegisterPill: (
    categoryId: string,
    element: HTMLButtonElement | null,
  ) => void;
  onSelect: (categoryId: string) => void;
};

function CategoryPills({
  categories,
  categoryCounts,
  totalCount,
  onRegisterPill,
  selectedCategoryId,
  onSelect,
}: CategoryPillsProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 no-scrollbar">
      <div className="flex w-max gap-2 pb-1">
        <CategoryPill
          count={totalCount}
          isActive={selectedCategoryId === ALL_CATEGORIES}
          label="Tất cả"
          onClick={() => onSelect(ALL_CATEGORIES)}
          refCallback={(element) => onRegisterPill(ALL_CATEGORIES, element)}
        />
        {categories.map((category) => (
          <CategoryPill
            count={categoryCounts[category.id] ?? 0}
            isActive={selectedCategoryId === category.id}
            key={category.id}
            label={category.name}
            onClick={() => onSelect(category.id)}
            refCallback={(element) => onRegisterPill(category.id, element)}
          />
        ))}
      </div>
    </div>
  );
}

type CategoryPillProps = {
  count: number;
  isActive: boolean;
  label: string;
  onClick: () => void;
  refCallback: (element: HTMLButtonElement | null) => void;
};

function CategoryPill({
  count,
  isActive,
  label,
  onClick,
  refCallback,
}: CategoryPillProps) {
  return (
    <button
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition ${
        isActive
          ? "border-orange-500 bg-orange-500 text-white shadow-md"
          : "border-gray-200 bg-transparent text-gray-600 dark:border-slate-800 dark:text-slate-400"
      }`}
      onClick={onClick}
      ref={refCallback}
      type="button"
    >
      {label}
      <span className="text-xs opacity-80">{count}</span>
    </button>
  );
}

function NoticeCard() {
  return (
    <section className="border-l-4 border-orange-500 py-2 pl-3">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-300">
          <Clock3 className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            Gọi món trực tiếp tại bàn
          </p>
          <p className="text-xs text-muted-foreground">
            Giá chỉ là tạm tính. Nhà hàng sẽ xác nhận đơn sau khi gửi.
          </p>
        </div>
      </div>
    </section>
  );
}

function SuccessNotice({
  activeTab,
  onToggleTab,
}: {
  activeTab: ActiveTab;
  onToggleTab: (tab: ActiveTab) => void;
}) {
  return (
    <section className="border-l-4 border-emerald-500 py-3 pl-3">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
          <CheckCircle2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-foreground">
            Đã gửi đơn thành công
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhân viên đang xác nhận. Bạn có thể theo dõi trạng thái trong mục
            đơn của mình.
          </p>
          <Button
            className="mt-3"
            onClick={() => onToggleTab(activeTab === "menu" ? "orders" : "menu")}
            size="sm"
            type="button"
            variant="outline"
          >
            {activeTab === "menu" ? "Xem đơn của bạn" : "Quay lại Menu"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ count, title }: { count: number; title: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate border-l-4 border-orange-500 pl-2 text-lg font-bold text-foreground">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground">{count} món</p>
      </div>
    </div>
  );
}

function EmptyMenuState({
  description = "Thử đổi từ khóa tìm kiếm hoặc xem lại menu.",
  title = "Không có món phù hợp",
}: {
  description?: string;
  title?: string;
}) {
  return (
    <section className="border-y border-dashed border-gray-200 py-8 text-center dark:border-slate-800">
      <ClipboardList className="mx-auto size-8 text-muted-foreground" />
      <span className="sr-only">
        {title} {description}
      </span>
      <h2 className="mt-3 text-lg font-semibold text-foreground">
        Không có món phù hợp
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
      </p>
    </section>
  );
}

type DishCardProps = {
  categoryName: string;
  dish: Dish;
  quantity: number;
  onOpenDetail: (dish: Dish) => void;
  onUpdateQuantity: (dishId: string, quantity: number) => void;
};

function DishCard({
  categoryName,
  dish,
  onOpenDetail,
  quantity,
  onUpdateQuantity,
}: DishCardProps) {
  const isAvailable = dish.available;

  return (
    <article
      className={`border-b border-gray-200 py-3 transition-transform active:scale-[0.99] dark:border-slate-800 ${
        isAvailable ? "" : "opacity-60"
      }`}
      onClick={() => onOpenDetail(dish)}
    >
      <div className="grid grid-cols-[5.5rem_1fr] gap-3">
        <DishThumb dish={dish} />

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{categoryName}</p>
              <h3 className="mt-0.5 line-clamp-2 font-semibold text-foreground">
                {dish.name}
              </h3>
            </div>
            {!isAvailable ? (
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[0.7rem] font-medium text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                Hết hàng
              </span>
            ) : null}
          </div>

          {dish.description ? (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {dish.description}
            </p>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="font-bold text-primary">
              {formatCurrency(dish.price)}
            </p>
            {quantity > 0 ? (
              <div className="flex items-center rounded-full border border-gray-200 bg-transparent text-gray-700 dark:border-slate-700 dark:text-slate-300">
                <Button
                  disabled={!isAvailable}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateQuantity(dish.id, quantity - 1);
                  }}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Minus />
                </Button>
                <span className="w-7 text-center text-sm font-semibold text-foreground">
                  {quantity}
                </span>
                <Button
                  disabled={!isAvailable}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateQuantity(dish.id, quantity + 1);
                  }}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Plus />
                </Button>
              </div>
            ) : (
              <Button
                disabled={!isAvailable}
                onClick={(event) => {
                  event.stopPropagation();
                  onUpdateQuantity(dish.id, 1);
                }}
                className="rounded-full bg-orange-500 text-white shadow-sm hover:bg-orange-600"
                size="icon"
                type="button"
              >
                <Plus />
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function DishThumb({ dish }: { dish: Dish }) {
  if (dish.imageUrl) {
    return (
      <div
        aria-label={dish.name}
        className="aspect-square rounded-lg bg-gray-200 bg-cover bg-center dark:bg-slate-800"
        role="img"
        style={{ backgroundImage: `url("${dish.imageUrl}")` }}
      />
    );
  }

  return (
    <div className="grid aspect-square place-items-center rounded-lg bg-gray-200 text-orange-600 dark:bg-slate-800 dark:text-orange-300">
      <Utensils className="size-7" />
    </div>
  );
}

type CartStickyBarProps = {
  previewTotal: number;
  totalItems: number;
  onOpenCart: () => void;
};

function CartStickyBar({
  previewTotal,
  totalItems,
  onOpenCart,
}: CartStickyBarProps) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-[520px] px-4">
      <Button
        className="h-14 w-full justify-between rounded-2xl bg-gray-800 px-4 text-white shadow-xl hover:bg-gray-900 dark:bg-slate-900 dark:text-slate-100 dark:ring-1 dark:ring-slate-700 dark:hover:bg-slate-800"
        onClick={onOpenCart}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          <span className="relative">
            <ShoppingBag />
            <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-primary text-[0.7rem] font-bold text-primary-foreground">
              {totalItems}
            </span>
          </span>
          Giỏ hàng · {totalItems} món
        </span>
        <span className="rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white">
          {formatCurrency(previewTotal)}
        </span>
      </Button>
    </div>
  );
}

type CustomerCartSheetProps = {
  cartLines: CartLineWithDish[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onUpdateItemNote: (dishId: string, note: string) => void;
  onUpdateQuantity: (dishId: string, quantity: number) => void;
  orderNote: string;
  previewTotal: number;
  setOrderNote: (note: string) => void;
  submitError: string | null;
  totalItems: number;
};

function CustomerCartSheet({
  cartLines,
  isSubmitting,
  onClose,
  onSubmit,
  onUpdateItemNote,
  onUpdateQuantity,
  orderNote,
  previewTotal,
  setOrderNote,
  submitError,
  totalItems,
}: CustomerCartSheetProps) {
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[520px] flex-col bg-gray-50 dark:bg-slate-950">
      <div className="flex min-h-0 flex-1 flex-col bg-transparent">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-gray-50/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Giỏ hàng</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalItems} món đang chọn
            </p>
          </div>
          <Button
            aria-label="Đóng giỏ hàng"
            onClick={onClose}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronLeft />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-32">
          <div className="space-y-4">
            {cartLines.map((item) => (
              <article
                className="border-b border-gray-200 py-4 dark:border-slate-800"
                key={item.dishId}
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 shrink-0">
                    <DishThumb dish={item.dish} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground">
                      {item.dish.name}
                    </h3>
                    <p className="text-sm font-semibold text-primary">
                      {formatCurrency(item.dish.price)}
                    </p>
                  </div>
                  <Button
                    onClick={() => onUpdateQuantity(item.dishId, 0)}
                    size="icon-sm"
                    type="button"
                    variant="outline"
                  >
                    <Trash2 />
                  </Button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 pl-[4.75rem]">
                  <div className="flex items-center rounded-lg border border-gray-200 bg-transparent text-gray-700 dark:border-slate-700 dark:text-slate-300">
                    <Button
                      onClick={() =>
                        onUpdateQuantity(item.dishId, item.quantity - 1)
                      }
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold text-foreground">
                      {item.quantity}
                    </span>
                    <Button
                      onClick={() =>
                        onUpdateQuantity(item.dishId, item.quantity + 1)
                      }
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <Plus />
                    </Button>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(item.dish.price * item.quantity)}
                  </p>
                </div>

                <textarea
                  className="mt-3 min-h-16 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-800"
                  onChange={(event) =>
                    onUpdateItemNote(item.dishId, event.target.value)
                  }
                  placeholder="Ghi chú cho món này"
                  value={item.note ?? ""}
                />
              </article>
            ))}
          </div>

          <label className="mt-4 block text-sm font-medium text-foreground">
            Ghi chú đơn hàng
          </label>
          <textarea
            className="mt-2 min-h-20 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-800"
            onChange={(event) => setOrderNote(event.target.value)}
            placeholder="Ví dụ: ít cay, phục vụ sau 10 phút..."
            value={orderNote}
          />

          {submitError ? (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-background p-3 text-sm text-muted-foreground">
              {submitError}
            </div>
          ) : null}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[520px] border-t border-gray-200 bg-gray-50/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Tạm tính</span>
            <span className="text-xl font-semibold text-foreground">
              {formatCurrency(previewTotal)}
            </span>
          </div>
          <Button
            className="mt-4 h-12 w-full rounded-xl bg-orange-500 text-base font-bold text-white shadow-lg hover:bg-orange-600"
            disabled={cartLines.length === 0 || isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Đang gửi đơn
              </>
            ) : (
              "Gửi đơn"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

type CustomerOrdersSectionProps = {
  dishes: Dish[];
  error: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  orders: OrderResponse[];
};

// TODO: remove after the customer orders UI is fully split out.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CustomerOrdersSection({
  dishes,
  error,
  isLoading,
  onRefresh,
  orders,
}: CustomerOrdersSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-border bg-muted p-2">
            <ReceiptText className="size-5 text-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Đơn của bạn</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Chỉ hiển thị đơn thuộc phiên check-in hiện tại.
            </p>
          </div>
        </div>
        <Button
          disabled={isLoading}
          onClick={onRefresh}
          size="sm"
          type="button"
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <RefreshCw />
          )}
          Làm mới
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-background p-3 text-sm text-muted-foreground">
          {error}
        </div>
      ) : null}

      {isLoading && orders.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải đơn của bạn...
        </div>
      ) : null}

      {!isLoading && orders.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-5 text-center">
          <ReceiptText className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Bạn chưa có đơn nào trong phiên này.
          </p>
        </div>
      ) : null}

      {orders.length > 0 ? (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <article
              className="rounded-lg border border-border bg-background p-4"
              key={order.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </p>
                  <h3 className="mt-1 break-all text-sm font-semibold text-foreground">
                    Đơn #{order.id}
                  </h3>
                </div>
                <span className="w-fit rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {order.items.map((item, index) => (
                  <div
                    className="grid grid-cols-[1fr_auto] gap-3 text-sm"
                    key={`${order.id}-${item.dishId}-${index}`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {getDishName(dishes, item.dishId)}
                      </p>
                      {item.note ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Ghi chú: {item.note}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        x{item.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.pricePerUnit)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {order.note ? (
                <div className="mt-3 rounded-md border border-border bg-card p-3 text-sm">
                  <p className="text-muted-foreground">Ghi chú đơn</p>
                  <p className="mt-1 text-foreground">{order.note}</p>
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">
                  Tổng tiền
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(order.finalPrice)}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
