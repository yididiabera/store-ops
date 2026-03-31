import { randomUUID } from "node:crypto";
import { getPool, type DbExecutor } from "../../db";

export type ProductOptionRow = {
  id: string;
  name: string;
  price_cents: number;
  stock_quantity: number;
  status: string;
};

export type OrderRow = {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  fulfillment_type: string;
  total_cents: number;
  deposit_paid_cents: number;
  balance_due_cents: number;
  created_at: string;
  pickup_at: string | null;
  notes: string | null;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

export type OrderDetailRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  fulfillment_type: string;
  subtotal_cents: number;
  total_cents: number;
  deposit_paid_cents: number;
  balance_due_cents: number;
  created_at: string;
  updated_at: string;
  pickup_at: string | null;
  notes: string | null;
};

function db(executor?: DbExecutor) {
  return executor ?? getPool();
}

export async function getVisibleProducts(executor?: DbExecutor) {
  const result = await db(executor).query<ProductOptionRow>(
    "select * from products where status != 'ARCHIVED' order by name asc",
  );
  return result.rows;
}

export async function getProductById(productId: string, executor?: DbExecutor) {
  const result = await db(executor).query<ProductOptionRow>(
    "select * from products where id = $1",
    [productId],
  );
  return result.rows[0] ?? null;
}

export async function getOrdersWithCustomers(executor?: DbExecutor) {
  const result = await db(executor).query<OrderRow>(`
    select
      o.id,
      o.order_number,
      o.customer_id,
      c.full_name as customer_name,
      c.phone as customer_phone,
      o.status,
      o.payment_status,
      o.fulfillment_type,
      o.total_cents,
      o.deposit_paid_cents,
      o.balance_due_cents,
      o.created_at,
      o.pickup_at,
      o.notes
    from orders o
    inner join customers c on c.id = o.customer_id
    order by o.created_at desc
  `);
  return result.rows;
}

export async function getOrderDetailRow(orderId: string, executor?: DbExecutor) {
  const result = await db(executor).query<OrderDetailRow>(
    `select
       o.id,
       o.order_number,
       c.full_name as customer_name,
       c.phone as customer_phone,
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
     from orders o
     inner join customers c on c.id = o.customer_id
     where o.id = $1`,
    [orderId],
  );
  return result.rows[0] ?? null;
}

export async function getOrderById(orderId: string, executor?: DbExecutor) {
  const result = await db(executor).query<{
    id: string;
    customer_id: string;
    status: string;
    payment_status: string;
    fulfillment_type: string;
    total_cents: number;
    pickup_at: string | null;
    notes: string | null;
  }>("select * from orders where id = $1", [orderId]);
  return result.rows[0] ?? null;
}

export async function getAllOrderItems(executor?: DbExecutor) {
  const result = await db(executor).query<OrderItemRow>(
    "select * from order_items order by order_id asc",
  );
  return result.rows;
}

export async function getOrderItems(orderId: string, executor?: DbExecutor) {
  const result = await db(executor).query<OrderItemRow>(
    "select * from order_items where order_id = $1 order by id asc",
    [orderId],
  );
  return result.rows;
}

export async function findOrCreateCustomer(fullName: string, phone: string, executor?: DbExecutor) {
  const existing = await db(executor).query<{ id: string }>(
    "select id from customers where phone = $1",
    [phone],
  );

  if (existing.rows[0]) {
    await db(executor).query(
      "update customers set full_name = $1, updated_at = $2 where id = $3",
      [fullName, new Date().toISOString(), existing.rows[0].id],
    );
    return existing.rows[0].id;
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  await db(executor).query(
    `insert into customers
      (id, full_name, email, phone, notes, created_at, updated_at)
     values
      ($1, $2, $3, $4, $5, $6, $7)`,
    [id, fullName, null, phone, null, now, now],
  );

  return id;
}

export async function getNextOrderNumber(executor?: DbExecutor) {
  const result = await db(executor).query<{ order_number?: string }>(
    "select order_number from orders order by order_number desc limit 1",
  );
  const latestOrderNumber = result.rows[0]?.order_number;
  const latestNumber = latestOrderNumber ? Number(latestOrderNumber.split("-")[1]) : 2036;
  return `VC-${String(latestNumber + 1).padStart(4, "0")}`;
}

export async function insertOrderRecord(
  input: {
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
    pickupAt: string | null;
    now: string;
  },
  executor?: DbExecutor,
) {
  await db(executor).query(
    `insert into orders
      (id, order_number, customer_id, status, payment_status, fulfillment_type, subtotal_cents, tax_cents, discount_cents, total_cents, deposit_paid_cents, balance_due_cents, notes, pickup_at, created_at, updated_at)
     values
      ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9, $10, $11, $12, $13, $14)`,
    [
      input.orderId,
      input.orderNumber,
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
      input.now,
    ],
  );
}

export async function insertOrderItemRecord(
  input: {
    itemId: string;
    orderId: string;
    productId: string;
    productName: string;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  },
  executor?: DbExecutor,
) {
  await db(executor).query(
    `insert into order_items
      (id, order_id, product_id, product_name_snapshot, unit_price_cents, quantity, line_total_cents)
     values
      ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.itemId,
      input.orderId,
      input.productId,
      input.productName,
      input.unitPriceCents,
      input.quantity,
      input.lineTotalCents,
    ],
  );
}

export async function updateOrderRecord(
  input: {
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
    pickupAt: string | null;
    now: string;
  },
  executor?: DbExecutor,
) {
  await db(executor).query(
    `update orders
       set customer_id = $1,
           status = $2,
           payment_status = $3,
           fulfillment_type = $4,
           subtotal_cents = $5,
           total_cents = $6,
           deposit_paid_cents = $7,
           balance_due_cents = $8,
           notes = $9,
           pickup_at = $10,
           updated_at = $11
     where id = $12`,
    [
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
    ],
  );
}

export async function updateOrderItemRecord(
  input: {
    itemId: string;
    productId: string;
    productName: string;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  },
  executor?: DbExecutor,
) {
  await db(executor).query(
    `update order_items
       set product_id = $1,
           product_name_snapshot = $2,
           unit_price_cents = $3,
           quantity = $4,
           line_total_cents = $5
     where id = $6`,
    [
      input.productId,
      input.productName,
      input.unitPriceCents,
      input.quantity,
      input.lineTotalCents,
      input.itemId,
    ],
  );
}

export async function deleteOrderItemsForOrder(orderId: string, executor?: DbExecutor) {
  await db(executor).query("delete from order_items where order_id = $1", [orderId]);
}

export async function deleteOrderById(orderId: string, executor?: DbExecutor) {
  await db(executor).query("delete from orders where id = $1", [orderId]);
}

export async function purgeOrderRecord(orderId: string, executor?: DbExecutor) {
  await deleteOrderItemsForOrder(orderId, executor);
  await deleteOrderById(orderId, executor);
}

const deriveProductStatus = (stockQuantity: number, currentStatus: string) => {
  if (currentStatus === "ARCHIVED") {
    return "ARCHIVED";
  }

  if (stockQuantity <= 0) {
    return "OUT_OF_STOCK";
  }

  return "ACTIVE";
};

export async function adjustProductStock(
  input: {
    productId: string;
    quantityDelta: number;
    movementType: "SALE" | "CANCELLATION_RESTORE" | "MANUAL_ADJUSTMENT";
    reason: string;
    referenceId: string;
  },
  executor?: DbExecutor,
) {
  const product = await getProductById(input.productId, executor);

  if (!product) {
    throw new Error(`Missing product ${input.productId}`);
  }

  const nextStock = Math.max(product.stock_quantity + input.quantityDelta, 0);
  const nextStatus = deriveProductStatus(nextStock, product.status);
  const now = new Date().toISOString();

  await db(executor).query(
    "update products set stock_quantity = $1, status = $2, updated_at = $3 where id = $4",
    [nextStock, nextStatus, now, input.productId],
  );

  await db(executor).query(
    `insert into inventory_movements
      (id, product_id, type, quantity_delta, reason, reference_type, reference_id, created_at, created_by_id)
     values
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      randomUUID(),
      input.productId,
      input.movementType,
      input.quantityDelta,
      input.reason,
      "APP",
      input.referenceId,
      now,
      "user-admin",
    ],
  );
}
