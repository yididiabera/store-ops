import { getDb } from "@/server/db";
import type { OrderItemRow, OrderRow, ProductRow } from "@/server/shared/types";

export function getDashboardProducts() {
  const db = getDb();
  return db.prepare("SELECT * FROM products ORDER BY updated_at DESC").all<ProductRow>();
}

export function getDashboardOrders() {
  const db = getDb();
  return db.prepare(`
    SELECT
      o.id,
      o.order_number,
      o.status,
      o.fulfillment_type,
      o.total_cents,
      o.created_at,
      o.pickup_at,
      c.full_name AS customer_name,
      c.id AS customer_id,
      c.phone AS customer_phone,
      o.payment_status,
      o.deposit_paid_cents,
      o.balance_due_cents,
      o.notes
    FROM orders o
    INNER JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC
  `).all<OrderRow>();
}

export function getDashboardOrderItems() {
  const db = getDb();
  return db.prepare(`
    SELECT
      oi.order_id,
      oi.product_id,
      oi.product_name_snapshot,
      oi.quantity,
      p.category AS product_category,
      p.status AS product_status,
      p.stock_quantity,
      p.low_stock_threshold,
      p.price_cents,
      oi.id,
      oi.unit_price_cents,
      oi.line_total_cents
    FROM order_items oi
    INNER JOIN products p ON p.id = oi.product_id
  `).all<OrderItemRow & {
    product_category: string;
    product_status: string;
    stock_quantity: number;
    low_stock_threshold: number;
    price_cents: number;
  }>();
}
