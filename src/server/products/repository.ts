import { randomUUID } from "node:crypto";
import { getDb } from "@/server/db";
import type { ProductRow, ProductSaleRow } from "@/server/shared/types";

export const deriveProductStatus = (stockQuantity: number, currentStatus: string) => {
  if (currentStatus === "ARCHIVED") {
    return "ARCHIVED";
  }

  if (stockQuantity <= 0) {
    return "OUT_OF_STOCK";
  }

  return "ACTIVE";
};

export function getAllProducts() {
  const db = getDb();
  return db.prepare("SELECT * FROM products ORDER BY updated_at DESC, name ASC").all<ProductRow>();
}

export function getVisibleProducts() {
  const db = getDb();
  return db
    .prepare("SELECT * FROM products WHERE status != 'ARCHIVED' ORDER BY name ASC")
    .all<ProductRow>();
}

export function getProductById(productId: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM products WHERE id = ?").get<ProductRow>(productId);
}

export function getProductSales() {
  const db = getDb();
  return db.prepare(`
    SELECT
      oi.product_id,
      SUM(oi.quantity) AS sold_units
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED')
    GROUP BY oi.product_id
  `).all<ProductSaleRow>();
}

export function getLinkedOrderCounts() {
  const db = getDb();
  return db.prepare(`
    SELECT
      oi.product_id,
      COUNT(*) AS order_count
    FROM order_items oi
    GROUP BY oi.product_id
  `).all<{ product_id: string; order_count: number }>();
}

export function ensureUniqueSlug(baseSlug: string, excludeId?: string) {
  const db = getDb();
  let slug = baseSlug || `product-${randomUUID().slice(0, 6)}`;
  let counter = 2;

  while (true) {
    const existing = db.prepare("SELECT id FROM products WHERE slug = ?").get<{ id: string }>(slug);

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export function insertProduct(input: {
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
  const db = getDb();
  db.prepare(
    "INSERT INTO products (id, name, slug, category, description, price_cents, stock_quantity, low_stock_threshold, status, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
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
  );
}

export function updateProductRecord(input: {
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
  const db = getDb();
  db.prepare(
    "UPDATE products SET name = ?, slug = ?, category = ?, description = ?, price_cents = ?, stock_quantity = ?, low_stock_threshold = ?, status = ?, updated_at = ? WHERE id = ?",
  ).run(
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
  );
}

export function insertInventoryMovement(input: {
  productId: string;
  type: string;
  quantityDelta: number;
  reason: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
}) {
  const db = getDb();
  db.prepare(
    "INSERT INTO inventory_movements (id, product_id, type, quantity_delta, reason, reference_type, reference_id, created_at, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    randomUUID(),
    input.productId,
    input.type,
    input.quantityDelta,
    input.reason,
    input.referenceType,
    input.referenceId,
    input.createdAt,
    "user-admin",
  );
}

export function adjustProductStock(input: {
  productId: string;
  quantityDelta: number;
  movementType: "SALE" | "CANCELLATION_RESTORE" | "MANUAL_ADJUSTMENT";
  reason: string;
  referenceId: string;
}) {
  const product = getProductById(input.productId);

  if (!product) {
    throw new Error(`Missing product ${input.productId}`);
  }

  const db = getDb();
  const nextStock = Math.max(product.stock_quantity + input.quantityDelta, 0);
  const nextStatus = deriveProductStatus(nextStock, product.status);
  const now = new Date().toISOString();

  db.prepare(
    "UPDATE products SET stock_quantity = ?, status = ?, updated_at = ? WHERE id = ?",
  ).run(nextStock, nextStatus, now, input.productId);

  insertInventoryMovement({
    productId: input.productId,
    type: input.movementType,
    quantityDelta: input.quantityDelta,
    reason: input.reason,
    referenceType: "APP",
    referenceId: input.referenceId,
    createdAt: now,
  });
}

export function getLinkedOrderIdsForProduct(productId: string) {
  const db = getDb();
  return db
    .prepare("SELECT DISTINCT order_id FROM order_items WHERE product_id = ?")
    .all<{ order_id: string }>(productId);
}

export function deleteInventoryMovementsForProduct(productId: string) {
  const db = getDb();
  db.prepare("DELETE FROM inventory_movements WHERE product_id = ?").run(productId);
}

export function deleteProductRecord(productId: string) {
  const db = getDb();
  db.prepare("DELETE FROM products WHERE id = ?").run(productId);
}
