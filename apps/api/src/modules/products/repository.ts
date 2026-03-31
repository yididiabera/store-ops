import { randomUUID } from "node:crypto";
import { getPool } from "../../db";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price_cents: number;
  stock_quantity: number;
  low_stock_threshold: number;
  status: string;
  updated_at: string;
};

export type ProductSaleRow = {
  product_id: string;
  sold_units: string | number | null;
};

export async function getAllProducts() {
  const pool = getPool();
  const result = await pool.query<ProductRow>(
    "select * from products order by updated_at desc, name asc",
  );
  return result.rows;
}

export async function getProductById(productId: string) {
  const pool = getPool();
  const result = await pool.query<ProductRow>(
    "select * from products where id = $1",
    [productId],
  );
  return result.rows[0] ?? null;
}

export async function getProductSales() {
  const pool = getPool();
  const result = await pool.query<ProductSaleRow>(`
    select
      oi.product_id,
      sum(oi.quantity) as sold_units
    from order_items oi
    inner join orders o on o.id = oi.order_id
    where o.status in ('CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED')
    group by oi.product_id
  `);

  return result.rows;
}

export async function getLinkedOrderCounts() {
  const pool = getPool();
  const result = await pool.query<{ product_id: string; order_count: string | number | null }>(`
    select
      oi.product_id,
      count(*) as order_count
    from order_items oi
    group by oi.product_id
  `);

  return result.rows;
}

export async function ensureUniqueSlug(baseSlug: string, excludeId?: string) {
  const pool = getPool();
  let rootSlug = baseSlug || `product-${randomUUID().slice(0, 6)}`;
  let slug = rootSlug;
  let counter = 2;

  while (true) {
    const existing = await pool.query<{ id: string }>(
      "select id from products where slug = $1",
      [slug],
    );

    const row = existing.rows[0];
    if (!row || row.id === excludeId) {
      return slug;
    }

    slug = `${rootSlug}-${counter}`;
    counter += 1;
  }
}

export async function insertProduct(input: {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  priceCents: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
  now: string;
}) {
  const pool = getPool();
  await pool.query(
    `insert into products
      (id, name, slug, category, description, price_cents, stock_quantity, low_stock_threshold, status, image_url, created_at, updated_at)
     values
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      input.id,
      input.name,
      input.slug,
      input.category,
      input.description,
      input.priceCents,
      input.stockQuantity,
      input.lowStockThreshold,
      input.status,
      null,
      input.now,
      input.now,
    ],
  );
}

export async function updateProductRecord(input: {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  priceCents: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
  now: string;
}) {
  const pool = getPool();
  await pool.query(
    `update products
       set name = $1,
           slug = $2,
           category = $3,
           description = $4,
           price_cents = $5,
           stock_quantity = $6,
           low_stock_threshold = $7,
           status = $8,
           updated_at = $9
     where id = $10`,
    [
      input.name,
      input.slug,
      input.category,
      input.description,
      input.priceCents,
      input.stockQuantity,
      input.lowStockThreshold,
      input.status,
      input.now,
      input.id,
    ],
  );
}

export async function insertInventoryMovement(input: {
  productId: string;
  type: string;
  quantityDelta: number;
  reason: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
}) {
  const pool = getPool();
  await pool.query(
    `insert into inventory_movements
      (id, product_id, type, quantity_delta, reason, reference_type, reference_id, created_at, created_by_id)
     values
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      randomUUID(),
      input.productId,
      input.type,
      input.quantityDelta,
      input.reason,
      input.referenceType,
      input.referenceId,
      input.createdAt,
      "user-admin",
    ],
  );
}

export async function getLinkedOrderIdsForProduct(productId: string) {
  const pool = getPool();
  const result = await pool.query<{ order_id: string }>(
    "select distinct order_id from order_items where product_id = $1",
    [productId],
  );
  return result.rows;
}

export async function deleteOrdersByIds(orderIds: string[]) {
  if (orderIds.length === 0) {
    return;
  }

  const pool = getPool();
  await pool.query("delete from orders where id = any($1::text[])", [orderIds]);
}

export async function deleteProductRecord(productId: string) {
  const pool = getPool();
  await pool.query("delete from products where id = $1", [productId]);
}
