import { getPool } from "../../db";

export type ProductRow = {
  id: string;
  category: string;
  stock_quantity: number;
};

export type SalesOrderRow = {
  id: string;
  order_number: string;
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
  customer_id: string;
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

export async function getSalesProducts() {
  const pool = getPool();
  const result = await pool.query<ProductRow>(
    "select * from products order by name asc",
  );
  return result.rows;
}

export async function getSalesOrders() {
  const pool = getPool();
  const result = await pool.query<SalesOrderRow>(`
    select
      o.id,
      o.order_number,
      c.full_name as customer_name,
      c.phone as customer_phone,
      o.status,
      o.payment_status,
      o.fulfillment_type,
      o.total_cents,
      o.deposit_paid_cents,
      o.balance_due_cents,
      o.created_at,
      o.pickup_at,
      o.notes,
      c.id as customer_id
    from orders o
    inner join customers c on c.id = o.customer_id
    order by o.created_at desc
  `);
  return result.rows;
}

export async function getSalesOrderItems() {
  const pool = getPool();
  const result = await pool.query<OrderItemRow>(
    "select * from order_items order by order_id asc",
  );
  return result.rows;
}
