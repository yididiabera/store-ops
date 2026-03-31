import {
  fulfillmentOptions,
  orderStatusOptions,
  paymentStatusOptions,
} from "@/server/shared/constants";
import { fetchApi, isApiEnabled } from "./api";

type OrderMutationInput = {
  orderId?: string;
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

export { fulfillmentOptions, orderStatusOptions, paymentStatusOptions };

type OrdersPageData = Awaited<ReturnType<(typeof import("@/server/orders"))["getOrdersPageData"]>>;
type OrderDetailPageData = Awaited<ReturnType<(typeof import("@/server/orders"))["getOrderDetailPageData"]>>;

export async function getOrdersPageData(): Promise<
  OrdersPageData & {
    options: {
      products: {
        id: string;
        name: string;
        stockQuantity: number;
        price: string;
        priceValue: number;
        status: string;
      }[];
      orderStatuses: string[];
      paymentStatuses: string[];
      fulfillmentTypes: string[];
    };
  }
> {
  if (!isApiEnabled()) {
    const { getOrdersPageData: getOrdersPageDataInternal } = await import("@/server/orders");
    const data = await getOrdersPageDataInternal();
    return {
      ...data,
      options: {
        products: data.products,
        orderStatuses: [...orderStatusOptions],
        paymentStatuses: [...paymentStatusOptions],
        fulfillmentTypes: [...fulfillmentOptions],
      },
    };
  }

  return fetchApi<
    OrdersPageData & {
      options: {
        products: {
          id: string;
          name: string;
          stockQuantity: number;
          price: string;
          priceValue: number;
          status: string;
        }[];
        orderStatuses: string[];
        paymentStatuses: string[];
        fulfillmentTypes: string[];
      };
    }
  >("/orders");
}

export async function getOrderDetailPageData(orderId: string): Promise<OrderDetailPageData> {
  if (!isApiEnabled()) {
    const { getOrderDetailPageData: getOrderDetailPageDataInternal } = await import("@/server/orders");
    return getOrderDetailPageDataInternal(orderId);
  }

  return fetchApi<OrderDetailPageData>(`/orders/${orderId}`);
}

export async function createOrder(input: OrderMutationInput): Promise<unknown> {
  if (!isApiEnabled()) {
    const { createOrder: createOrderInternal } = await import("@/server/orders");
    return createOrderInternal(input);
  }

  return fetchApi("/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateOrder(input: OrderMutationInput & { orderId: string }): Promise<unknown> {
  if (!isApiEnabled()) {
    const { updateOrder: updateOrderInternal } = await import("@/server/orders");
    return updateOrderInternal(input);
  }

  return fetchApi(`/orders/${input.orderId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteOrder(orderId: string): Promise<unknown> {
  if (!isApiEnabled()) {
    const { deleteOrder: deleteOrderInternal } = await import("@/server/orders");
    return deleteOrderInternal(orderId);
  }

  return fetchApi(`/orders/${orderId}`, {
    method: "DELETE",
  });
}
