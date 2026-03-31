"use server";

import { revalidatePath } from "next/cache";
import { createOrder, deleteOrder, updateOrder } from "@/lib/backend/orders";

const parseNumber = (value: FormDataEntryValue | null, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseText = (value: FormDataEntryValue | null) => String(value ?? "").trim();

export async function createOrderAction(formData: FormData) {
  const customerName = parseText(formData.get("customerName"));
  const customerPhone = parseText(formData.get("customerPhone"));
  const productId = parseText(formData.get("productId"));
  const pickupAt = parseText(formData.get("pickupAt"));

  if (!customerName || !customerPhone || !productId || !pickupAt) {
    return;
  }

  await createOrder({
    customerName,
    customerPhone,
    productId,
    quantity: parseNumber(formData.get("quantity"), 1),
    status: parseText(formData.get("status")) || "CONFIRMED",
    paymentStatus: parseText(formData.get("paymentStatus")) || "UNPAID",
    fulfillmentType: parseText(formData.get("fulfillmentType")) || "PICKUP",
    pickupAt,
    notes: parseText(formData.get("notes")),
  });

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/products");
}

export async function updateOrderAction(formData: FormData) {
  const orderId = parseText(formData.get("orderId"));
  const customerName = parseText(formData.get("customerName"));
  const customerPhone = parseText(formData.get("customerPhone"));
  const productId = parseText(formData.get("productId"));
  const pickupAt = parseText(formData.get("pickupAt"));

  if (!orderId || !customerName || !customerPhone || !productId || !pickupAt) {
    return;
  }

  await updateOrder({
    orderId,
    customerName,
    customerPhone,
    productId,
    quantity: parseNumber(formData.get("quantity"), 1),
    status: parseText(formData.get("status")) || "DRAFT",
    paymentStatus: parseText(formData.get("paymentStatus")) || "UNPAID",
    fulfillmentType: parseText(formData.get("fulfillmentType")) || "PICKUP",
    pickupAt,
    notes: parseText(formData.get("notes")),
  });

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/products");
}

export async function deleteOrderAction(formData: FormData) {
  const orderId = parseText(formData.get("orderId"));

  if (!orderId) {
    return;
  }

  await deleteOrder(orderId);

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/products");
}
