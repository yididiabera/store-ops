export type OrderStatus =
  | "Confirmed"
  | "In Production"
  | "Ready"
  | "Delivered";

export type ProductStatus = "In Stock" | "Low Stock" | "Out of Stock";

export type Order = {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: OrderStatus;
  fulfillment: "Pickup" | "Delivery";
  dueTime: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  stockLeft: number;
  soldThisWeek: number;
  price: number;
  status: ProductStatus;
};

export type ProductionTask = {
  id: string;
  title: string;
  orderRef: string;
  assignee: string;
  window: string;
  stage: "Baking" | "Decorating" | "Boxing";
};

export const dashboardMetrics = [
  {
    label: "Sold today",
    value: "38",
    delta: "+12%",
    note: "Across cakes, cupcakes, and custom orders",
  },
  {
    label: "Stock left",
    value: "126",
    delta: "8 low",
    note: "Finished products available for immediate sale",
  },
  {
    label: "Revenue today",
    value: "$2,480",
    delta: "+18%",
    note: "Deposits and completed payments combined",
  },
  {
    label: "Pending orders",
    value: "14",
    delta: "5 urgent",
    note: "Orders due within the next 24 hours",
  },
] as const;

export const salesTrend = [
  { day: "Mon", amount: 980 },
  { day: "Tue", amount: 1240 },
  { day: "Wed", amount: 1180 },
  { day: "Thu", amount: 1680 },
  { day: "Fri", amount: 1540 },
  { day: "Sat", amount: 2480 },
] as const;

export const orders: Order[] = [
  {
    id: "VC-2041",
    customer: "Meklit Desta",
    product: "Blush Bloom Celebration",
    amount: 220,
    status: "In Production",
    fulfillment: "Pickup",
    dueTime: "Today, 4:30 PM",
  },
  {
    id: "VC-2040",
    customer: "Ruth Daniel",
    product: "Classic Chocolate Signature",
    amount: 84,
    status: "Ready",
    fulfillment: "Delivery",
    dueTime: "Today, 1:00 PM",
  },
  {
    id: "VC-2039",
    customer: "Abel Gebre",
    product: "Vanilla Berry Mini Set",
    amount: 66,
    status: "Confirmed",
    fulfillment: "Pickup",
    dueTime: "Tomorrow, 10:00 AM",
  },
  {
    id: "VC-2038",
    customer: "Nardos Solomon",
    product: "Pearl Wedding Tier",
    amount: 460,
    status: "In Production",
    fulfillment: "Delivery",
    dueTime: "Tomorrow, 2:00 PM",
  },
  {
    id: "VC-2037",
    customer: "Nahom Bekele",
    product: "Caramel Drip Birthday",
    amount: 95,
    status: "Delivered",
    fulfillment: "Pickup",
    dueTime: "Today, 11:15 AM",
  },
] as const;

export const products: Product[] = [
  {
    id: "P-01",
    name: "Classic Chocolate Signature",
    category: "Signature Cake",
    stockLeft: 18,
    soldThisWeek: 31,
    price: 42,
    status: "In Stock",
  },
  {
    id: "P-02",
    name: "Blush Bloom Celebration",
    category: "Birthday Cake",
    stockLeft: 6,
    soldThisWeek: 14,
    price: 55,
    status: "Low Stock",
  },
  {
    id: "P-03",
    name: "Vanilla Berry Mini Set",
    category: "Cupcakes",
    stockLeft: 22,
    soldThisWeek: 44,
    price: 22,
    status: "In Stock",
  },
  {
    id: "P-04",
    name: "Pearl Wedding Tier",
    category: "Wedding Cake",
    stockLeft: 2,
    soldThisWeek: 5,
    price: 230,
    status: "Low Stock",
  },
  {
    id: "P-05",
    name: "Pistachio Rose Slice",
    category: "Seasonal",
    stockLeft: 0,
    soldThisWeek: 11,
    price: 18,
    status: "Out of Stock",
  },
] as const;

export const productionQueue: ProductionTask[] = [
  {
    id: "T-01",
    title: "Bake sponge tiers",
    orderRef: "VC-2041",
    assignee: "Sara",
    window: "07:30 - 09:00",
    stage: "Baking",
  },
  {
    id: "T-02",
    title: "Buttercream and floral piping",
    orderRef: "VC-2038",
    assignee: "Mahi",
    window: "09:30 - 12:00",
    stage: "Decorating",
  },
  {
    id: "T-03",
    title: "Box ready pickups",
    orderRef: "VC-2040",
    assignee: "Liya",
    window: "12:15 - 01:00",
    stage: "Boxing",
  },
] as const;

export const lowStockItems = products.filter(
  (product) => product.status === "Low Stock" || product.status === "Out of Stock"
);

export const bestSeller = products.reduce((current, product) =>
  product.soldThisWeek > current.soldThisWeek ? product : current
);
