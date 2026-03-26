import Link from "next/link";
import { getDashboardData } from "@/server/dashboard";

const statusClasses = {
  CONFIRMED: "bg-[#f8eadf] text-[#91563a]",
  IN_PRODUCTION: "bg-[#f2d5c6] text-[#7a3e2a]",
  READY: "bg-[#dce8da] text-[#335a36]",
  DELIVERED: "bg-[#ede7e1] text-[#5d524d]",
  DRAFT: "bg-[#efe7df] text-[#6f5b54]",
  CANCELLED: "bg-[#f0d8d6] text-[#8a312a]",
} as const;

const formatOrderStatus = (status: keyof typeof statusClasses) =>
  status.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const metricIcons = [
  /* Today's Orders */
  <svg key="ord" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>,
  /* Total Revenue */
  <svg key="rev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>,
  /* Products */
  <svg key="prod" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>,
  /* Total Orders */
  <svg key="total" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
] as const;

export default async function DashboardPage() {
  const { metrics, recentOrders } = await getDashboardData();
  const dashboardStats = [
    {
      label: metrics[3]?.label ?? "Pending orders",
      value: metrics[3]?.value ?? "0",
      note: metrics[3]?.note ?? "Open",
      icon: metricIcons[0],
      tone: "priority" as const,
    },
    {
      label: metrics[2]?.label ?? "Revenue today",
      value: metrics[2]?.value ?? "ETB 0",
      note: metrics[2]?.note ?? "Today",
      icon: metricIcons[1],
      tone: "accent" as const,
    },
    {
      label: metrics[0]?.label ?? "Sold today",
      value: metrics[0]?.value ?? "0",
      note: metrics[0]?.note ?? "Completed items",
      icon: metricIcons[2],
      tone: "default" as const,
    },
    {
      label: metrics[1]?.label ?? "Stock left",
      value: metrics[1]?.value ?? "0",
      note: metrics[1]?.note ?? "Available",
      icon: metricIcons[3],
      tone: "muted" as const,
    },
  ] as const;

  return (
    <main className="space-y-3">
      {/* ── Stat Cards ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((metric) => (
          <article
            key={metric.label}
            className={`flex min-h-[8.2rem] flex-col justify-between rounded-[1.05rem] px-5 py-3 text-[color:var(--foreground)] transition-[transform,box-shadow,border-color,background] hover:-translate-y-[1px] ${
              metric.tone === "priority"
                    ? "border border-[#c7ddcb] border-l-[4px] border-l-[#74a37f] bg-[var(--surface-priority-green)] shadow-[0_14px_28px_rgba(53,87,70,0.11)]"
                : metric.tone === "accent"
                  ? "border border-[#f0decf] bg-[var(--surface-priority-warm)] shadow-[0_12px_24px_rgba(145,102,67,0.08)]"
                  : metric.tone === "muted"
                    ? "surface-card border-[color:var(--line)]"
                    : "surface-card-strong border-[color:var(--line)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-[0.7rem] ${
                  metric.tone === "priority"
                    ? "bg-[#e7f2e8] text-[#3e6a45]"
                    : metric.tone === "accent"
                      ? "bg-[#fff1e7] text-[color:var(--gold-deep)]"
                      : "bg-[#fff1e7] text-[color:var(--accent-deep)]"
                }`}
              >
                {metric.icon}
              </div>
            </div>

            <div className="space-y-0.5">
              <p
                className={`text-[0.88rem] font-medium leading-tight ${
                  metric.tone === "priority"
                    ? "text-[#47654d]"
                    : "text-[color:var(--muted)]"
                }`}
              >
                {metric.label}
              </p>
              <p
                className={`text-[1.55rem] font-bold leading-tight tracking-tight ${
                  metric.tone === "accent"
                    ? "text-[color:var(--gold-deep)]"
                    : metric.tone === "priority"
                      ? "text-[#23472a]"
                    : "text-[color:var(--foreground)]"
                }`}
              >
                {metric.value}
              </p>
              <p
                className={`text-[0.68rem] font-semibold uppercase tracking-[0.2em] ${
                  metric.tone === "priority"
                    ? "text-[#62806a]"
                    : "text-[color:var(--accent-deep)]"
                }`}
              >
                {metric.note}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* ── Recent Orders ── */}
      <section className="surface-panel rounded-[1.2rem]">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--line)] px-5 py-4 sm:px-6">
          <h2 className="text-[1.45rem] font-bold tracking-tight">
            Recent Orders
          </h2>
          <Link
            href="/orders"
            className="flex items-center gap-1 text-sm font-semibold text-[color:var(--accent-deep)] transition-colors hover:text-[color:var(--accent)]"
          >
            View All
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        <div className="divide-y divide-[color:var(--line)]">
          {recentOrders.map((order) => (
            <div
              key={order.orderId}
              className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-[#fdf6f0] sm:px-6"
            >
              <Link
                href={`/orders/${order.orderId}`}
                className="min-w-0 flex-1"
              >
                <p className="text-[0.98rem] font-semibold text-[color:var(--foreground)]">
                  Order #{order.orderNumber}
                </p>
                <p className="mt-0.5 text-sm text-[color:var(--muted)]">
                  {order.customer} • {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                </p>
              </Link>

              <div className="flex shrink-0 items-center gap-3">
                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    {order.dueTime}
                  </p>
                  <p className="text-[0.98rem] font-semibold text-[color:var(--foreground)]">
                    {order.amount}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${
                      statusClasses[order.status]
                    }`}
                  >
                    {formatOrderStatus(order.status)}
                  </span>
                </div>

                <Link
                  href={`/orders/${order.orderId}`}
                  className="interactive-soft-button inline-flex items-center justify-center rounded-[0.85rem] border border-[color:var(--accent-soft)] bg-white/78 px-3 py-2 text-xs font-semibold text-[color:var(--accent-deep)] hover:bg-[#f6e8dc]"
                >
                  Show details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
