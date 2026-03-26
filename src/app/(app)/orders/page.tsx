import {
  deleteOrderAction,
  updateOrderAction,
} from "@/app/(app)/orders/actions";
import Link from "next/link";
import { NewOrderModal } from "@/components/app/new-order-modal";
import {
  fulfillmentOptions,
  getOrdersPageData,
  orderStatusOptions,
  paymentStatusOptions,
} from "@/server/orders";

const defaultPickupTime = new Date(Date.now() + 1000 * 60 * 60 * 24)
  .toISOString()
  .slice(0, 16);

const statusToneClasses = {
  CONFIRMED: "bg-[#f8eadf] text-[#91563a]",
  IN_PRODUCTION: "bg-[#f2d5c6] text-[#7a3e2a]",
  READY: "bg-[#dce8da] text-[#335a36]",
  DELIVERED: "bg-[#ede7e1] text-[#5d524d]",
  DRAFT: "bg-[#efe7df] text-[#6f5b54]",
  CANCELLED: "bg-[#f0d8d6] text-[#8a312a]",
} as const;

const paymentToneClasses = {
  PAID: "bg-[#dfeadf] text-[#2f5a35]",
  PARTIALLY_PAID: "bg-[#f8e0d0] text-[#8c492d]",
  UNPAID: "bg-[#f1d1ce] text-[#8a312a]",
} as const;

const metricIcons = [
  <svg key="orders" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>,
  <svg key="active" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>,
  <svg key="paid" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>,
  <svg key="drafts" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="17 3 21 3 21 7" />
    <line x1="9" y1="14" x2="15" y2="8" />
  </svg>,
] as const;

const metricIconByLabel = {
  Orders: metricIcons[0],
  Active: metricIcons[1],
  "Paid in full": metricIcons[2],
  Drafts: metricIcons[3],
} as const;

const formatOptionLabel = (value: string) =>
  value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const compactFieldClass =
  "w-full min-w-0 rounded-[0.9rem] border border-[color:var(--line)] bg-[color:var(--field-bg)] px-3 py-2.5 text-sm text-[color:var(--foreground)] outline-none transition-[border-color,box-shadow,background] focus:border-[rgba(110,52,35,0.24)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(241,200,176,0.22)]";

const metricFilters = ["all", "active", "paid", "drafts"] as const;
type MetricFilter = (typeof metricFilters)[number];

const filterMeta: Record<
  MetricFilter,
  {
    label: string;
    description: string;
  }
> = {
  all: {
    label: "All orders",
    description: "Showing every order in the board.",
  },
  active: {
    label: "Active orders",
    description: "Showing confirmed, in production, and ready orders.",
  },
  paid: {
    label: "Paid in full",
    description: "Showing fully settled orders.",
  },
  drafts: {
    label: "Draft orders",
    description: "Showing unconfirmed draft orders.",
  },
};

const buildFilterHref = (params: {
  filter?: string;
  q?: string;
  status?: string;
  payment?: string;
  fulfillment?: string;
  due?: string;
}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "ALL") {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `/orders?${queryString}` : "/orders";
};

type OrdersPageProps = {
  searchParams?: Promise<{
    filter?: string;
    q?: string;
    status?: string;
    payment?: string;
    fulfillment?: string;
    due?: string;
  }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { metrics, orders, products } = await getOrdersPageData();
  const metricMap = new Map(metrics.map((metric) => [metric.label, metric]));
  const orderedMetrics = [
    {
      ...(metricMap.get("Active") ?? { label: "Active", value: "0", note: "In progress" }),
      tone: "active" as const,
    },
    {
      ...(metricMap.get("Paid in full") ?? {
        label: "Paid in full",
        value: "0",
        note: "Settled",
      }),
      tone: "paid" as const,
    },
    {
      ...(metricMap.get("Orders") ?? { label: "Orders", value: "0", note: "Total" }),
      tone: "default" as const,
    },
    {
      ...(metricMap.get("Drafts") ?? { label: "Drafts", value: "0", note: "Unconfirmed" }),
      tone: "muted" as const,
    },
  ];
  const resolvedSearchParams = (await searchParams) ?? {};
  const activeFilter = metricFilters.includes(
    resolvedSearchParams.filter as MetricFilter,
  )
    ? (resolvedSearchParams.filter as MetricFilter)
    : "all";
  const query = resolvedSearchParams.q?.trim().toLowerCase() ?? "";
  const selectedStatus = resolvedSearchParams.status?.trim() ?? "ALL";
  const selectedPayment = resolvedSearchParams.payment?.trim() ?? "ALL";
  const selectedFulfillment = resolvedSearchParams.fulfillment?.trim() ?? "ALL";
  const dueFilter = resolvedSearchParams.due?.trim() ?? "ALL";
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const filteredOrders = orders.filter((order) => {
    const matchesMetricFilter =
      activeFilter === "all"
        ? true
        : activeFilter === "active"
          ? ["CONFIRMED", "IN_PRODUCTION", "READY"].includes(order.status)
          : activeFilter === "paid"
            ? order.paymentStatus === "PAID"
            : order.status === "DRAFT";

    if (!matchesMetricFilter) {
      return false;
    }

    const matchesQuery =
      query.length === 0
        ? true
        : [
            order.orderNumber,
            order.customerName,
            order.customerPhone,
            order.itemSummary,
            order.total,
          ].some((value) => value.toLowerCase().includes(query));

    if (!matchesQuery) {
      return false;
    }

    if (selectedStatus !== "ALL" && order.status !== selectedStatus) {
      return false;
    }

    if (selectedPayment !== "ALL" && order.paymentStatus !== selectedPayment) {
      return false;
    }

    if (selectedFulfillment !== "ALL" && order.fulfillmentType !== selectedFulfillment) {
      return false;
    }

    if (dueFilter === "ALL") {
      return true;
    }

    if (!order.pickupAtValue) {
      return dueFilter === "UNSCHEDULED";
    }

    const pickupDate = new Date(order.pickupAtValue);

    if (dueFilter === "TODAY") {
      return pickupDate >= todayStart && pickupDate < todayEnd;
    }

    if (dueFilter === "UPCOMING") {
      return pickupDate >= todayEnd;
    }

    if (dueFilter === "OVERDUE") {
      return pickupDate < todayStart;
    }

    return true;
  });

  const quickFilters = [
    {
      label: "Today",
      href: buildFilterHref({
        filter: activeFilter === "all" ? undefined : activeFilter,
        q: resolvedSearchParams.q ?? "",
        status: resolvedSearchParams.status ?? "ALL",
        payment: resolvedSearchParams.payment ?? "ALL",
        fulfillment: resolvedSearchParams.fulfillment ?? "ALL",
        due: "TODAY",
      }),
      active: dueFilter === "TODAY",
    },
    {
      label: "Pending",
      href: buildFilterHref({
        filter: activeFilter === "all" ? undefined : activeFilter,
        q: resolvedSearchParams.q ?? "",
        status: resolvedSearchParams.status ?? "ALL",
        payment: "UNPAID",
        fulfillment: resolvedSearchParams.fulfillment ?? "ALL",
        due: resolvedSearchParams.due ?? "ALL",
      }),
      active: selectedPayment === "UNPAID",
    },
    {
      label: "Paid",
      href: buildFilterHref({
        filter: activeFilter === "all" ? undefined : activeFilter,
        q: resolvedSearchParams.q ?? "",
        status: resolvedSearchParams.status ?? "ALL",
        payment: "PAID",
        fulfillment: resolvedSearchParams.fulfillment ?? "ALL",
        due: resolvedSearchParams.due ?? "ALL",
      }),
      active: selectedPayment === "PAID",
    },
    {
      label: "Overdue",
      href: buildFilterHref({
        filter: activeFilter === "all" ? undefined : activeFilter,
        q: resolvedSearchParams.q ?? "",
        status: resolvedSearchParams.status ?? "ALL",
        payment: resolvedSearchParams.payment ?? "ALL",
        fulfillment: resolvedSearchParams.fulfillment ?? "ALL",
        due: "OVERDUE",
      }),
      active: dueFilter === "OVERDUE",
    },
  ];

  return (
    <main className="space-y-3">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {orderedMetrics.map((metric) => (
          <article
            key={metric.label}
            className={`rounded-[1.05rem] px-5 py-3 text-[color:var(--foreground)] transition-[transform,box-shadow,border-color,background] hover:-translate-y-[1px] ${
              metric.tone === "active"
                ? "border border-[#c7ddcb] border-l-[4px] border-l-[#74a37f] bg-[var(--surface-priority-green)] shadow-[0_14px_28px_rgba(53,87,70,0.11)]"
                : metric.tone === "paid"
                  ? "border border-[#d7dfeb] bg-[var(--surface-priority-blue)] shadow-[0_12px_24px_rgba(71,93,122,0.08)]"
                  : metric.tone === "muted"
                    ? "surface-card border-[color:var(--line)]"
                    : "surface-card-strong border-[color:var(--line)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-[0.7rem] ${
                  metric.tone === "active"
                    ? "bg-[#e7f2e8] text-[#3e6a45]"
                    : metric.tone === "paid"
                      ? "bg-[#eef3fb] text-[#536b8a]"
                      : "bg-[#fff1e7] text-[color:var(--accent-deep)]"
                }`}
              >
                {metricIconByLabel[metric.label as keyof typeof metricIconByLabel]}
              </div>
              <div>
                <p
                  className={`text-[0.9rem] font-medium leading-tight ${
                    metric.tone === "active"
                      ? "text-[#47654d]"
                      : metric.tone === "paid"
                        ? "text-[#5b6878]"
                        : "text-[color:var(--muted)]"
                  }`}
                >
                  {metric.label}
                </p>
                <p
                  className={`text-[0.68rem] uppercase tracking-[0.18em] ${
                    metric.tone === "active"
                      ? "text-[#62806a]"
                      : metric.tone === "paid"
                        ? "text-[#71829a]"
                        : "text-[color:var(--accent-deep)]"
                  }`}
                >
                  {metric.note}
                </p>
              </div>
            </div>
            <p
              className={`mt-3 text-[1.5rem] font-bold leading-tight tracking-tight ${
                metric.tone === "active"
                  ? "text-[#23472a]"
                  : metric.tone === "paid"
                    ? "text-[#41546c]"
                    : "text-[color:var(--foreground)]"
              }`}
            >
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {metricFilters.map((filterKey) => (
          <Link
            key={filterKey}
            href={filterKey === "all" ? "/orders" : `/orders?filter=${filterKey}`}
            className={`interactive-chip inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold ${
              activeFilter === filterKey
                ? "border-[color:var(--accent-soft)] bg-[#f3dfd1] text-[color:var(--accent-deep)]"
                : "border-[color:var(--line)] bg-white/78 text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--foreground)]"
            }`}
          >
            {filterMeta[filterKey].label}
          </Link>
        ))}
      </section>

      <section className="surface-panel rounded-[1.05rem] px-4 py-4 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {quickFilters.map((quickFilter) => (
            <Link
              key={quickFilter.label}
              href={quickFilter.href}
              className={`interactive-chip inline-flex items-center justify-center rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                quickFilter.active
                  ? "border-[rgba(53,87,70,0.16)] bg-[#dfeadf] text-[#2f5a35]"
                  : "border-[color:var(--line)] bg-white/76 text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--foreground)]"
              }`}
            >
              {quickFilter.label}
            </Link>
          ))}
        </div>

        <form className="grid gap-3 lg:grid-cols-[minmax(15rem,2fr)_repeat(4,minmax(8rem,0.9fr))_minmax(4.5rem,auto)] lg:items-end">
          <label className="min-w-0 space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Search
            </span>
            <input
              type="text"
              name="q"
              defaultValue={resolvedSearchParams.q ?? ""}
              placeholder="Search order, customer, phone"
              className={`${compactFieldClass} px-3 py-2.5 text-[0.9rem]`}
            />
          </label>

          <label className="min-w-0 space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Status
            </span>
            <select
              name="status"
              defaultValue={selectedStatus}
              className={`${compactFieldClass} px-3 py-2.5 pr-8 text-[0.9rem]`}
            >
              <option value="ALL">All statuses</option>
              {orderStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatOptionLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-0 space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Payment
            </span>
            <select
              name="payment"
              defaultValue={selectedPayment}
              className={`${compactFieldClass} px-3 py-2.5 pr-8 text-[0.9rem]`}
            >
              <option value="ALL">All payments</option>
              {paymentStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatOptionLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-0 space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Fulfillment
            </span>
            <select
              name="fulfillment"
              defaultValue={selectedFulfillment}
              className={`${compactFieldClass} px-3 py-2.5 pr-8 text-[0.9rem]`}
            >
              <option value="ALL">All types</option>
              {fulfillmentOptions.map((type) => (
                <option key={type} value={type}>
                  {formatOptionLabel(type)}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-0 space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Due
            </span>
            <select
              name="due"
              defaultValue={dueFilter}
              className={`${compactFieldClass} px-3 py-2.5 pr-8 text-[0.9rem]`}
            >
              <option value="ALL">Any time</option>
              <option value="TODAY">Due today</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="OVERDUE">Overdue</option>
              <option value="UNSCHEDULED">Unscheduled</option>
            </select>
          </label>

          <div className="flex flex-col gap-2 lg:justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-[0.9rem] border border-[color:var(--accent-soft)] bg-[#f3dfd1] px-2.5 py-2 text-sm font-semibold text-[color:var(--accent-deep)] transition-colors hover:bg-[#eed7c7]"
            >
              Apply
            </button>
            <Link
              href={activeFilter === "all" ? "/orders" : `/orders?filter=${activeFilter}`}
              className="inline-flex items-center justify-center rounded-[0.9rem] border border-[color:var(--line)] bg-white/75 px-2.5 py-2 text-sm font-semibold text-[color:var(--muted)] transition-colors hover:bg-white hover:text-[color:var(--foreground)]"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section className="surface-panel rounded-[1.2rem]">
          <div className="flex items-center justify-between gap-4 border-b border-[color:var(--line)] px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-[1.35rem] font-bold tracking-tight">Order Board</h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {filterMeta[activeFilter].description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NewOrderModal
                products={products}
                defaultPickupTime={defaultPickupTime}
                orderStatusOptions={orderStatusOptions}
                paymentStatusOptions={paymentStatusOptions}
                fulfillmentOptions={fulfillmentOptions}
              />
              {activeFilter !== "all" ? (
                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center rounded-[0.85rem] border border-[color:var(--line)] bg-white/75 px-3 py-1.5 text-xs font-semibold text-[color:var(--muted)] transition-colors hover:bg-white hover:text-[color:var(--foreground)]"
                >
                  Clear filter
                </Link>
              ) : null}
              <p className="text-sm font-medium text-[color:var(--muted)]">
                {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[0.36fr_0.92fr_1.02fr_0.42fr_0.82fr_0.92fr_0.92fr_0.62fr] gap-2 border-b border-[color:var(--line)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)] sm:px-6">
                <p>No.</p>
                <p>Order</p>
                <p>Customer</p>
                <p>Qty</p>
                <p>Due</p>
                <p>Payment</p>
                <p>Status</p>
                <p>Actions</p>
              </div>

              <div className="divide-y divide-[color:var(--line)]">
                {filteredOrders.map((order, index) => (
                  <form
              key={order.id}
              action={updateOrderAction}
              className="interactive-row grid grid-cols-[0.36fr_0.92fr_1.02fr_0.42fr_0.82fr_0.92fr_0.92fr_0.62fr] gap-2 px-5 py-4 hover:bg-[#fcf4ed] sm:px-6"
            >
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="customerName" value={order.customerName} />
                    <input type="hidden" name="customerPhone" value={order.customerPhone} />
                    <input type="hidden" name="productId" value={order.productId} />
                    <input type="hidden" name="fulfillmentType" value={order.fulfillmentType} />
                    <input type="hidden" name="notes" value={order.notes} />

                    <div className="flex items-start justify-center pt-1">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1e7] text-sm font-semibold text-[color:var(--accent-deep)]">
                        {index + 1}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[0.98rem] font-semibold tracking-tight">{order.orderNumber}</p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {order.itemSummary}
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {order.total}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[0.95rem] font-medium text-[color:var(--foreground)]">
                        {order.customerName}
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {order.customerPhone}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <input
                        name="quantity"
                        type="number"
                        min="1"
                        defaultValue={order.quantity}
                        className={`${compactFieldClass} px-2.5 py-2 text-center text-[0.92rem]`}
                      />
                    </div>

                    <div className="min-w-0">
                      <input
                        name="pickupAt"
                        type="datetime-local"
                        defaultValue={order.pickupAtValue || defaultPickupTime}
                        className={`${compactFieldClass} px-3 py-2 text-[0.9rem]`}
                      />
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {formatOptionLabel(order.fulfillmentType)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ${
                          paymentToneClasses[order.paymentStatus as keyof typeof paymentToneClasses]
                        }`}
                      >
                        {formatOptionLabel(order.paymentStatus)}
                      </span>
                      <select
                        name="paymentStatus"
                        defaultValue={order.paymentStatus}
                        className={`${compactFieldClass} mt-2 px-3 py-2 text-[0.9rem]`}
                      >
                        {paymentStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {formatOptionLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="min-w-0">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ${
                          statusToneClasses[order.status as keyof typeof statusToneClasses]
                        }`}
                      >
                        {formatOptionLabel(order.status)}
                      </span>
                      <select
                        name="status"
                        defaultValue={order.status}
                        className={`${compactFieldClass} mt-2 px-3 py-2 text-[0.9rem]`}
                      >
                        {orderStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {formatOptionLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 self-start">
                      <button
                        type="submit"
                        className="interactive-soft-button inline-flex min-h-7 items-center justify-center rounded-[0.8rem] bg-[color:var(--action-update-soft)] px-2 py-1.5 text-[0.7rem] font-semibold text-[color:var(--action-update-strong)] hover:bg-[#d2dee9]"
                      >
                        Update
                      </button>
                      <button
                        type="submit"
                        formAction={deleteOrderAction}
                        className="interactive-soft-button inline-flex min-h-7 items-center justify-center rounded-[0.8rem] bg-[color:var(--action-delete-soft)] px-2 py-1.5 text-[0.7rem] font-semibold text-[color:var(--action-delete-strong)] hover:bg-[#e4cfd3]"
                      >
                        Delete
                      </button>
                    </div>
                  </form>
                ))}
                {filteredOrders.length === 0 ? (
                  <div className="px-5 py-10 text-center sm:px-6">
                    <p className="text-sm font-medium text-[color:var(--foreground)]">
                      No orders match this filter.
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Try another card or clear the filter.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
      </section>
    </main>
  );
}
