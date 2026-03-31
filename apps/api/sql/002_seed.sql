delete from inventory_movements;
delete from order_items;
delete from orders;
delete from customers;
delete from products;
delete from users;

insert into users (id, name, email, role)
values ('user-admin', 'Veloura Admin', 'admin@velouracakes.demo', 'ADMIN');

insert into customers (id, full_name, email, phone, notes) values
('cust-001', 'Meklit Desta', 'meklit@example.com', '+251911000101', 'Prefers delicate floral finishes'),
('cust-002', 'Ruth Daniel', 'ruth@example.com', '+251911000102', 'Office catering repeat client'),
('cust-003', 'Abel Gebre', 'abel@example.com', '+251911000103', 'Weekend pickup customer'),
('cust-004', 'Nardos Solomon', 'nardos@example.com', '+251911000104', 'Wedding event planner'),
('cust-005', 'Nahom Bekele', 'nahom@example.com', '+251911000105', 'Usually orders birthday cakes');

insert into products (id, name, slug, category, description, price_cents, stock_quantity, low_stock_threshold, status, image_url) values
('prod-001', 'Classic Chocolate Signature', 'classic-chocolate-signature', 'SIGNATURE_CAKE', 'Deep cocoa sponge with silk ganache and clean boutique finishing.', 4200, 18, 8, 'ACTIVE', null),
('prod-002', 'Blush Bloom Celebration', 'blush-bloom-celebration', 'BIRTHDAY_CAKE', 'Vanilla cake dressed with blush rosettes for premium parties.', 5500, 6, 8, 'ACTIVE', null),
('prod-003', 'Vanilla Berry Mini Set', 'vanilla-berry-mini-set', 'CUPCAKE', 'Mini cakes with berry filling for corporate and family events.', 2200, 22, 10, 'ACTIVE', null),
('prod-004', 'Pearl Wedding Tier', 'pearl-wedding-tier', 'WEDDING_CAKE', 'Elegant multi-tier celebration cake with pearl and floral work.', 23000, 2, 4, 'ACTIVE', null),
('prod-005', 'Pistachio Rose Slice', 'pistachio-rose-slice', 'SEASONAL', 'Seasonal slice with pistachio cream and restrained rose aroma.', 1800, 0, 4, 'OUT_OF_STOCK', null);

insert into orders (id, order_number, customer_id, status, payment_status, fulfillment_type, subtotal_cents, tax_cents, discount_cents, total_cents, deposit_paid_cents, balance_due_cents, notes, pickup_at, created_at, updated_at) values
('ord-2041', 'VC-2041', 'cust-001', 'IN_PRODUCTION', 'PARTIALLY_PAID', 'PICKUP', 22000, 1000, 0, 23000, 12000, 11000, 'Pearls, blush florals, smooth buttercream finish.', now() + interval '16 hours', now(), now()),
('ord-2040', 'VC-2040', 'cust-002', 'READY', 'PAID', 'DELIVERY', 8400, 400, 0, 8800, 8800, 0, 'Office lobby drop-off.', now() + interval '12 hours', now(), now()),
('ord-2039', 'VC-2039', 'cust-003', 'CONFIRMED', 'UNPAID', 'PICKUP', 6600, 0, 0, 6600, 0, 6600, 'Birthday candles requested.', now() + interval '1 day', now(), now()),
('ord-2038', 'VC-2038', 'cust-004', 'DELIVERED', 'PAID', 'DELIVERY', 23000, 1200, 0, 24200, 24200, 0, 'Wedding stage delivery with careful floral handling.', now() - interval '10 hours', now() - interval '1 day', now()),
('ord-2037', 'VC-2037', 'cust-005', 'DRAFT', 'UNPAID', 'PICKUP', 4200, 0, 0, 4200, 0, 4200, 'Draft custom order awaiting final design approval.', now() + interval '2 days', now(), now());

insert into order_items (id, order_id, product_id, product_name_snapshot, unit_price_cents, quantity, line_total_cents) values
('item-2041-1', 'ord-2041', 'prod-002', 'Blush Bloom Celebration', 5500, 4, 22000),
('item-2040-1', 'ord-2040', 'prod-001', 'Classic Chocolate Signature', 4200, 2, 8400),
('item-2039-1', 'ord-2039', 'prod-003', 'Vanilla Berry Mini Set', 2200, 3, 6600),
('item-2038-1', 'ord-2038', 'prod-004', 'Pearl Wedding Tier', 23000, 1, 23000),
('item-2037-1', 'ord-2037', 'prod-001', 'Classic Chocolate Signature', 4200, 1, 4200);

insert into inventory_movements (id, product_id, type, quantity_delta, reason, reference_type, reference_id, created_at, created_by_id) values
('move-restock-1', 'prod-001', 'RESTOCK', 20, 'Initial seeded stock load', 'SEED', 'classic-chocolate-signature', now() - interval '10 days', 'user-admin'),
('move-sale-1', 'prod-001', 'SALE', -2, 'Sales reflected from seeded orders', 'ORDER_BATCH', 'classic-chocolate-signature', now() - interval '1 day', 'user-admin'),
('move-restock-2', 'prod-002', 'RESTOCK', 10, 'Initial seeded stock load', 'SEED', 'blush-bloom-celebration', now() - interval '10 days', 'user-admin'),
('move-sale-2', 'prod-002', 'SALE', -4, 'Sales reflected from seeded orders', 'ORDER_BATCH', 'blush-bloom-celebration', now() - interval '1 day', 'user-admin'),
('move-restock-3', 'prod-003', 'RESTOCK', 25, 'Initial seeded stock load', 'SEED', 'vanilla-berry-mini-set', now() - interval '10 days', 'user-admin'),
('move-sale-3', 'prod-003', 'SALE', -3, 'Sales reflected from seeded orders', 'ORDER_BATCH', 'vanilla-berry-mini-set', now() - interval '1 day', 'user-admin'),
('move-restock-4', 'prod-004', 'RESTOCK', 3, 'Initial seeded stock load', 'SEED', 'pearl-wedding-tier', now() - interval '10 days', 'user-admin'),
('move-sale-4', 'prod-004', 'SALE', -1, 'Sales reflected from seeded orders', 'ORDER_BATCH', 'pearl-wedding-tier', now() - interval '1 day', 'user-admin'),
('move-restock-5', 'prod-005', 'RESTOCK', 0, 'Initial seeded stock load', 'SEED', 'pistachio-rose-slice', now() - interval '10 days', 'user-admin'),
('move-sale-5', 'prod-005', 'SALE', 0, 'Sales reflected from seeded orders', 'ORDER_BATCH', 'pistachio-rose-slice', now() - interval '1 day', 'user-admin');
