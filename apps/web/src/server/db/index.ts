import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const databaseDir = path.join(process.cwd(), "data");
const databasePath = path.join(databaseDir, "veloura-cakes.db");

const globalForDb = globalThis as unknown as {
  bakeryDb?: DatabaseSync;
  bakeryDbInitialized?: boolean;
};

type SeedCustomer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  notes: string;
};

type SeedProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  priceCents: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
};

type SeedOrder = {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  paymentStatus: string;
  fulfillmentType: string;
  createdAt: string;
  pickupAt: string;
  notes: string | null;
  taxCents: number;
  discountCents: number;
  depositPaidCents: number;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
  }>;
};

const currency = (amount: number) => amount * 100;

const shiftDate = (base: Date, dayOffset: number, hour: number, minute: number) => {
  const date = new Date(base);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

function buildSeedData(baseDate: Date) {
  const admin = {
    id: "user-admin",
    name: "Veloura Admin",
    email: "admin@velouracakes.demo",
    role: "ADMIN",
  };

  const customers: SeedCustomer[] = [
    ["cust-001", "Meklit Desta", "meklit@example.com", "+251911000101", "Prefers delicate floral finishes"],
    ["cust-002", "Ruth Daniel", "ruth@example.com", "+251911000102", "Office catering repeat client"],
    ["cust-003", "Abel Gebre", "abel@example.com", "+251911000103", "Weekend pickup customer"],
    ["cust-004", "Nardos Solomon", "nardos@example.com", "+251911000104", "Wedding event planner"],
    ["cust-005", "Nahom Bekele", "nahom@example.com", "+251911000105", "Usually orders birthday cakes"],
  ].map((row): SeedCustomer => {
    const [id, fullName, email, phone, notes] = row as [
      string,
      string,
      string,
      string,
      string,
    ];

    return {
      id,
      fullName,
      email,
      phone,
      notes,
    };
  });

  const products: SeedProduct[] = [
    ["prod-001", "Classic Chocolate Signature", "classic-chocolate-signature", "SIGNATURE_CAKE", "Deep cocoa sponge with silk ganache and clean boutique finishing.", currency(42), 18, 8, "ACTIVE"],
    ["prod-002", "Blush Bloom Celebration", "blush-bloom-celebration", "BIRTHDAY_CAKE", "Vanilla cake dressed with blush rosettes for premium parties.", currency(55), 6, 8, "ACTIVE"],
    ["prod-003", "Vanilla Berry Mini Set", "vanilla-berry-mini-set", "CUPCAKE", "Mini cakes with berry filling for corporate and family events.", currency(22), 22, 10, "ACTIVE"],
    ["prod-004", "Pearl Wedding Tier", "pearl-wedding-tier", "WEDDING_CAKE", "Elegant multi-tier celebration cake with pearl and floral work.", currency(230), 2, 4, "ACTIVE"],
    ["prod-005", "Pistachio Rose Slice", "pistachio-rose-slice", "SEASONAL", "Seasonal slice with pistachio cream and restrained rose aroma.", currency(18), 0, 4, "OUT_OF_STOCK"],
  ].map((row): SeedProduct => {
    const [
      id,
      name,
      slug,
      category,
      description,
      priceCents,
      stockQuantity,
      lowStockThreshold,
      status,
    ] = row as [string, string, string, string, string, number, number, number, string];

    return {
      id,
      name,
      slug,
      category,
      description,
      priceCents,
      stockQuantity,
      lowStockThreshold,
      status,
    };
  });

  const orders: SeedOrder[] = [
    ["ord-2041", "VC-2041", "cust-001", "IN_PRODUCTION", "PARTIALLY_PAID", "PICKUP", shiftDate(baseDate, 0, 9, 15), shiftDate(baseDate, 0, 16, 30), "Pearls, blush florals, smooth buttercream finish.", currency(10), 0, currency(120), [["item-2041-1", "prod-002", 4]]],
    ["ord-2040", "VC-2040", "cust-002", "READY", "PAID", "DELIVERY", shiftDate(baseDate, 0, 8, 20), shiftDate(baseDate, 0, 13, 0), "Office lobby drop-off.", currency(4), 0, currency(88), [["item-2040-1", "prod-001", 2]]],
    ["ord-2039", "VC-2039", "cust-003", "CONFIRMED", "UNPAID", "PICKUP", shiftDate(baseDate, 0, 11, 10), shiftDate(baseDate, 1, 10, 0), "Birthday candles requested.", 0, 0, 0, [["item-2039-1", "prod-003", 3]]],
    ["ord-2038", "VC-2038", "cust-004", "DELIVERED", "PAID", "DELIVERY", shiftDate(baseDate, -1, 14, 0), shiftDate(baseDate, 0, 14, 0), "Wedding stage delivery with careful floral handling.", currency(12), 0, currency(242), [["item-2038-1", "prod-004", 1]]],
    ["ord-2037", "VC-2037", "cust-005", "DRAFT", "UNPAID", "PICKUP", shiftDate(baseDate, 0, 12, 45), shiftDate(baseDate, 2, 10, 0), "Draft custom order awaiting final design approval.", 0, 0, 0, [["item-2037-1", "prod-001", 1]]],
  ].map((row): SeedOrder => {
    const [
      id,
      orderNumber,
      customerId,
      status,
      paymentStatus,
      fulfillmentType,
      createdAt,
      pickupAt,
      notes,
      taxCents,
      discountCents,
      depositPaidCents,
      items,
    ] = row as [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string | null,
      number,
      number,
      number,
      Array<[string, string, number]>,
    ];

    return {
      id,
      orderNumber,
      customerId,
      status,
      paymentStatus,
      fulfillmentType,
      createdAt,
      pickupAt,
      notes,
      taxCents,
      discountCents,
      depositPaidCents,
      items: items.map(([itemId, productId, quantity]) => ({
        id: itemId,
        productId,
        quantity,
      })),
    };
  });

  return { admin, customers, products, orders };
}

function ensureSchema(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      stock_quantity INTEGER NOT NULL,
      low_stock_threshold INTEGER NOT NULL,
      status TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      fulfillment_type TEXT NOT NULL,
      subtotal_cents INTEGER NOT NULL,
      tax_cents INTEGER NOT NULL DEFAULT 0,
      discount_cents INTEGER NOT NULL DEFAULT 0,
      total_cents INTEGER NOT NULL,
      deposit_paid_cents INTEGER NOT NULL DEFAULT 0,
      balance_due_cents INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      pickup_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name_snapshot TEXT NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      line_total_cents INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity_delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      created_at TEXT NOT NULL,
      created_by_id TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
}

function seedDatabase(db: DatabaseSync) {
  const { admin, customers, products, orders } = buildSeedData(new Date());
  const productMap = new Map(products.map((product) => [product.id, product]));

  db.exec("BEGIN TRANSACTION");

  try {
    db.prepare("DELETE FROM inventory_movements").run();
    db.prepare("DELETE FROM order_items").run();
    db.prepare("DELETE FROM orders").run();
    db.prepare("DELETE FROM customers").run();
    db.prepare("DELETE FROM products").run();
    db.prepare("DELETE FROM users").run();

    db.prepare("INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)").run(
      admin.id,
      admin.name,
      admin.email,
      admin.role,
    );

    const insertCustomer = db.prepare(
      "INSERT INTO customers (id, full_name, email, phone, notes) VALUES (?, ?, ?, ?, ?)",
    );
    customers.forEach((customer) => {
      insertCustomer.run(customer.id, customer.fullName, customer.email, customer.phone, customer.notes);
    });

    const insertProduct = db.prepare(
      "INSERT INTO products (id, name, slug, category, description, price_cents, stock_quantity, low_stock_threshold, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    products.forEach((product) => {
      insertProduct.run(
        product.id,
        product.name,
        product.slug,
        product.category,
        product.description,
        product.priceCents,
        product.stockQuantity,
        product.lowStockThreshold,
        product.status,
        null,
      );
    });

    const insertOrder = db.prepare(
      "INSERT INTO orders (id, order_number, customer_id, status, payment_status, fulfillment_type, subtotal_cents, tax_cents, discount_cents, total_cents, deposit_paid_cents, balance_due_cents, notes, pickup_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const insertItem = db.prepare(
      "INSERT INTO order_items (id, order_id, product_id, product_name_snapshot, unit_price_cents, quantity, line_total_cents) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    const insertMovement = db.prepare(
      "INSERT INTO inventory_movements (id, product_id, type, quantity_delta, reason, reference_type, reference_id, created_at, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );

    const saleQuantities = new Map<string, number>();

    orders.forEach((order) => {
      const detailedItems = order.items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Missing product ${item.productId}`);
        }

        if (["CONFIRMED", "IN_PRODUCTION", "READY", "DELIVERED"].includes(order.status)) {
          saleQuantities.set(item.productId, (saleQuantities.get(item.productId) ?? 0) + item.quantity);
        }

        return {
          ...item,
          name: product.name,
          unitPriceCents: product.priceCents,
          lineTotalCents: product.priceCents * item.quantity,
        };
      });

      const subtotalCents = detailedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
      const totalCents = subtotalCents + order.taxCents - order.discountCents;
      const balanceDueCents = Math.max(totalCents - order.depositPaidCents, 0);

      insertOrder.run(
        order.id,
        order.orderNumber,
        order.customerId,
        order.status,
        order.paymentStatus,
        order.fulfillmentType,
        subtotalCents,
        order.taxCents,
        order.discountCents,
        totalCents,
        order.depositPaidCents,
        balanceDueCents,
        order.notes,
        order.pickupAt,
        order.createdAt,
      );

      detailedItems.forEach((item) => {
        insertItem.run(
          item.id,
          order.id,
          item.productId,
          item.name,
          item.unitPriceCents,
          item.quantity,
          item.lineTotalCents,
        );
      });
    });

    products.forEach((product, index) => {
      const sold = saleQuantities.get(product.id) ?? 0;

      insertMovement.run(
        `move-restock-${index + 1}`,
        product.id,
        "RESTOCK",
        product.stockQuantity + sold,
        "Initial seeded stock load",
        "SEED",
        product.slug,
        shiftDate(new Date(), -10, 8, 0),
        admin.id,
      );

      insertMovement.run(
        `move-sale-${index + 1}`,
        product.id,
        "SALE",
        -sold,
        "Sales reflected from seeded orders",
        "ORDER_BATCH",
        product.slug,
        shiftDate(new Date(), -1, 19, 0),
        admin.id,
      );
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function getDatabase() {
  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
  }

  if (!globalForDb.bakeryDb) {
    globalForDb.bakeryDb = new DatabaseSync(databasePath);
  }

  return globalForDb.bakeryDb;
}

export function initializeDatabase(force = false) {
  const db = getDatabase();
  ensureSchema(db);

  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get<{ count: number }>();

  if (force || userCount.count === 0) {
    seedDatabase(db);
  }

  globalForDb.bakeryDbInitialized = true;
  return db;
}

export function getDb() {
  if (!globalForDb.bakeryDbInitialized) {
    initializeDatabase();
  }

  return getDatabase();
}

export function getDatabasePath() {
  return databasePath;
}
