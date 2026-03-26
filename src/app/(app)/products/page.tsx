import {
  deleteProductAction,
  updateProductAction,
} from "@/app/(app)/products/actions";
import Link from "next/link";
import { NewProductModal } from "@/components/app/new-product-modal";
import {
  getProductsPageData,
  productCategoryOptions,
  productStatusOptions,
} from "@/server/products";

const stockToneClasses = {
  healthy: "bg-[#dfeadf] text-[#2f5a35]",
  low: "bg-[#f8e0d0] text-[#8c492d]",
  empty: "bg-[#f1d1ce] text-[#8a312a]",
} as const;

const metricIcons = [
  <svg key="catalog" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>,
  <svg key="stock" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>,
  <svg key="low" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>,
  <svg key="best" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>,
] as const;

const metricIconByLabel = {
  Catalog: metricIcons[0],
  Stock: metricIcons[1],
  Low: metricIcons[2],
  "Best Seller": metricIcons[3],
} as const;

const getStockTone = (
  stockQuantity: number,
  lowStockThreshold: number,
  rawStatus: string,
) => {
  if (rawStatus === "OUT_OF_STOCK" || stockQuantity <= 0) {
    return {
      label: "Out of Stock",
      className: stockToneClasses.empty,
    };
  }

  if (stockQuantity <= lowStockThreshold) {
    return {
      label: "Low Stock",
      className: stockToneClasses.low,
    };
  }

  return {
    label: "Healthy Stock",
    className: stockToneClasses.healthy,
  };
};

type ProductsPageProps = {
  searchParams?: Promise<{
    filter?: string;
    q?: string;
    category?: string;
  }>;
};

const productFilters = ["all", "low", "out", "healthy"] as const;
type ProductFilter = (typeof productFilters)[number];

const filterMeta: Record<
  ProductFilter,
  {
    label: string;
    description: string;
  }
> = {
  all: {
    label: "All products",
    description: "Showing every product in the catalog.",
  },
  low: {
    label: "Low stock",
    description: "Showing items that need restock attention.",
  },
  out: {
    label: "Out of stock",
    description: "Showing unavailable items only.",
  },
  healthy: {
    label: "Healthy",
    description: "Showing stocked items that are in a safe range.",
  },
};

const buildFilterHref = (params: {
  filter?: string;
  q?: string;
  category?: string;
}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "ALL") {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `/products?${queryString}` : "/products";
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { metrics, products } = await getProductsPageData();
  const resolvedSearchParams = (await searchParams) ?? {};
  const activeFilter = productFilters.includes(
    resolvedSearchParams.filter as ProductFilter,
  )
    ? (resolvedSearchParams.filter as ProductFilter)
    : "all";
  const query = resolvedSearchParams.q?.trim().toLowerCase() ?? "";
  const selectedCategory = resolvedSearchParams.category?.trim() ?? "ALL";
  const metricMap = new Map(metrics.map((metric) => [metric.label, metric]));
  const orderedMetrics = [
    {
      ...(metricMap.get("Low") ?? { label: "Low", value: "0", note: "Restock" }),
      tone: "priority" as const,
    },
    {
      ...(metricMap.get("Stock") ?? { label: "Stock", value: "0", note: "Units" }),
      tone: "default" as const,
    },
    {
      ...(metricMap.get("Catalog") ?? { label: "Catalog", value: "0", note: "Products" }),
      tone: "muted" as const,
    },
    {
      ...(metricMap.get("Best Seller") ?? {
        label: "Best Seller",
        value: "No sales yet",
        note: "Top item",
      }),
      tone: "accent" as const,
    },
  ];
  const filteredProducts = products.filter((product) => {
    const stockState = getStockTone(
      product.stockQuantity,
      product.lowStockThreshold,
      product.rawStatus,
    );

    const matchesMetricFilter =
      activeFilter === "all"
        ? true
        : activeFilter === "low"
          ? stockState.label === "Low Stock"
          : activeFilter === "out"
            ? stockState.label === "Out of Stock"
            : stockState.label === "Healthy Stock";

    if (!matchesMetricFilter) {
      return false;
    }

    const matchesQuery =
      query.length === 0
        ? true
        : [product.name, product.category, product.status, product.price].some((value) =>
            value.toLowerCase().includes(query),
          );

    if (!matchesQuery) {
      return false;
    }

    if (selectedCategory !== "ALL" && product.rawCategory !== selectedCategory) {
      return false;
    }

    return true;
  });
  const quickFilters = [
    {
      label: "Low stock",
      href: buildFilterHref({
        filter: "low",
        q: resolvedSearchParams.q ?? "",
        category: selectedCategory,
      }),
      active: activeFilter === "low",
    },
    {
      label: "Out of stock",
      href: buildFilterHref({
        filter: "out",
        q: resolvedSearchParams.q ?? "",
        category: selectedCategory,
      }),
      active: activeFilter === "out",
    },
    {
      label: "Healthy",
      href: buildFilterHref({
        filter: "healthy",
        q: resolvedSearchParams.q ?? "",
        category: selectedCategory,
      }),
      active: activeFilter === "healthy",
    },
  ];

  return (
    <main className="space-y-3">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {orderedMetrics.map((metric) => (
          <article
            key={metric.label}
            className={`flex min-h-[8.2rem] flex-col justify-between rounded-[1.05rem] px-5 py-3 text-[color:var(--foreground)] transition-[transform,box-shadow,border-color,background] hover:-translate-y-[1px] ${
              metric.tone === "priority"
                ? "border border-[#f0d6c6] border-l-[4px] border-l-[#cf7b52] bg-[var(--surface-priority-warm)] shadow-[0_14px_28px_rgba(145,102,67,0.11)]"
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
                    ? "bg-[#fff0e5] text-[#a55734]"
                    : metric.tone === "accent"
                      ? "bg-[#fff1e7] text-[color:var(--gold-deep)]"
                      : "bg-[#fff1e7] text-[color:var(--accent-deep)]"
                }`}
              >
                {metricIconByLabel[metric.label as keyof typeof metricIconByLabel]}
              </div>
            </div>

            <div className="space-y-0.5">
              <p
                className={`text-[0.9rem] font-medium leading-tight ${
                  metric.tone === "priority"
                    ? "text-[#8f5134]"
                    : "text-[color:var(--muted)]"
                }`}
              >
                {metric.label}
              </p>
              <p
                className={`text-[0.68rem] uppercase tracking-[0.18em] ${
                  metric.tone === "priority"
                    ? "text-[#b46b45]"
                    : "text-[color:var(--accent-deep)]"
                }`}
              >
                {metric.note}
              </p>
              <p
                className={`pt-0.5 text-[1.45rem] font-bold leading-tight tracking-tight break-words ${
                  metric.tone === "accent"
                    ? "text-[color:var(--gold-deep)]"
                    : metric.tone === "priority"
                      ? "text-[#7a3e2a]"
                      : "text-[color:var(--foreground)]"
                }`}
              >
                {metric.value}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {productFilters.map((filterKey) => (
          <Link
            key={filterKey}
            href={
              filterKey === "all"
                ? buildFilterHref({
                    q: resolvedSearchParams.q ?? "",
                    category: selectedCategory,
                  })
                : buildFilterHref({
                    filter: filterKey,
                    q: resolvedSearchParams.q ?? "",
                    category: selectedCategory,
                  })
            }
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

      <section className="surface-panel rounded-[1.2rem]">
          <div className="border-b border-[color:var(--line)] px-5 py-3 sm:px-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {quickFilters.map((quickFilter) => (
                <Link
                  key={quickFilter.label}
                  href={quickFilter.href}
                  className={`interactive-chip inline-flex items-center justify-center rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                    quickFilter.active
                      ? "border-[rgba(207,123,82,0.16)] bg-[#f8e0d0] text-[#8c492d]"
                      : "border-[color:var(--line)] bg-white/76 text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--foreground)]"
                  }`}
                >
                  {quickFilter.label}
                </Link>
              ))}
            </div>

            <form className="grid gap-3 lg:grid-cols-[minmax(15rem,2fr)_minmax(10rem,1fr)_minmax(4.5rem,auto)] lg:items-end">
              <label className="min-w-0 space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Search
                </span>
                <input
                  type="text"
                  name="q"
                  defaultValue={resolvedSearchParams.q ?? ""}
                  placeholder="Search product, category, price"
                  className="premium-input px-3 py-2.5 text-[0.9rem]"
                />
              </label>

              <label className="min-w-0 space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Category
                </span>
                <select
                  name="category"
                  defaultValue={selectedCategory}
                  className="premium-select px-3 py-2.5 pr-8 text-[0.9rem]"
                >
                  <option value="ALL">All categories</option>
                  {productCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category.toLowerCase().replaceAll("_", " ")}
                    </option>
                  ))}
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
                  href={activeFilter === "all" ? "/products" : `/products?filter=${activeFilter}`}
                  className="inline-flex items-center justify-center rounded-[0.9rem] border border-[color:var(--line)] bg-white/75 px-2.5 py-2 text-sm font-semibold text-[color:var(--muted)] transition-colors hover:bg-white hover:text-[color:var(--foreground)]"
                >
                  Reset
                </Link>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-[color:var(--line)] px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-[1.35rem] font-bold tracking-tight">Product Catalog</h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {filterMeta[activeFilter].description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NewProductModal
                productCategoryOptions={productCategoryOptions}
                productStatusOptions={productStatusOptions}
              />
              {activeFilter !== "all" || query || selectedCategory !== "ALL" ? (
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-[0.85rem] border border-[color:var(--line)] bg-white/75 px-3 py-1.5 text-xs font-semibold text-[color:var(--muted)] transition-colors hover:bg-white hover:text-[color:var(--foreground)]"
                >
                  Clear filter
                </Link>
              ) : null}
              <p className="text-sm font-medium text-[color:var(--muted)]">
                {filteredProducts.length} item{filteredProducts.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[0.4fr_1.85fr_1.05fr_0.8fr_1.1fr_1.1fr_0.82fr] gap-3 border-b border-[color:var(--line)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)] sm:px-6">
                <p>No.</p>
                <p>Product</p>
                <p>Category</p>
                <p>Price</p>
                <p>Stock</p>
                <p>Status</p>
                <p>Actions</p>
              </div>

              <div className="divide-y divide-[color:var(--line)]">
                {filteredProducts.map((product, index) => {
                  const stockState = getStockTone(
                    product.stockQuantity,
                    product.lowStockThreshold,
                    product.rawStatus,
                  );

                  return (
                    <form
                      key={product.id}
                      action={updateProductAction}
                      className="interactive-row grid grid-cols-[0.4fr_1.85fr_1.05fr_0.8fr_1.1fr_1.1fr_0.82fr] gap-3 px-5 py-4 hover:bg-[#fcf4ed] sm:px-6"
                    >
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="description" value={product.description} />

                      <div className="flex items-start justify-center pt-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1e7] text-sm font-semibold text-[color:var(--accent-deep)]">
                          {index + 1}
                        </span>
                      </div>

                      <div className="space-y-2 min-w-0">
                        <input
                          name="name"
                          defaultValue={product.name}
                          className="premium-input"
                        />
                        <p className="text-xs text-[color:var(--muted)]">
                          {product.linkedOrderCount} linked order
                          {product.linkedOrderCount === 1 ? "" : "s"}
                        </p>
                      </div>

                      <div className="space-y-2 min-w-0">
                        <select
                          name="category"
                          defaultValue={product.rawCategory}
                          className="premium-select"
                        >
                          {productCategoryOptions.map((category) => (
                            <option key={category} value={category}>
                              {category.toLowerCase().replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-[color:var(--muted)]">{product.category}</p>
                      </div>

                      <div className="space-y-2 min-w-0">
                        <input
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={product.priceValue}
                          className="premium-input"
                        />
                        <p className="text-xs text-[color:var(--muted)]">{product.price}</p>
                      </div>

                      <div className="space-y-2 min-w-0">
                        <label className="flex items-center justify-between gap-3 rounded-[0.95rem] border border-[color:var(--line)] bg-[color:var(--field-bg)] px-3 py-2">
                          <span className="premium-label">Qty</span>
                          <input
                            name="stockQuantity"
                            type="number"
                            min="0"
                            defaultValue={product.stockQuantity}
                            className="w-20 border-0 bg-transparent p-0 text-right text-base font-semibold text-[color:var(--foreground)] outline-none"
                          />
                        </label>
                        <label className="flex items-center justify-between gap-3 rounded-[0.95rem] border border-[color:var(--line)] bg-[color:var(--field-bg)] px-3 py-2">
                          <span className="premium-label">Low</span>
                          <input
                            name="lowStockThreshold"
                            type="number"
                            min="0"
                            defaultValue={product.lowStockThreshold}
                            className="w-20 border-0 bg-transparent p-0 text-right text-base font-semibold text-[color:var(--foreground)] outline-none"
                          />
                        </label>
                      </div>

                      <div className="space-y-2 min-w-0">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stockState.className}`}
                        >
                          {stockState.label}
                        </span>
                        <select
                          name="status"
                          defaultValue={product.rawStatus}
                          className="premium-select"
                        >
                          {productStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.toLowerCase().replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1 self-start">
                        <button
                          type="submit"
                          className="interactive-soft-button inline-flex min-h-7 items-center justify-center rounded-[0.8rem] bg-[color:var(--action-update-soft)] px-2.5 py-1.5 text-[0.72rem] font-semibold text-[color:var(--action-update-strong)] hover:bg-[#d2dee9]"
                        >
                          Update
                        </button>
                        <button
                          type="submit"
                          formAction={deleteProductAction}
                          className="interactive-soft-button inline-flex min-h-7 items-center justify-center rounded-[0.8rem] bg-[color:var(--action-delete-soft)] px-2.5 py-1.5 text-[0.72rem] font-semibold text-[color:var(--action-delete-strong)] hover:bg-[#e4cfd3]"
                        >
                          Delete
                        </button>
                      </div>
                    </form>
                  );
                })}
                {filteredProducts.length === 0 ? (
                  <div className="px-5 py-10 text-center sm:px-6">
                    <p className="text-sm font-medium text-[color:var(--foreground)]">
                      No products match this filter.
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Try another stock view or clear the filters.
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
