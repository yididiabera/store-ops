import { formatCategory, formatCurrency } from "@/server/dashboard/format";
import { getDashboardOrderItems, getDashboardOrders, getDashboardProducts } from "./repository";

const validSalesStatuses = ["CONFIRMED", "IN_PRODUCTION", "READY", "DELIVERED"];

const getDayBounds = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

export async function getDashboardData() {
  const now = new Date();
  const { start: todayStart, end: todayEnd } = getDayBounds(now);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 5);

  const products = getDashboardProducts();
  const orders = getDashboardOrders();
  const orderItems = getDashboardOrderItems();

  const itemsByOrderId = new Map<string, typeof orderItems>();
  orderItems.forEach((item) => {
    const current = itemsByOrderId.get(item.order_id) ?? [];
    current.push(item);
    itemsByOrderId.set(item.order_id, current);
  });

  const validTodayOrders = orders.filter((order) => {
    const createdAt = new Date(order.created_at);
    return createdAt >= todayStart && createdAt < todayEnd && validSalesStatuses.includes(order.status);
  });
  const soldToday = validTodayOrders.reduce((sum, order) => {
    const items = itemsByOrderId.get(order.id) ?? [];
    return sum + items.reduce((inner, item) => inner + item.quantity, 0);
  }, 0);
  const revenueToday = validTodayOrders.reduce((sum, order) => sum + order.total_cents, 0);
  const stockLeft = products.reduce((sum, product) => sum + product.stock_quantity, 0);
  const pendingOrders = orders.filter((order) => ["CONFIRMED", "IN_PRODUCTION"].includes(order.status)).length;
  const urgentOrders = orders.filter((order) => {
    if (!order.pickup_at) {
      return false;
    }

    return (
      ["CONFIRMED", "IN_PRODUCTION"].includes(order.status) &&
      new Date(order.pickup_at).getTime() - now.getTime() <= 1000 * 60 * 60 * 24
    );
  }).length;

  const previousDayStart = new Date(todayStart);
  previousDayStart.setDate(previousDayStart.getDate() - 1);
  const previousDayOrders = orders.filter((order) => {
    const createdAt = new Date(order.created_at);
    return createdAt >= previousDayStart && createdAt < todayStart && validSalesStatuses.includes(order.status);
  });
  const previousRevenue = previousDayOrders.reduce((sum, order) => sum + order.total_cents, 0);
  const previousSold = previousDayOrders.reduce((sum, order) => {
    const items = itemsByOrderId.get(order.id) ?? [];
    return sum + items.reduce((inner, item) => inner + item.quantity, 0);
  }, 0);

  const recentOrders = orders.slice(0, 5).map((order) => {
    const items = itemsByOrderId.get(order.id) ?? [];
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      orderId: order.id,
      orderNumber: order.order_number,
      customer: order.customer_name,
      product:
        items.length <= 1
          ? items[0]?.product_name_snapshot ?? "Custom order"
          : `${items[0]?.product_name_snapshot ?? "Custom order"} +${items.length - 1} more`,
      amount: formatCurrency(order.total_cents),
      status: order.status as
        | "CONFIRMED"
        | "IN_PRODUCTION"
        | "READY"
        | "DELIVERED"
        | "DRAFT"
        | "CANCELLED",
      itemCount,
      fulfillment: order.fulfillment_type === "PICKUP" ? "Pickup" : "Delivery",
      dueTime: order.pickup_at
        ? new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(order.pickup_at))
        : "Schedule pending",
    };
  });

  const lowStockItems = products
    .filter((product) => product.status === "OUT_OF_STOCK" || product.stock_quantity <= product.low_stock_threshold)
    .sort((a, b) => a.stock_quantity - b.stock_quantity)
    .slice(0, 4)
    .map((product) => ({
      id: product.id,
      name: product.name,
      category: formatCategory(product.category),
      stockLeft: product.stock_quantity,
      status: product.status === "OUT_OF_STOCK" ? "Out of Stock" : "Low Stock",
    }));

  const weeklyProductSales = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      soldThisWeek: number;
      priceCents: number;
      stockLeft: number;
      status: "In Stock" | "Low Stock" | "Out of Stock";
    }
  >();

  orders.forEach((order) => {
    const createdAt = new Date(order.created_at);
    if (createdAt < weekStart || !validSalesStatuses.includes(order.status)) {
      return;
    }

    const items = itemsByOrderId.get(order.id) ?? [];
    items.forEach((item) => {
      const existing = weeklyProductSales.get(item.product_id);
      const status =
        item.product_status === "OUT_OF_STOCK"
          ? "Out of Stock"
          : item.stock_quantity <= item.low_stock_threshold
            ? "Low Stock"
            : "In Stock";

      weeklyProductSales.set(item.product_id, {
        id: item.product_id,
        name: item.product_name_snapshot,
        category: formatCategory(item.product_category),
        soldThisWeek: (existing?.soldThisWeek ?? 0) + item.quantity,
        priceCents: item.price_cents,
        stockLeft: item.stock_quantity,
        status,
      });
    });
  });

  const productPerformance = Array.from(weeklyProductSales.values())
    .sort((a, b) => b.soldThisWeek - a.soldThisWeek)
    .slice(0, 5)
    .map((product) => ({
      ...product,
      price: formatCurrency(product.priceCents),
    }));

  const salesTrend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const { start, end } = getDayBounds(date);

    const amount = orders
      .filter((order) => {
        const createdAt = new Date(order.created_at);
        return createdAt >= start && createdAt < end && validSalesStatuses.includes(order.status);
      })
      .reduce((sum, order) => sum + order.total_cents, 0);

    return {
      day: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
      amount,
    };
  });

  const productionQueue = orders
    .filter((order) => ["CONFIRMED", "IN_PRODUCTION", "READY"].includes(order.status))
    .slice(0, 4)
    .map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customer: order.customer_name,
      dueTime: order.pickup_at
        ? new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(order.pickup_at))
        : "TBD",
      status: order.status,
    }));

  return {
    metrics: [
      {
        label: "Sold today",
        value: soldToday.toString(),
        note: `${soldToday >= previousSold ? "+" : ""}${soldToday - previousSold} vs yesterday`,
      },
      {
        label: "Stock left",
        value: stockLeft.toString(),
        note: `${lowStockItems.length} low`,
      },
      {
        label: "Revenue today",
        value: formatCurrency(revenueToday),
        note: `${revenueToday >= previousRevenue ? "+" : ""}${formatCurrency(revenueToday - previousRevenue)} vs yesterday`,
      },
      {
        label: "Pending orders",
        value: pendingOrders.toString(),
        note: `${urgentOrders} urgent`,
      },
    ],
    recentOrders,
    lowStockItems,
    productPerformance,
    salesTrend: salesTrend.map((item) => ({
      ...item,
      height: item.amount === 0 ? 12 : Math.max(18, Math.round((item.amount / Math.max(...salesTrend.map((entry) => entry.amount), 1)) * 128)),
      value: formatCurrency(item.amount),
    })),
    productionQueue,
  };
}
