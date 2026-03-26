# Veloura Cakes Data Model

## Core Entities

### User

- `id`
- `name`
- `email`
- `role`
- `createdAt`
- `updatedAt`

### Customer

- `id`
- `fullName`
- `phone`
- `email`
- `notes`
- `createdAt`
- `updatedAt`

### Product

- `id`
- `name`
- `slug`
- `category`
- `description`
- `price`
- `stockQuantity`
- `lowStockThreshold`
- `status`
- `imageUrl`
- `createdAt`
- `updatedAt`

### Order

- `id`
- `orderNumber`
- `customerId`
- `status`
- `paymentStatus`
- `fulfillmentType`
- `subtotal`
- `tax`
- `discount`
- `total`
- `depositPaid`
- `balanceDue`
- `notes`
- `pickupAt`
- `createdAt`
- `updatedAt`

### OrderItem

- `id`
- `orderId`
- `productId`
- `productNameSnapshot`
- `unitPrice`
- `quantity`
- `lineTotal`

### InventoryMovement

- `id`
- `productId`
- `type`
- `quantityDelta`
- `reason`
- `referenceType`
- `referenceId`
- `createdAt`
- `createdBy`

## Suggested Enums

### UserRole

- `ADMIN`
- `STAFF`

### ProductCategory

- `SIGNATURE_CAKE`
- `BIRTHDAY_CAKE`
- `WEDDING_CAKE`
- `CUPCAKE`
- `CHEESECAKE`
- `SEASONAL`

### ProductStatus

- `ACTIVE`
- `OUT_OF_STOCK`
- `ARCHIVED`

### OrderStatus

- `DRAFT`
- `CONFIRMED`
- `IN_PRODUCTION`
- `READY`
- `DELIVERED`
- `CANCELLED`

### PaymentStatus

- `UNPAID`
- `PARTIALLY_PAID`
- `PAID`

### FulfillmentType

- `PICKUP`
- `DELIVERY`

### InventoryMovementType

- `SALE`
- `RESTOCK`
- `MANUAL_ADJUSTMENT`
- `CANCELLATION_RESTORE`

## Entity Relationships

- A customer has many orders.
- An order belongs to one customer.
- An order has many order items.
- An order item belongs to one product.
- A product has many inventory movements.
- A product can appear in many order items.

## Dashboard Metrics Derived From The Model

- `cakesSoldToday`
  - Sum of `OrderItem.quantity` for orders created today where status is not `DRAFT` or `CANCELLED`

- `revenueToday`
  - Sum of `Order.total` for today's valid orders

- `stockLeft`
  - Sum of `Product.stockQuantity` or a product-level quantity view

- `lowStockProducts`
  - Products where `stockQuantity <= lowStockThreshold`

- `bestSellingProducts`
  - Top products by sum of sold `OrderItem.quantity`

- `pendingOrders`
  - Orders where status is `CONFIRMED` or `IN_PRODUCTION`

## Seed Data Shape

The initial seed should include:

- 12 to 18 products
- 10 to 15 customers
- 20 to 30 orders
- Mixed order states
- At least 4 low-stock products
- Sales dates spread across recent days

## Implementation Notes

- Keep `productNameSnapshot` on `OrderItem` so historical orders remain readable after product changes.
- Track stock via `stockQuantity` on `Product` and log every change in `InventoryMovement`.
- The first version can compute reports directly from orders and items without a warehouse-style ledger.
- Custom cakes can start as standard orders with detailed notes, then become a dedicated entity in a later phase.
