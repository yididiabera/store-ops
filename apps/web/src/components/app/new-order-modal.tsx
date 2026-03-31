"use client";

import { useState, useTransition } from "react";
import { createOrderAction } from "@/app/(app)/orders/actions";

type ProductOption = {
  id: string;
  name: string;
  stockQuantity: number;
  price: string;
};

type NewOrderModalProps = {
  products: ProductOption[];
  defaultPickupTime: string;
  orderStatusOptions: string[];
  paymentStatusOptions: string[];
  fulfillmentOptions: string[];
};

const formatOptionLabel = (value: string) =>
  value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export function NewOrderModal({
  products,
  defaultPickupTime,
  orderStatusOptions,
  paymentStatusOptions,
  fulfillmentOptions,
}: NewOrderModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submitOrder = async (formData: FormData) => {
    startTransition(async () => {
      await createOrderAction(formData);
      setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-[rgba(53,87,70,0.12)] bg-[linear-gradient(135deg,var(--action-add),var(--action-add-strong))] px-5 py-2.5 text-sm font-semibold text-[#f7fbf7] shadow-[0_18px_34px_rgba(53,87,70,0.22)] ring-1 ring-[rgba(255,255,255,0.18)] transition-[transform,box-shadow,filter] hover:-translate-y-[1px] hover:shadow-[0_22px_40px_rgba(53,87,70,0.26)] hover:brightness-[1.03]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Order
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(45,31,27,0.28)] px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[1.4rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] shadow-[0_28px_80px_rgba(45,31,27,0.18)]">
            <div className="flex items-center justify-between gap-4 border-b border-[color:var(--line)] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-[1.3rem] font-bold tracking-tight">Create Order</h2>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  Add a new order without leaving the board.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/80 text-[color:var(--muted)] transition-colors hover:bg-white"
                aria-label="Close create order modal"
              >
                x
              </button>
            </div>

            <form action={submitOrder} className="space-y-4 px-5 py-5 sm:px-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="premium-label">Customer name</span>
                  <input
                    name="customerName"
                    required
                    className="premium-input"
                    placeholder="Selam Tesfaye"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="premium-label">Phone</span>
                  <input
                    name="customerPhone"
                    required
                    className="premium-input"
                    placeholder="+2519..."
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.45fr_0.55fr]">
                <label className="space-y-1.5">
                  <span className="premium-label">Product</span>
                  <select name="productId" required className="premium-select">
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.price} - {product.stockQuantity} left
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="premium-label">Quantity</span>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    defaultValue="1"
                    className="premium-input"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1.5">
                  <span className="premium-label">Status</span>
                  <select name="status" defaultValue="CONFIRMED" className="premium-select">
                    {orderStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatOptionLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="premium-label">Payment</span>
                  <select name="paymentStatus" defaultValue="UNPAID" className="premium-select">
                    {paymentStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatOptionLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="premium-label">Fulfillment</span>
                  <select name="fulfillmentType" defaultValue="PICKUP" className="premium-select">
                    {fulfillmentOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-1.5">
                <span className="premium-label">Pickup or delivery time</span>
                <input
                  name="pickupAt"
                  type="datetime-local"
                  defaultValue={defaultPickupTime}
                  required
                  className="premium-input"
                />
              </label>

              <label className="space-y-1.5">
                <span className="premium-label">Notes</span>
                <textarea
                  name="notes"
                  rows={3}
                  className="premium-textarea"
                  placeholder="Message on cake, design request, delivery detail..."
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-[0.9rem] border border-[color:var(--line)] bg-white/82 px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center justify-center rounded-[0.9rem] bg-[color:var(--action-add-soft)] px-4 py-2.5 text-sm font-semibold text-[color:var(--action-add-strong)] transition-colors hover:bg-[#cfe0d5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Saving..." : "Save Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
