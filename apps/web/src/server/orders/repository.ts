import { randomUUID } from "node:crypto";
import { getDb } from "@/server/db";
import type { CustomerRow, OrderDetailRow, OrderItemRow, OrderRow } from "@/server/shared/types";

export function getOrdersWithCustomers() {
  const db = getDb();
  return db.prepare(`
    SELECT
      o.id,
      o.order_number,
      o.customer_id,
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
      o.notes
    FROM orders o
    INNER JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC
  `).all<OrderRow>();
}

export function getOrderDetailRow(orderId: string) {
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
      o.subtotal_cents,
      o.total_cents,
      o.deposit_paid_cents,
      o.balance_due_cents,
      o.created_at,
      o.updated_at,
      o.pickup_at,
      o.notes
    FROM orders o
    INNER JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ?
  `).get<OrderDetailRow>(orderId);
}

export function getOrderById(orderId: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM orders WHERE id = ?").get<{
    id: string;
    customer_id: string;
    status: string;
    payment_status: string;
    fulfillment_type: string;
    total_cents: number;
    pickup_at: string | null;
    notes: string | null;
  }>(orderId);
}

export function getAllOrderItems() {
  const db = getDb();
  return db.prepare("SELECT * FROM order_items ORDER BY order_id ASC").all<OrderItemRow>();
}

export function getOrderItems(orderId: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC").all<OrderItemRow>(orderId);
}

export function deleteOrderItemsForOrder(orderId: string) {
  const db = getDb();
  db.prepare("DELETE FROM order_items WHERE order_id = ?").run(orderId);
}

export function deleteOrderById(orderId: string) {
  const db = getDb();
  db.prepare("DELETE FROM orders WHERE id = ?").run(orderId);
}

export function findOrCreateCustomer(fullName: string, phone: string) {
  const db = getDb();
  const existing = db
    .prepare("SELECT id, full_name, phone FROM customers WHERE phone = ?")
    .get<CustomerRow>(phone);

  if (existing) {
    db.prepare("UPDATE customers SET full_name = ?, updated_at = ? WHERE id = ?").run(
      fullName,
      new Date().toISOString(),
      existing.id,
    );
    return existing.id;
  }

  const id = randomUUID();
  db.prepare(
    "INSERT INTO customers (id, full_name, email, phone, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, fullName, null, phone, null, new Date().toISOString(), new Date().toISOString());

  return id;
}

export function getNextOrderNumber() {
  const db = getDb();
  const latest = db
    .prepare("SELECT order_number FROM orders ORDER BY order_number DESC LIMIT 1")
    .get<{ order_number?: string }>();
  const latestNumber = latest?.order_number ? Number(latest.order_number.split("-")[1]) : 2036;
  return `VC-${String(latestNumber + 1).padStart(4, "0")}`;
}

export function insertOrderRecord(input: {
  orderId: string;
  orderNumber: string;
  customerId: string;
  status: string;
  paymentStatus: string;
  fulfillmentType: string;
  subtotalCents: number;
  totalCents: number;
  depositPaidCents: number;
  balanceDueCents: number;
  notes: string;
  pickupAt: string;
  now: string;
}) {
  const db = getDb();
  db.prepare(
    "INSERT INTO orders (id, order_number, customer_id, status, payment_status, fulfillment_type, subtotal_cents, tax_cents, discount_cents, total_cents, deposit_paid_cents, balance_due_cents, notes, pickup_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    input.orderId,
    input.orderNumber,
    input.customerId,
    input.status,
    input.paymentStatus,
    input.fulfillmentType,
    input.subtotalCents,
    0,
    0,
    input.totalCents,
    input.depositPaidCents,
    input.balanceDueCents,
    input.notes || null,
    input.pickupAt,
    input.now,
    input.now,
  );
}

export function insertOrderItemRecord(input: {
  itemId: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}) {
  const db = getDb();
  db.prepare(
    "INSERT INTO order_items (id, order_id, product_id, product_name_snapshot, unit_price_cents, quantity, line_total_cents) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(
    input.itemId,
    input.orderId,
    input.productId,
    input.productName,
    input.unitPriceCents,
    input.quantity,
    input.lineTotalCents,
  );
}

export function updateOrderRecord(input: {
  orderId: string;
  customerId: string;
  status: string;
  paymentStatus: string;
  fulfillmentType: string;
  subtotalCents: number;
  totalCents: number;
  depositPaidCents: number;
  balanceDueCents: number;
  notes: string;
  pickupAt: string;
  now: string;
}) {
  const db = getDb();
  db.prepare(
    "UPDATE orders SET customer_id = ?, status = ?, payment_status = ?, fulfillment_type = ?, subtotal_cents = ?, total_cents = ?, deposit_paid_cents = ?, balance_due_cents = ?, notes = ?, pickup_at = ?, updated_at = ? WHERE id = ?",
  ).run(
    input.customerId,
    input.status,
    input.paymentStatus,
    input.fulfillmentType,
    input.subtotalCents,
    input.totalCents,
    input.depositPaidCents,
    input.balanceDueCents,
    input.notes || null,
    input.pickupAt,
    input.now,
    input.orderId,
  );
}

export function updateOrderItemRecord(input: {
  itemId: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}) {
  const db = getDb();
  db.prepare(
    "UPDATE order_items SET product_id = ?, product_name_snapshot = ?, unit_price_cents = ?, quantity = ?, line_total_cents = ? WHERE id = ?",
  ).run(
    input.productId,
    input.productName,
    input.unitPriceCents,
    input.quantity,
    input.lineTotalCents,
    input.itemId,
  );
}

export function purgeOrderRecord(orderId: string) {
  deleteOrderItemsForOrder(orderId);
  deleteOrderById(orderId);
}
