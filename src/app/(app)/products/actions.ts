"use server";

import { revalidatePath } from "next/cache";
import { createProduct, deleteProduct, updateProduct } from "@/server/products";

const parseNumber = (value: FormDataEntryValue | null, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseText = (value: FormDataEntryValue | null) => String(value ?? "").trim();

export async function createProductAction(formData: FormData) {
  const name = parseText(formData.get("name"));
  const category = parseText(formData.get("category"));
  const description = parseText(formData.get("description"));

  if (!name || !category) {
    return;
  }

  await createProduct({
    name,
    category,
    description,
    price: parseNumber(formData.get("price"), 0),
    stockQuantity: parseNumber(formData.get("stockQuantity"), 0),
    lowStockThreshold: parseNumber(formData.get("lowStockThreshold"), 0),
    status: parseText(formData.get("status")) || "ACTIVE",
  });

  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export async function updateProductAction(formData: FormData) {
  const id = parseText(formData.get("id"));
  const name = parseText(formData.get("name"));
  const category = parseText(formData.get("category"));
  const description = parseText(formData.get("description"));

  if (!id || !name || !category) {
    return;
  }

  await updateProduct({
    id,
    name,
    category,
    description,
    price: parseNumber(formData.get("price"), 0),
    stockQuantity: parseNumber(formData.get("stockQuantity"), 0),
    lowStockThreshold: parseNumber(formData.get("lowStockThreshold"), 0),
    status: parseText(formData.get("status")) || "ACTIVE",
  });

  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export async function deleteProductAction(formData: FormData) {
  const id = parseText(formData.get("id"));

  if (!id) {
    return;
  }

  await deleteProduct(id);

  revalidatePath("/products");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}
