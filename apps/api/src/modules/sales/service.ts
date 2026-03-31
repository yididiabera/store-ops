import {
  getSalesOrderItems,
  getSalesOrders,
  getSalesProducts,
} from "./repository";

const salesOrderStatuses = ["CONFIRMED", "IN_PRODUCTION", "READY", "DELIVERED"] as const;

const formatCategory = (value: string) =>
  value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const toCurrency = (amountInCents: number) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);

export type SalesPeriod = "ALL" | "TODAY" | "WEEK" | "MONTH";

export async function getSalesPageData(period: SalesPeriod = "ALL") {
  const products = await getSalesProducts();
  const orders = await getSalesOrders();
  const items = await getSalesOrderItems();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 6);
  const monthStart = new Date(todayStart);
  monthStart.setDate(todayStart.getDate() - 29);

  const matchesPeriod = (order: (typeof orders)[number]) => {
    if (period === "ALL") {
      return true;
    }

    const createdAt = new Date(order.created_at);

    if (period === "TODAY") {
      return createdAt >= todayStart;
    }

    if (period === "WEEK") {
      return createdAt >= weekStart;
    }

    return createdAt >= monthStart;
  };

  const salesOrders = orders.filter((order) => salesOrderStatuses.includes(order.status as (typeof salesOrderStatuses)[number]) && matchesPeriod(order));
  const itemsByOrder = new Map<string, typeof items>();
  items.forEach((item) => {
    const current = itemsByOrder.get(item.order_id) ?? [];
    current.push(item);
    itemsByOrder.set(item.order_id, current);
  });

  const totalRevenueCents = salesOrders.reduce((sum, order) => sum + order.total_cents, 0);
  const totalUnits = salesOrders.reduce((sum, order) => {
    const orderItems = itemsByOrder.get(order.id) ?? [];
    return sum + orderItems.reduce((inner, item) => inner + item.quantity, 0);
  }, 0);
  const averageOrderValueCents = salesOrders.length > 0 ? Math.round(totalRevenueCents / salesOrders.length) : 0;
  const paidOrders = salesOrders.filter((order) => order.payment_status === "PAID").length;

  const revenueByDay = new Map<
    string,
    {
      label: string;
      revenueCents: number;
      orders: number;
      units: number;
    }
  >();
  const productSales = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      units: number;
      revenueCents: number;
      stockLeft: number;
    }
  >();
  const categorySales = new Map<
    string,
    {
      category: string;
      units: number;
      revenueCents: number;
    }
  >();

  salesOrders.forEach((order) => {
    const date = new Date(order.created_at);
    const dayKey = date.toISOString().slice(0, 10);
    const dayLabel = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
    const existingDay = revenueByDay.get(dayKey) ?? {
      label: dayLabel,
      revenueCents: 0,
      orders: 0,
      units: 0,
    };
    const orderItems = itemsByOrder.get(order.id) ?? [];
    const orderUnits = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    revenueByDay.set(dayKey, {
      label: dayLabel,
      revenueCents: existingDay.revenueCents + order.total_cents,
      orders: existingDay.orders + 1,
      units: existingDay.units + orderUnits,
    });

    orderItems.forEach((item) => {
      const product = products.find((entry) => entry.id === item.product_id);
      const nextProduct = productSales.get(item.product_id) ?? {
        id: item.product_id,
        name: item.product_name_snapshot,
        category: formatCategory(product?.category ?? "SIGNATURE_CAKE"),
        units: 0,
        revenueCents: 0,
        stockLeft: product?.stock_quantity ?? 0,
      };

      productSales.set(item.product_id, {
        ...nextProduct,
        units: nextProduct.units + item.quantity,
        revenueCents: nextProduct.revenueCents + item.line_total_cents,
      });

      const categoryKey = product?.category ?? "SIGNATURE_CAKE";
      const nextCategory = categorySales.get(categoryKey) ?? {
        category: formatCategory(categoryKey),
        units: 0,
        revenueCents: 0,
      };

      categorySales.set(categoryKey, {
        category: nextCategory.category,
        units: nextCategory.units + item.quantity,
        revenueCents: nextCategory.revenueCents + item.line_total_cents,
      });
    });
  });

  const dailySales = Array.from(revenueByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([, day]) => ({
      ...day,
      revenue: toCurrency(day.revenueCents),
    }));

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 6)
    .map((product) => ({
      ...product,
      revenue: toCurrency(product.revenueCents),
    }));

  const categoryPerformance = Array.from(categorySales.values())
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .map((category) => ({
      ...category,
      revenue: toCurrency(category.revenueCents),
    }));

  const paymentSummary = [
    { label: "Paid", value: orders.filter((order) => order.payment_status === "PAID").length },
    { label: "Partial", value: orders.filter((order) => order.payment_status === "PARTIALLY_PAID").length },
    { label: "Unpaid", value: orders.filter((order) => order.payment_status === "UNPAID").length },
  ];

  return {
    period,
    metrics: [
      { label: "Revenue", value: toCurrency(totalRevenueCents), note: "Confirmed sales" },
      { label: "Units sold", value: totalUnits.toString(), note: "All products" },
      { label: "Avg order", value: toCurrency(averageOrderValueCents), note: "Per sale" },
      { label: "Paid orders", value: paidOrders.toString(), note: "Settled" },
    ],
    dailySales,
    topProducts,
    categoryPerformance,
    paymentSummary,
  };
}
