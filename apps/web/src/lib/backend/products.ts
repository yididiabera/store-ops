import { productCategoryOptions, productStatusOptions } from "@/server/shared/constants";
import { fetchApi, isApiEnabled } from "./api";

type ProductMutationInput = {
  id?: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
};

export { productCategoryOptions, productStatusOptions };

type ProductsPageData = Awaited<ReturnType<(typeof import("@/server/products"))["getProductsPageData"]>>;

export async function getProductsPageData(): Promise<
  ProductsPageData & {
    options: {
      categories: string[];
      statuses: string[];
    };
  }
> {
  if (!isApiEnabled()) {
    const { getProductsPageData: getProductsPageDataInternal } = await import("@/server/products");
    const data = await getProductsPageDataInternal();
    return {
      ...data,
      options: {
        categories: [...productCategoryOptions],
        statuses: [...productStatusOptions],
      },
    };
  }

  return fetchApi<
    ProductsPageData & {
      options: {
        categories: string[];
        statuses: string[];
      };
    }
  >("/products");
}

export async function createProduct(input: ProductMutationInput): Promise<unknown> {
  if (!isApiEnabled()) {
    const { createProduct: createProductInternal } = await import("@/server/products");
    return createProductInternal(input);
  }

  return fetchApi("/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProduct(input: ProductMutationInput & { id: string }): Promise<unknown> {
  if (!isApiEnabled()) {
    const { updateProduct: updateProductInternal } = await import("@/server/products");
    return updateProductInternal(input);
  }

  return fetchApi(`/products/${input.id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteProduct(productId: string): Promise<unknown> {
  if (!isApiEnabled()) {
    const { deleteProduct: deleteProductInternal } = await import("@/server/products");
    return deleteProductInternal(productId);
  }

  return fetchApi(`/products/${productId}`, {
    method: "DELETE",
  });
}
