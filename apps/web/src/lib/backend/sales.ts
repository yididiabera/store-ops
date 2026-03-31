import { fetchApi, isApiEnabled } from "./api";

export type SalesPeriod = "ALL" | "TODAY" | "WEEK" | "MONTH";

type SalesPageData = Awaited<ReturnType<(typeof import("@/server/sales"))["getSalesPageData"]>>;

export async function getSalesPageData(period: SalesPeriod = "ALL"): Promise<SalesPageData> {
  if (!isApiEnabled()) {
    const { getSalesPageData: getSalesPageDataInternal } = await import("@/server/sales");
    return getSalesPageDataInternal(period);
  }

  const suffix = period === "ALL" ? "" : `?period=${period}`;
  return fetchApi<SalesPageData>(`/sales${suffix}`);
}
