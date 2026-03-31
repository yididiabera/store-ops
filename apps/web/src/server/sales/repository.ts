import { getDb } from "@/server/db";
import type { OrderRow, ProductRow, OrderItemRow } from "@/server/shared/types";

export function getSalesProducts() {
  const db = getDb();
  return db.prepare("SELECT * FROM products ORDER BY name ASC").all<ProductRow>();
}

export function getSalesOrders() {
  const db = getDb();
  return db.prepare(`
    SELECT
      o.id,
      o.order_number,
      c.full_name AS customer_name,
      c.phone AS customer_phone,
      o.status,
      o.payment_status,
      o.fulfillment_type,
      o.total_cents,
      o.deposit_paid_cents,
      o.balance_due_cents,
      o.created_at,
      o.pickup_at,
      o.notes,
      c.id AS customer_id
    FROM orders o
    INNER JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC
  `).all<OrderRow>();
}

export function getSalesOrderItems() {
  const db = getDb();
  return db.prepare("SELECT * FROM order_items ORDER BY order_id ASC").all<OrderItemRow>();
}
