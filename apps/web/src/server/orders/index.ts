import { randomUUID } from "node:crypto";
import { adjustProductStock } from "@/server/products";
import { getProductById, getVisibleProducts } from "@/server/products/repository";
import { activeOrderStatuses, fulfillmentOptions, orderStatusOptions, paymentStatusOptions } from "@/server/shared/constants";
import { formatStatus, toCurrency, toDateTimeLocalValue } from "@/server/shared/format";
import {
  findOrCreateCustomer,
  getAllOrderItems,
  getNextOrderNumber,
  getOrderById,
  getOrderDetailRow,
  getOrderItems,
  getOrdersWithCustomers,
  insertOrderItemRecord,
  insertOrderRecord,
  purgeOrderRecord,
  updateOrderItemRecord,
  updateOrderRecord,
} from "./repository";

const deriveDepositPaid = (totalCents: number, paymentStatus: string) => {
  if (paymentStatus === "PAID") {
    return totalCents;
  }

  if (paymentStatus === "PARTIALLY_PAID") {
    return Math.round(totalCents * 0.5);
  }

  return 0;
};

export async function getOrdersPageData() {
  const products = getVisibleProducts();
  const orders = getOrdersWithCustomers();
  const items = getAllOrderItems();

  const itemsByOrder = new Map<string, typeof items>();
  items.forEach((item) => {
    const current = itemsByOrder.get(item.order_id) ?? [];
    current.push(item);
    itemsByOrder.set(item.order_id, current);
  });

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
      createdAt: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(order.created_at)),
      pickupAt: order.pickup_at
        ? new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(order.pickup_at))
        : "Schedule pending",
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
      { label: "Orders", value: orderRows.length.toString(), note: "Total" },
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
    orders: orderRows,
  };
}

export async function getOrderDetailPageData(orderId: string) {
  const order = getOrderDetailRow(orderId);

  if (!order) {
    return null;
  }

  const items = getOrderItems(orderId);

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
    createdAt: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(order.created_at)),
    updatedAt: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(order.updated_at)),
    pickupAt: order.pickup_at
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(order.pickup_at))
      : "Schedule pending",
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

export async function createOrder(input: {
  customerName: string;
  customerPhone: string;
  productId: string;
  quantity: number;
  status: string;
  paymentStatus: string;
  fulfillmentType: string;
  pickupAt: string;
  notes: string;
}) {
  const product = getProductById(input.productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const quantity = Math.max(1, Math.min(Math.floor(input.quantity), Math.max(product.stock_quantity, 1)));
  const customerId = findOrCreateCustomer(input.customerName, input.customerPhone);
  const orderId = randomUUID();
  const itemId = randomUUID();
  const unitPriceCents = product.price_cents;
  const subtotalCents = unitPriceCents * quantity;
  const totalCents = subtotalCents;
  const depositPaidCents = deriveDepositPaid(totalCents, input.paymentStatus);
  const balanceDueCents = Math.max(totalCents - depositPaidCents, 0);
  const now = new Date().toISOString();
  const orderNumber = getNextOrderNumber();

  insertOrderRecord({
    orderId,
    orderNumber,
    customerId,
    status: input.status,
    paymentStatus: input.paymentStatus,
    fulfillmentType: input.fulfillmentType,
    subtotalCents,
    totalCents,
    depositPaidCents,
    balanceDueCents,
    notes: input.notes,
    pickupAt: new Date(input.pickupAt).toISOString(),
    now,
  });

  insertOrderItemRecord({
    itemId,
    orderId,
    productId: product.id,
    productName: product.name,
    unitPriceCents,
    quantity,
    lineTotalCents: subtotalCents,
  });

  if (activeOrderStatuses.includes(input.status)) {
    adjustProductStock({
      productId: product.id,
      quantityDelta: -quantity,
      movementType: "SALE",
      reason: "Stock deducted from order creation",
      referenceId: orderId,
    });
  }
}

export async function updateOrder(input: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  productId: string;
  quantity: number;
  status: string;
  paymentStatus: string;
  fulfillmentType: string;
  pickupAt: string;
  notes: string;
}) {
  const order = getOrderById(input.orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const currentItem = getOrderItems(input.orderId)[0];

  if (!currentItem) {
    throw new Error("Order item not found");
  }

  if (activeOrderStatuses.includes(order.status)) {
    adjustProductStock({
      productId: currentItem.product_id,
      quantityDelta: currentItem.quantity,
      movementType: "CANCELLATION_RESTORE",
      reason: "Stock restored before order update",
      referenceId: input.orderId,
    });
  }

  const customerId = findOrCreateCustomer(input.customerName, input.customerPhone);
  const nextProduct = getProductById(input.productId);

  if (!nextProduct) {
    throw new Error("Product not found");
  }

  const quantity = Math.max(1, Math.min(Math.floor(input.quantity), Math.max(nextProduct.stock_quantity, 1)));
  const subtotalCents = nextProduct.price_cents * quantity;
  const totalCents = subtotalCents;
  const depositPaidCents = deriveDepositPaid(totalCents, input.paymentStatus);
  const balanceDueCents = Math.max(totalCents - depositPaidCents, 0);
  const now = new Date().toISOString();

  updateOrderRecord({
    orderId: input.orderId,
    customerId,
    status: input.status,
    paymentStatus: input.paymentStatus,
    fulfillmentType: input.fulfillmentType,
    subtotalCents,
    totalCents,
    depositPaidCents,
    balanceDueCents,
    notes: input.notes,
    pickupAt: new Date(input.pickupAt).toISOString(),
    now,
  });

  updateOrderItemRecord({
    itemId: currentItem.id,
    productId: nextProduct.id,
    productName: nextProduct.name,
    unitPriceCents: nextProduct.price_cents,
    quantity,
    lineTotalCents: subtotalCents,
  });

  if (activeOrderStatuses.includes(input.status)) {
    adjustProductStock({
      productId: nextProduct.id,
      quantityDelta: -quantity,
      movementType: "SALE",
      reason: "Stock deducted after order update",
      referenceId: input.orderId,
    });
  }
}

export async function deleteOrder(orderId: string) {
  const order = getOrderById(orderId);

  if (!order) {
    return;
  }

  const items = getOrderItems(orderId);

  if (activeOrderStatuses.includes(order.status)) {
    items.forEach((item) => {
      adjustProductStock({
        productId: item.product_id,
        quantityDelta: item.quantity,
        movementType: "CANCELLATION_RESTORE",
        reason: "Stock restored after order deletion",
        referenceId: orderId,
      });
    });
  }

  purgeOrderRecord(orderId);
}

export {
  fulfillmentOptions,
  orderStatusOptions,
  paymentStatusOptions,
};
