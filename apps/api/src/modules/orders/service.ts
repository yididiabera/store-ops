import { randomUUID } from "node:crypto";
import { withTransaction } from "../../db";
import {
  adjustProductStock,
  findOrCreateCustomer,
  getAllOrderItems,
  getNextOrderNumber,
  getOrderById,
  getOrderDetailRow,
  getOrderItems,
  getOrdersWithCustomers,
  getProductById,
  getVisibleProducts,
  insertOrderItemRecord,
  insertOrderRecord,
  purgeOrderRecord,
  updateOrderItemRecord,
  updateOrderRecord,
} from "./repository";

const activeOrderStatuses = ["CONFIRMED", "IN_PRODUCTION", "READY", "DELIVERED"] as const;
const orderStatusOptions = ["DRAFT", "CONFIRMED", "IN_PRODUCTION", "READY", "DELIVERED", "CANCELLED"] as const;
const paymentStatusOptions = ["UNPAID", "PARTIALLY_PAID", "PAID"] as const;
const fulfillmentOptions = ["PICKUP", "DELIVERY"] as const;

const formatStatus = (value: string) =>
  value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const toCurrency = (amountInCents: number) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);

const toDateTimeLocalValue = (isoValue: string | null) => {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const isActiveStatus = (status: string) => activeOrderStatuses.includes(status as (typeof activeOrderStatuses)[number]);

const deriveDepositPaid = (totalCents: number, paymentStatus: string) => {
  if (paymentStatus === "PAID") {
    return totalCents;
  }

  if (paymentStatus === "PARTIALLY_PAID") {
    return Math.round(totalCents * 0.5);
  }

  return 0;
};

const formatOrderDate = (value: string, withTime = false) =>
  new Intl.DateTimeFormat("en-US", withTime
    ? {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    : {
        month: "short",
        day: "numeric",
      }).format(new Date(value));

const formatLongDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

type OrderMutationInput = {
  customerName: string;
  customerPhone: string;
  productId: string;
  quantity: number;
  status: string;
  paymentStatus: string;
  fulfillmentType: string;
  pickupAt: string;
  notes: string;
};

function normalizePickupAt(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Pickup time must be a valid date");
  }

  return date.toISOString();
}

function normalizeOrderInput(input: Partial<OrderMutationInput>) {
  const customerName = input.customerName?.trim() ?? "";
  const customerPhone = input.customerPhone?.trim() ?? "";
  const productId = input.productId?.trim() ?? "";
  const quantity = Number(input.quantity);
  const status = input.status?.trim() ?? "";
  const paymentStatus = input.paymentStatus?.trim() ?? "";
  const fulfillmentType = input.fulfillmentType?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";

  if (!customerName) {
    throw new Error("Customer name is required");
  }

  if (!customerPhone) {
    throw new Error("Customer phone is required");
  }

  if (!productId) {
    throw new Error("Product is required");
  }

  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  if (!orderStatusOptions.includes(status as (typeof orderStatusOptions)[number])) {
    throw new Error("A valid order status is required");
  }

  if (!paymentStatusOptions.includes(paymentStatus as (typeof paymentStatusOptions)[number])) {
    throw new Error("A valid payment status is required");
  }

  if (!fulfillmentOptions.includes(fulfillmentType as (typeof fulfillmentOptions)[number])) {
    throw new Error("A valid fulfillment type is required");
  }

  return {
    customerName,
    customerPhone,
    productId,
    quantity: Math.floor(quantity),
    status,
    paymentStatus,
    fulfillmentType,
    pickupAt: normalizePickupAt(input.pickupAt),
    notes,
  };
}

export async function getOrdersPageData() {
  const products = await getVisibleProducts();
  const orders = await getOrdersWithCustomers();
  const items = await getAllOrderItems();

  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items) {
    const current = itemsByOrder.get(item.order_id) ?? [];
    current.push(item);
    itemsByOrder.set(item.order_id, current);
  }

  const orderRows = orders.map((order) => {
    const orderItem = (itemsByOrder.get(order.id) ?? [])[0];

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      status: order.status,
      paymentStatus: order.payment_status,
      fulfillmentType: order.fulfillment_type,
      total: toCurrency(order.total_cents),
      deposit: toCurrency(order.deposit_paid_cents),
      balanceDue: toCurrency(order.balance_due_cents),
      createdAt: formatOrderDate(order.created_at),
      pickupAt: order.pickup_at ? formatOrderDate(order.pickup_at, true) : "Schedule pending",
      pickupAtValue: toDateTimeLocalValue(order.pickup_at),
      notes: order.notes ?? "",
      productId: orderItem?.product_id ?? "",
      productName: orderItem?.product_name_snapshot ?? "Custom order",
      quantity: orderItem?.quantity ?? 1,
      itemSummary: orderItem?.product_name_snapshot ?? "Custom order",
      itemCount: orderItem?.quantity ?? 0,
    };
  });

  return {
    metrics: [
      {
        label: "Orders",
        value: orderRows.length.toString(),
        note: "Total",
      },
      {
        label: "Active",
        value: orderRows.filter((order) => ["CONFIRMED", "IN_PRODUCTION", "READY"].includes(order.status)).length.toString(),
        note: "In progress",
      },
      {
        label: "Paid in full",
        value: orderRows.filter((order) => order.paymentStatus === "PAID").length.toString(),
        note: "Settled",
      },
      {
        label: "Drafts",
        value: orderRows.filter((order) => order.status === "DRAFT").length.toString(),
        note: "Unconfirmed",
      },
    ],
    options: {
      products: products
        .filter((product) => product.status !== "ARCHIVED" && product.stock_quantity > 0)
        .map((product) => ({
          id: product.id,
          name: product.name,
          stockQuantity: product.stock_quantity,
          price: toCurrency(product.price_cents),
          priceValue: product.price_cents / 100,
          status: product.status,
        })),
      orderStatuses: [...orderStatusOptions],
      paymentStatuses: [...paymentStatusOptions],
      fulfillmentTypes: [...fulfillmentOptions],
    },
    orders: orderRows,
  };
}

export async function getOrderDetailPageData(orderId: string) {
  const order = await getOrderDetailRow(orderId);

  if (!order) {
    return null;
  }

  const items = await getOrderItems(orderId);

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    status: formatStatus(order.status),
    paymentStatus: formatStatus(order.payment_status),
    fulfillmentType: formatStatus(order.fulfillment_type),
    subtotal: toCurrency(order.subtotal_cents),
    total: toCurrency(order.total_cents),
    depositPaid: toCurrency(order.deposit_paid_cents),
    balanceDue: toCurrency(order.balance_due_cents),
    createdAt: formatLongDate(order.created_at),
    updatedAt: formatLongDate(order.updated_at),
    pickupAt: order.pickup_at ? formatLongDate(order.pickup_at) : "Schedule pending",
    notes: order.notes?.trim() || "No notes added",
    items: items.map((item, index) => ({
      id: item.id,
      lineNumber: index + 1,
      productName: item.product_name_snapshot,
      quantity: item.quantity,
      unitPrice: toCurrency(item.unit_price_cents),
      lineTotal: toCurrency(item.line_total_cents),
    })),
  };
}

export async function createOrder(input: Partial<OrderMutationInput>) {
  const normalized = normalizeOrderInput(input);

  return withTransaction(async (client) => {
    const product = await getProductById(normalized.productId, client);

    if (!product) {
      throw new Error("Product not found");
    }

    const quantity = Math.max(1, Math.min(normalized.quantity, Math.max(product.stock_quantity, 1)));
    const customerId = await findOrCreateCustomer(normalized.customerName, normalized.customerPhone, client);
    const orderId = randomUUID();
    const itemId = randomUUID();
    const unitPriceCents = product.price_cents;
    const subtotalCents = unitPriceCents * quantity;
    const totalCents = subtotalCents;
    const depositPaidCents = deriveDepositPaid(totalCents, normalized.paymentStatus);
    const balanceDueCents = Math.max(totalCents - depositPaidCents, 0);
    const now = new Date().toISOString();
    const orderNumber = await getNextOrderNumber(client);

    await insertOrderRecord({
      orderId,
      orderNumber,
      customerId,
      status: normalized.status,
      paymentStatus: normalized.paymentStatus,
      fulfillmentType: normalized.fulfillmentType,
      subtotalCents,
      totalCents,
      depositPaidCents,
      balanceDueCents,
      notes: normalized.notes,
      pickupAt: normalized.pickupAt,
      now,
    }, client);

    await insertOrderItemRecord({
      itemId,
      orderId,
      productId: product.id,
      productName: product.name,
      unitPriceCents,
      quantity,
      lineTotalCents: subtotalCents,
    }, client);

    if (isActiveStatus(normalized.status)) {
      await adjustProductStock({
        productId: product.id,
        quantityDelta: -quantity,
        movementType: "SALE",
        reason: "Stock deducted from order creation",
        referenceId: orderId,
      }, client);
    }

    return {
      id: orderId,
      orderNumber,
      message: "Order created",
    };
  });
}

export async function updateOrder(orderId: string, input: Partial<OrderMutationInput>) {
  const normalized = normalizeOrderInput(input);

  return withTransaction(async (client) => {
    const order = await getOrderById(orderId, client);

    if (!order) {
      throw new Error("Order not found");
    }

    const currentItem = (await getOrderItems(orderId, client))[0];

    if (!currentItem) {
      throw new Error("Order item not found");
    }

    if (isActiveStatus(order.status)) {
      await adjustProductStock({
        productId: currentItem.product_id,
        quantityDelta: currentItem.quantity,
        movementType: "CANCELLATION_RESTORE",
        reason: "Stock restored before order update",
        referenceId: orderId,
      }, client);
    }

    const customerId = await findOrCreateCustomer(normalized.customerName, normalized.customerPhone, client);
    const nextProduct = await getProductById(normalized.productId, client);

    if (!nextProduct) {
      throw new Error("Product not found");
    }

    const quantity = Math.max(1, Math.min(normalized.quantity, Math.max(nextProduct.stock_quantity, 1)));
    const subtotalCents = nextProduct.price_cents * quantity;
    const totalCents = subtotalCents;
    const depositPaidCents = deriveDepositPaid(totalCents, normalized.paymentStatus);
    const balanceDueCents = Math.max(totalCents - depositPaidCents, 0);
    const now = new Date().toISOString();

    await updateOrderRecord({
      orderId,
      customerId,
      status: normalized.status,
      paymentStatus: normalized.paymentStatus,
      fulfillmentType: normalized.fulfillmentType,
      subtotalCents,
      totalCents,
      depositPaidCents,
      balanceDueCents,
      notes: normalized.notes,
      pickupAt: normalized.pickupAt,
      now,
    }, client);

    await updateOrderItemRecord({
      itemId: currentItem.id,
      productId: nextProduct.id,
      productName: nextProduct.name,
      unitPriceCents: nextProduct.price_cents,
      quantity,
      lineTotalCents: subtotalCents,
    }, client);

    if (isActiveStatus(normalized.status)) {
      await adjustProductStock({
        productId: nextProduct.id,
        quantityDelta: -quantity,
        movementType: "SALE",
        reason: "Stock deducted after order update",
        referenceId: orderId,
      }, client);
    }

    return {
      id: orderId,
      message: "Order updated",
    };
  });
}

export async function deleteOrder(orderId: string) {
  return withTransaction(async (client) => {
    const order = await getOrderById(orderId, client);

    if (!order) {
      return {
        id: orderId,
        message: "Order already removed",
      };
    }

    const items = await getOrderItems(orderId, client);

    if (isActiveStatus(order.status)) {
      for (const item of items) {
        await adjustProductStock({
          productId: item.product_id,
          quantityDelta: item.quantity,
          movementType: "CANCELLATION_RESTORE",
          reason: "Stock restored after order deletion",
          referenceId: orderId,
        }, client);
      }
    }

    await purgeOrderRecord(orderId, client);

    return {
      id: orderId,
      message: "Order deleted",
    };
  });
}
