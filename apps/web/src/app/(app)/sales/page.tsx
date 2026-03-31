import Link from "next/link";
import { getSalesPageData } from "@/lib/backend/sales";

const metricIcons = [
  <svg key="revenue" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>,
  <svg key="units" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>,
  <svg key="avg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>,
  <svg key="paid" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
] as const;

const lightPanel =
  "surface-panel rounded-[1.2rem] text-[color:var(--foreground)]";

const lightMuted = "text-[color:var(--muted)]";
const lightAccent = "text-[color:var(--gold-deep)]";
const lightLine = "border-[color:var(--line)]";

const paymentTone: Record<string, string> = {
  Paid: "bg-[#dfeadf] text-[#2f5a35]",
  Partial: "bg-[#f8e0d0] text-[#8c492d]",
  Unpaid: "bg-[#f1d1ce] text-[#8a312a]",
};

type SalesPageProps = {
  searchParams?: Promise<{
    period?: string;
  }>;
};

const periods = ["ALL", "TODAY", "WEEK", "MONTH"] as const;
type SalesPeriod = (typeof periods)[number];

const periodMeta: Record<
  SalesPeriod,
  {
    label: string;
    description: string;
  }
> = {
  ALL: {
    label: "All sales",
    description: "Full recorded sales performance.",
  },
  TODAY: {
    label: "Today",
    description: "Today’s confirmed sales snapshot.",
  },
  WEEK: {
    label: "This week",
    description: "Last 7 days of confirmed sales.",
  },
  MONTH: {
    label: "This month",
    description: "Last 30 days of confirmed sales.",
  },
};

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const activePeriod = periods.includes(resolvedSearchParams.period as SalesPeriod)
    ? (resolvedSearchParams.period as SalesPeriod)
    : "ALL";
  const {
    period,
    metrics,
    dailySales,
    topProducts,
    categoryPerformance,
    paymentSummary,
  } = await getSalesPageData(activePeriod);

  return (
    <main className="space-y-3">
      <section className="flex flex-wrap items-center gap-2">
        {periods.map((periodKey) => (
          <Link
            key={periodKey}
            href={periodKey === "ALL" ? "/sales" : `/sales?period=${periodKey}`}
            className={`interactive-chip inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold ${
              activePeriod === periodKey
                ? "border-[rgba(53,87,70,0.16)] bg-[#dfeadf] text-[#2f5a35]"
                : "border-[color:var(--line)] bg-white/78 text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--foreground)]"
            }`}
          >
            {periodMeta[periodKey].label}
          </Link>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <article
            key={metric.label}
            className={`px-5 py-3 transition-[transform,box-shadow] hover:-translate-y-[1px] hover:shadow-[0_22px_40px_rgba(73,39,27,0.1)] ${
              index === 0
                ? "rounded-[1.2rem] border border-[rgba(53,87,70,0.12)] bg-[var(--surface-priority-green)] text-[color:var(--foreground)] shadow-[0_18px_36px_rgba(53,87,70,0.08)]"
                : "surface-card-strong rounded-[1.2rem]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[0.75rem] bg-[#fff1e7] text-[color:var(--accent-deep)]">
                {metricIcons[index]}
              </div>
              <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.2em] ${lightMuted}`}>
                {metric.note}
              </p>
            </div>
            <p className={`mt-4 text-[0.9rem] font-medium leading-tight ${lightMuted}`}>{metric.label}</p>
            <p className={`mt-0.5 text-[1.55rem] font-bold leading-tight tracking-tight ${index === 0 ? "text-[color:var(--action-add-strong)]" : "text-[color:var(--foreground)]"}`}>
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <article className={lightPanel}>
          <div className={`flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6 ${lightLine}`}>
            <div>
              <h2 className="text-[1.35rem] font-bold tracking-tight text-[color:var(--foreground)]">Sales by Day</h2>
              <p className={`mt-1 text-sm ${lightMuted}`}>
                {periodMeta[period].description}
              </p>
            </div>
            <p className={`text-sm font-medium ${lightMuted}`}>{dailySales.length} days</p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className={`grid grid-cols-[1fr_110px_110px_130px] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] sm:px-6 ${lightLine} ${lightMuted}`}>
                <p>Day</p>
                <p>Orders</p>
                <p>Units</p>
                <p>Revenue</p>
              </div>

              <div className={`divide-y ${lightLine}`}>
                {dailySales.map((day) => (
                  <div
                    key={day.label}
                    className="grid grid-cols-[1fr_110px_110px_130px] gap-3 px-5 py-3 transition-colors hover:bg-[#fff5ee] sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[color:var(--foreground)]">{day.label}</p>
                    </div>
                    <p className={`text-sm ${lightMuted}`}>{day.orders}</p>
                    <p className={`text-sm ${lightMuted}`}>{day.units}</p>
                    <p className={`text-sm font-semibold ${lightAccent}`}>{day.revenue}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className={lightPanel}>
          <div className={`border-b px-5 py-4 sm:px-6 ${lightLine}`}>
            <h2 className="text-[1.35rem] font-bold tracking-tight text-[color:var(--foreground)]">Payment Mix</h2>
            <p className={`mt-1 text-sm ${lightMuted}`}>
              Settlement overview across recorded sales.
            </p>
          </div>

          <div className="space-y-3 px-5 py-5 sm:px-6">
            {paymentSummary.map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-[0.95rem] border bg-[linear-gradient(180deg,#fffdf9,#fbf1e8)] px-4 py-3 ${lightLine}`}
              >
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paymentTone[item.label]}`}>
                  {item.label}
                </span>
                <span className="text-lg font-semibold text-[color:var(--foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className={lightPanel}>
          <div className={`flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6 ${lightLine}`}>
            <div>
              <h2 className="text-[1.35rem] font-bold tracking-tight text-[color:var(--foreground)]">Top Products</h2>
              <p className={`mt-1 text-sm ${lightMuted}`}>
                Best performers for the selected period.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className={`grid grid-cols-[1fr_150px_110px_110px] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] sm:px-6 ${lightLine} ${lightMuted}`}>
                <p>Product</p>
                <p>Category</p>
                <p>Units</p>
                <p>Revenue</p>
              </div>

              <div className={`divide-y ${lightLine}`}>
                {topProducts.map((product) => (
                  <div
                    key={product.id}
                    className="grid grid-cols-[1fr_150px_110px_110px] gap-3 px-5 py-3 transition-colors hover:bg-[#fff5ee] sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[color:var(--foreground)]">{product.name}</p>
                      <p className={`mt-1 text-xs ${lightMuted}`}>{product.stockLeft} left</p>
                    </div>
                    <p className={`text-sm ${lightMuted}`}>{product.category}</p>
                    <p className={`text-sm ${lightMuted}`}>{product.units}</p>
                    <p className={`text-sm font-semibold ${lightAccent}`}>{product.revenue}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className={lightPanel}>
          <div className={`flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6 ${lightLine}`}>
            <div>
              <h2 className="text-[1.35rem] font-bold tracking-tight text-[color:var(--foreground)]">Category Performance</h2>
              <p className={`mt-1 text-sm ${lightMuted}`}>
                Revenue and units by product line.
              </p>
            </div>
          </div>

          <div className={`divide-y ${lightLine}`}>
            {categoryPerformance.map((category) => (
              <div
                key={category.category}
                className="grid grid-cols-[1fr_110px_110px] gap-3 px-5 py-3 transition-colors hover:bg-[#fff5ee] sm:px-6"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">{category.category}</p>
                </div>
                <p className={`text-sm ${lightMuted}`}>{category.units}</p>
                <p className={`text-sm font-semibold ${lightAccent}`}>{category.revenue}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
