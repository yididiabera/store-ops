export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price_cents: number;
  stock_quantity: number;
  low_stock_threshold: number;
  status: string;
  updated_at: string;
};

export type ProductSaleRow = {
  product_id: string;
  sold_units: number;
};

export type OrderRow = {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  fulfillment_type: string;
  total_cents: number;
  deposit_paid_cents: number;
  balance_due_cents: number;
  created_at: string;
  pickup_at: string | null;
  notes: string | null;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

export type CustomerRow = {
  id: string;
  full_name: string;
  phone: string;
};

export type OrderDetailRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  fulfillment_type: string;
  subtotal_cents: number;
  total_cents: number;
  deposit_paid_cents: number;
  balance_due_cents: number;
  created_at: string;
  updated_at: string;
  pickup_at: string | null;
  notes: string | null;
};
