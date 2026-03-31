import { getPool } from "../../db";

export type ProductRow = {
  id: string;
  name: string;
  category: string;
  stock_quantity: number;
  low_stock_threshold: number;
  status: string;
  updated_at: string;
};

export type DashboardOrderRow = {
  id: string;
  order_number: string;
  status: string;
  fulfillment_type: string;
  total_cents: number;
  created_at: string;
  pickup_at: string | null;
  customer_name: string;
  customer_id: string;
  customer_phone: string;
  payment_status: string;
  deposit_paid_cents: number;
  balance_due_cents: number;
  notes: string | null;
};

export type DashboardOrderItemRow = {
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  product_category: string;
  product_status: string;
  stock_quantity: number;
  low_stock_threshold: number;
  price_cents: number;
  id: string;
  unit_price_cents: number;
  line_total_cents: number;
};

export async function getDashboardProducts() {
  const pool = getPool();
  const result = await pool.query<ProductRow>(
    "select * from products order by updated_at desc",
  );
  return result.rows;
}

export async function getDashboardOrders() {
  const pool = getPool();
  const result = await pool.query<DashboardOrderRow>(`
    select
      o.id,
      o.order_number,
      o.status,
      o.fulfillment_type,
      o.total_cents,
      o.created_at,
      o.pickup_at,
      c.full_name as customer_name,
      c.id as customer_id,
      c.phone as customer_phone,
      o.payment_status,
      o.deposit_paid_cents,
      o.balance_due_cents,
      o.notes
    from orders o
    inner join customers c on c.id = o.customer_id
    order by o.created_at desc
  `);
  return result.rows;
}

export async function getDashboardOrderItems() {
  const pool = getPool();
  const result = await pool.query<DashboardOrderItemRow>(`
    select
      oi.order_id,
      oi.product_id,
      oi.product_name_snapshot,
      oi.quantity,
      p.category as product_category,
      p.status as product_status,
      p.stock_quantity,
      p.low_stock_threshold,
      p.price_cents,
      oi.id,
      oi.unit_price_cents,
      oi.line_total_cents
    from order_items oi
    inner join products p on p.id = oi.product_id
  `);
  return result.rows;
}
