import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderDetailPageData } from "@/server/orders";

type OrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const detailCardClass =
  "rounded-[1.15rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,#fffdfa,#fbf1e8)] p-5";

const metaRows = [
  { key: "customer", label: "Customer" },
  { key: "phone", label: "Phone" },
  { key: "status", label: "Status" },
  { key: "payment", label: "Payment" },
  { key: "fulfillment", label: "Fulfillment" },
  { key: "pickup", label: "Due" },
] as const;

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderDetailPageData(id);

  if (!order) {
    notFound();
  }

  const metaValues = {
    customer: order.customerName,
    phone: order.customerPhone,
    status: order.status,
    payment: order.paymentStatus,
    fulfillment: order.fulfillmentType,
    pickup: order.pickupAt,
  };

  return (
    <main className="space-y-5">
      <section className="flex flex-col gap-3 rounded-[1.2rem] border border-[color:var(--line)] bg-white/76 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.36em] text-[color:var(--accent-deep)]">
            Order Detail
          </p>
          <h2 className="mt-2 text-[1.65rem] font-semibold tracking-tight text-[color:var(--foreground)]">
            {order.orderNumber}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Created {order.createdAt}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-[0.95rem] border border-[color:var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:bg-white"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center rounded-[0.95rem] border border-[color:var(--accent-soft)] bg-[#f6e8dc] px-4 py-2 text-sm font-semibold text-[color:var(--accent-deep)] transition-colors hover:bg-[#f2dfd0]"
          >
            All Orders
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className={detailCardClass}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[1.1rem] font-semibold text-[color:var(--foreground)]">
              Item Summary
            </h3>
            <span className="rounded-full bg-[#f6e7db] px-3 py-1 text-xs font-semibold text-[color:var(--accent-deep)]">
              {order.items.length} item{order.items.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-[1rem] border border-[color:var(--line)] bg-white/72">
            <div className="grid grid-cols-[64px_1fr_96px_110px_110px] gap-3 border-b border-[color:var(--line)] px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <span>No.</span>
              <span>Item</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Total</span>
            </div>

            <div className="divide-y divide-[color:var(--line)]">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[64px_1fr_96px_110px_110px] gap-3 px-4 py-3 text-sm text-[color:var(--foreground)]"
                >
                  <span className="font-semibold text-[color:var(--muted)]">
                    {item.lineNumber}
                  </span>
                  <span className="font-medium">{item.productName}</span>
                  <span>{item.quantity}</span>
                  <span>{item.unitPrice}</span>
                  <span className="font-semibold">{item.lineTotal}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <div className="space-y-4">
          <article className={detailCardClass}>
            <h3 className="text-[1.1rem] font-semibold text-[color:var(--foreground)]">
              Order Info
            </h3>
            <div className="mt-4 space-y-3">
              {metaRows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-start justify-between gap-4 border-b border-[color:var(--line)] pb-3 last:border-b-0 last:pb-0"
                >
                  <span className="text-sm text-[color:var(--muted)]">{row.label}</span>
                  <span className="max-w-[14rem] text-right text-sm font-semibold text-[color:var(--foreground)]">
                    {metaValues[row.key]}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className={detailCardClass}>
            <h3 className="text-[1.1rem] font-semibold text-[color:var(--foreground)]">
              Payment Summary
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[0.95rem] border border-[color:var(--line)] bg-white/76 px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[color:var(--muted)]">
                  Total
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                  {order.total}
                </p>
              </div>
              <div className="rounded-[0.95rem] border border-[color:var(--line)] bg-white/76 px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[color:var(--muted)]">
                  Deposit
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                  {order.depositPaid}
                </p>
              </div>
              <div className="rounded-[0.95rem] border border-[color:var(--line)] bg-white/76 px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[color:var(--muted)]">
                  Balance
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                  {order.balanceDue}
                </p>
              </div>
            </div>
          </article>

          <article className={detailCardClass}>
            <h3 className="text-[1.1rem] font-semibold text-[color:var(--foreground)]">
              Notes
            </h3>
            <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
              {order.notes}
            </p>
            <p className="mt-4 text-xs text-[color:var(--muted)]">
              Last updated {order.updatedAt}
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
