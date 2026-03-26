# Veloura Cakes Demo Blueprint

## Product Goal

Build a premium full-stack cake shop management demo that helps a bakery owner answer these questions quickly:

- How many cakes were sold today, this week, and this month?
- How many cakes are left in stock?
- Which products are selling best?
- Which orders are pending, in production, ready, or delivered?
- Which products are low on stock and need attention?

The demo should feel elegant and boutique, not like a generic admin template.

## Demo Scope

The first implementation target includes these areas:

- Dashboard
- Products
- Orders

The system is a management dashboard first. A public storefront is not required for this demo.

## Users

### Shop Admin

- Manages products, stock, and pricing
- Creates and updates orders
- Reviews sales and stock analytics
- Sees low-stock alerts and production workload

### Staff Member

- Views the daily production queue
- Updates order status
- Checks pickup and delivery timing

For the demo, a single admin experience is enough. Staff roles can be layered on later.

## Page Map

### Marketing / Entry

- `/`
  - Premium landing page
  - Explains the value of the system
  - Leads into the dashboard experience

### App

- `/dashboard`
  - KPI cards
  - Sales chart
  - Low-stock alerts
  - Recent orders
  - Today's production queue
  - Embedded reporting and best-seller insights

- `/products`
  - Product table and card views
  - Search and filters
  - Create and edit product
  - Stock level and availability status
  - Direct stock editing for V1

- `/orders`
  - Order list
  - Status filters
  - Order detail drawer or page
  - Create new order
  - Customer name and phone fields inline on the order

## Core Business Rules

- A product has a current stock quantity.
- A confirmed sale reduces product stock.
- An order can contain multiple items.
- Draft orders do not reduce stock.
- Confirmed or paid orders reduce stock.
- Cancelled orders do not reduce stock.
- Refunded or reversed orders should restore stock in a later phase.
- Low-stock alerts appear when product quantity falls below a defined threshold.
- Revenue metrics are based on confirmed orders, not drafts.

## Visual Direction

- Warm luxury palette using cream, caramel, cocoa, blush, and muted gold
- Editorial headings with disciplined operational UI typography
- Soft glass panels, layered backgrounds, and subtle motion
- Charts and tables that feel refined instead of corporate
- Strong mobile and tablet responsiveness

## Milestones For The Next Build Phase

### Milestone 1

Create the authenticated app shell:

- Sidebar
- Top bar
- Shared page header pattern
- Shared stats card
- Shared section card

### Milestone 2

Build the dashboard:

- Sales summary
- Stock left summary
- Pending and ready orders
- Low-stock alerts
- Recent orders list

### Milestone 3

Connect dashboard metrics to seeded backend data.

## Demo Data Requirements

The app should ship with realistic sample data so the client immediately sees:

- Active orders
- Several product categories
- Varying stock levels
- A few low-stock warnings
- Daily and weekly sales history
- Named order contacts and custom orders

## Out Of Scope For Now

- Online customer checkout
- Real payment gateway integration
- Separate customer CRM pages
- Separate inventory ledger and movement history UI
- Separate reports page
- Full production scheduling engine
- Supplier purchasing workflows
- Multi-branch bakery support
