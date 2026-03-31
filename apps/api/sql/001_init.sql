create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id text primary key,
  full_name text not null,
  email text unique,
  phone text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  name text not null,
  slug text not null unique,
  category text not null,
  description text not null,
  price_cents integer not null,
  stock_quantity integer not null,
  low_stock_threshold integer not null,
  status text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  order_number text not null unique,
  customer_id text not null references customers(id) on delete cascade,
  status text not null,
  payment_status text not null,
  fulfillment_type text not null,
  subtotal_cents integer not null,
  tax_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null,
  deposit_paid_cents integer not null default 0,
  balance_due_cents integer not null default 0,
  notes text,
  pickup_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  product_id text not null references products(id) on delete restrict,
  product_name_snapshot text not null,
  unit_price_cents integer not null,
  quantity integer not null,
  line_total_cents integer not null
);

create table if not exists inventory_movements (
  id text primary key,
  product_id text not null references products(id) on delete cascade,
  type text not null,
  quantity_delta integer not null,
  reason text not null,
  reference_type text,
  reference_id text,
  created_at timestamptz not null,
  created_by_id text references users(id) on delete set null
);

create index if not exists idx_orders_customer_id on orders(customer_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_payment_status on orders(payment_status);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_order_items_product_id on order_items(product_id);
create index if not exists idx_inventory_movements_product_id on inventory_movements(product_id);
