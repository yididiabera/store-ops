import { randomUUID } from "node:crypto";
import {
  deleteOrdersByIds,
  deleteProductRecord,
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

const productCategoryOptions = [
  "SIGNATURE_CAKE",
  "BIRTHDAY_CAKE",
  "WEDDING_CAKE",
  "CUPCAKE",
  "CHEESECAKE",
  "SEASONAL",
] as const;

const productStatusOptions = ["ACTIVE", "OUT_OF_STOCK", "ARCHIVED"] as const;

const formatCategory = (value: string) =>
  value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const toCurrency = (amountInCents: number) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

const toNumber = (value: string | number | null | undefined) => Number(value ?? 0);

const deriveProductStatus = (stockQuantity: number, currentStatus: string) => {
  if (currentStatus === "ARCHIVED") {
    return "ARCHIVED";
  }

  if (stockQuantity <= 0) {
    return "OUT_OF_STOCK";
  }

  return "ACTIVE";
};

type ProductMutationInput = {
  name: string;
  category: string;
  description: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
};

function normalizeProductInput(input: Partial<ProductMutationInput>) {
  const name = input.name?.trim() ?? "";
  const category = input.category?.trim() ?? "";
  const description = input.description?.trim() ?? "";
  const price = Number(input.price);
  const stockQuantity = Number(input.stockQuantity);
  const lowStockThreshold = Number(input.lowStockThreshold);
  const status = input.status?.trim() ?? "";

  if (!name) {
    throw new Error("Product name is required");
  }

  if (!category || !productCategoryOptions.includes(category as (typeof productCategoryOptions)[number])) {
    throw new Error("A valid product category is required");
  }

  if (!status || !productStatusOptions.includes(status as (typeof productStatusOptions)[number])) {
    throw new Error("A valid product status is required");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a valid non-negative number");
  }

  if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
    throw new Error("Stock quantity must be a valid non-negative number");
  }

  if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) {
    throw new Error("Low stock threshold must be a valid non-negative number");
  }

  return {
    name,
    category,
    description,
    price,
    stockQuantity: Math.floor(stockQuantity),
    lowStockThreshold: Math.floor(lowStockThreshold),
    status,
  };
}

export async function getProductsPageData() {
  const products = await getAllProducts();
  const sales = await getProductSales();
  const linkedOrders = await getLinkedOrderCounts();

  const salesByProduct = new Map(sales.map((row) => [row.product_id, toNumber(row.sold_units)]));
  const ordersByProduct = new Map(
    linkedOrders.map((row) => [row.product_id, toNumber(row.order_count)]),
  );

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
    options: {
      categories: [...productCategoryOptions],
      statuses: [...productStatusOptions],
    },
    products: productCards,
  };
}

export async function createProduct(input: Partial<ProductMutationInput>) {
  const normalized = normalizeProductInput(input);
  const id = randomUUID();
  const slug = await ensureUniqueSlug(slugify(normalized.name));
  const now = new Date().toISOString();
  const priceCents = Math.max(Math.round(normalized.price * 100), 0);
  const status = deriveProductStatus(normalized.stockQuantity, normalized.status);

  await insertProduct({
    id,
    name: normalized.name,
    slug,
    category: normalized.category,
    description: normalized.description,
    priceCents,
    stockQuantity: normalized.stockQuantity,
    lowStockThreshold: normalized.lowStockThreshold,
    status,
    now,
  });

  await insertInventoryMovement({
    productId: id,
    type: "RESTOCK",
    quantityDelta: normalized.stockQuantity,
    reason: "Initial stock entered from product screen",
    referenceType: "PRODUCT_CREATE",
    referenceId: id,
    createdAt: now,
  });

  return {
    id,
    message: "Product created",
  };
}

export async function updateProduct(productId: string, input: Partial<ProductMutationInput>) {
  const existing = await getProductById(productId);

  if (!existing) {
    throw new Error("Product not found");
  }

  const normalized = normalizeProductInput(input);
  const now = new Date().toISOString();
  const nextPrice = Math.max(Math.round(normalized.price * 100), 0);
  const nextStatus = deriveProductStatus(normalized.stockQuantity, normalized.status);
  const nextSlug = await ensureUniqueSlug(slugify(normalized.name), productId);

  await updateProductRecord({
    id: productId,
    name: normalized.name,
    slug: nextSlug,
    category: normalized.category,
    description: normalized.description,
    priceCents: nextPrice,
    stockQuantity: normalized.stockQuantity,
    lowStockThreshold: normalized.lowStockThreshold,
    status: nextStatus,
    now,
  });

  if (normalized.stockQuantity !== existing.stock_quantity) {
    await insertInventoryMovement({
      productId,
      type: "MANUAL_ADJUSTMENT",
      quantityDelta: normalized.stockQuantity - existing.stock_quantity,
      reason: "Stock edited from product screen",
      referenceType: "PRODUCT_UPDATE",
      referenceId: productId,
      createdAt: now,
    });
  }

  return {
    id: productId,
    message: "Product updated",
  };
}

export async function deleteProduct(productId: string) {
  const existing = await getProductById(productId);

  if (!existing) {
    throw new Error("Product not found");
  }

  const linkedOrders = await getLinkedOrderIdsForProduct(productId);
  await deleteOrdersByIds(linkedOrders.map((order) => order.order_id));
  await deleteProductRecord(productId);

  return {
    id: productId,
    message: "Product deleted",
  };
}
