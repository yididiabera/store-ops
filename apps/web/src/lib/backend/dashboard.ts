import { fetchApi, isApiEnabled } from "./api";

type DashboardData = Awaited<ReturnType<(typeof import("@/server/dashboard"))["getDashboardData"]>>;

export async function getDashboardData(): Promise<DashboardData> {
  if (!isApiEnabled()) {
    const { getDashboardData: getDashboardDataInternal } = await import("@/server/dashboard");
    return getDashboardDataInternal();
  }

  return fetchApi<DashboardData>("/dashboard");
}
