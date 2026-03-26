import { randomUUID } from "node:crypto";
import { purgeOrderRecord } from "@/server/orders/repository";
import { formatCategory, toCurrency } from "@/server/shared/format";
import {
  productCategoryOptions,
  productStatusOptions,
} from "@/server/shared/constants";
import {
  adjustProductStock,
  deleteInventoryMovementsForProduct,
  deleteProductRecord,
  deriveProductStatus,
  ensureUniqueSlug,
  getAllProducts,
  getLinkedOrderCounts,
  getLinkedOrderIdsForProduct,
  getProductById,
  getProductSales,
  insertInventoryMovement,
  insertProduct,
  updateProductRecord,
} from "./repository";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

export async function getProductsPageData() {
  const products = getAllProducts();
  const sales = getProductSales();
  const linkedOrders = getLinkedOrderCounts();

  const salesByProduct = new Map(sales.map((row) => [row.product_id, row.sold_units ?? 0]));
  const ordersByProduct = new Map(linkedOrders.map((row) => [row.product_id, row.order_count ?? 0]));

  const productCards = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: formatCategory(product.category),
    rawCategory: product.category,
    description: product.description,
    price: toCurrency(product.price_cents),
    priceValue: (product.price_cents / 100).toString(),
    stockQuantity: product.stock_quantity,
    lowStockThreshold: product.low_stock_threshold,
    status:
      product.status === "OUT_OF_STOCK"
        ? "Out of Stock"
        : product.stock_quantity <= product.low_stock_threshold
          ? "Low Stock"
          : product.status === "ARCHIVED"
            ? "Archived"
            : "Active",
    rawStatus: product.status,
    soldUnits: salesByProduct.get(product.id) ?? 0,
    linkedOrderCount: ordersByProduct.get(product.id) ?? 0,
  }));

  const bestSeller = [...productCards].sort((a, b) => b.soldUnits - a.soldUnits)[0];

  return {
    metrics: [
      { label: "Catalog", value: productCards.length.toString(), note: "Products" },
      {
        label: "Stock",
        value: productCards.reduce((sum, product) => sum + product.stockQuantity, 0).toString(),
        note: "Units",
      },
      {
        label: "Low",
        value: productCards.filter((product) => product.stockQuantity <= product.lowStockThreshold).length.toString(),
        note: "Restock",
      },
      { label: "Best Seller", value: bestSeller?.name ?? "No sales yet", note: "Top item" },
    ],
    products: productCards,
  };
}

export async function createProduct(input: {
  name: string;
  category: string;
  description: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
}) {
  const id = randomUUID();
  const slug = ensureUniqueSlug(slugify(input.name));
  const now = new Date().toISOString();
  const priceCents = Math.max(Math.round(input.price * 100), 0);
  const stockQuantity = Math.max(Math.floor(input.stockQuantity), 0);
  const lowStockThreshold = Math.max(Math.floor(input.lowStockThreshold), 0);
  const status = deriveProductStatus(stockQuantity, input.status);

  insertProduct({
    id,
    name: input.name,
    slug,
    category: input.category,
    description: input.description,
    priceCents,
    stockQuantity,
    lowStockThreshold,
    status,
    now,
  });

  insertInventoryMovement({
    productId: id,
    type: "RESTOCK",
    quantityDelta: stockQuantity,
    reason: "Initial stock entered from product screen",
    referenceType: "PRODUCT_CREATE",
    referenceId: id,
    createdAt: now,
  });
}

export async function updateProduct(input: {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
}) {
  const existing = getProductById(input.id);

  if (!existing) {
    throw new Error("Product not found");
  }

  const now = new Date().toISOString();
  const nextStock = Math.max(Math.floor(input.stockQuantity), 0);
  const nextThreshold = Math.max(Math.floor(input.lowStockThreshold), 0);
  const nextPrice = Math.max(Math.round(input.price * 100), 0);
  const nextStatus = deriveProductStatus(nextStock, input.status);
  const nextSlug = ensureUniqueSlug(slugify(input.name), input.id);

  updateProductRecord({
    id: input.id,
    name: input.name,
    slug: nextSlug,
    category: input.category,
    description: input.description,
    priceCents: nextPrice,
    stockQuantity: nextStock,
    lowStockThreshold: nextThreshold,
    status: nextStatus,
    now,
  });

  if (nextStock !== existing.stock_quantity) {
    insertInventoryMovement({
      productId: input.id,
      type: "MANUAL_ADJUSTMENT",
      quantityDelta: nextStock - existing.stock_quantity,
      reason: "Stock edited from product screen",
      referenceType: "PRODUCT_UPDATE",
      referenceId: input.id,
      createdAt: now,
    });
  }
}

export async function deleteProduct(productId: string) {
  const linkedOrders = getLinkedOrderIdsForProduct(productId);

  linkedOrders.forEach((order) => {
    purgeOrderRecord(order.order_id);
  });

  deleteInventoryMovementsForProduct(productId);
  deleteProductRecord(productId);
}

export {
  adjustProductStock,
  productCategoryOptions,
  productStatusOptions,
};
