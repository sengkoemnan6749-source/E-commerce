# TechTonic Store — Mock Service Layer & Future REST API Contract

## 1. Overview
During Phase 1 (Frontend UI Only), the application utilizes a modular service layer (`src/services/`) that mirrors future backend REST API endpoints.

---

## 2. API Contract Endpoints

### 2.1 Products Service (`productService.js`)
- `GET /api/products` — Retrieve all active products with category filtering and keyword search
- `GET /api/products/:id` — Retrieve detailed product object with specifications and review count
- `POST /api/admin/products` — Create new hardware catalog entry
- `PUT /api/admin/products/:id` — Update pricing, variants, or inventory count
- `DELETE /api/admin/products/:id` — Archive product from storefront

### 2.2 Orders Service (`orderService.js`)
- `GET /api/orders` — List past orders for logged in user or admin audit
- `GET /api/orders/:id` — Get 5-stage shipment telemetry and items
- `POST /api/orders` — Finalize checkout, deduct inventory, and issue serialized Order ID
- `PATCH /api/admin/orders/:id/status` — Progress order stage (`confirmed` → `processing` → `shipped` → `out_for_delivery` → `delivered`)

### 2.3 Payment Simulation (`paymentService.js`)
- `POST /api/payments/card` — Verify card number (Luhn check), expiry, and authorize charge
- `POST /api/payments/khqr` — Generate NBC Bakong EMVCo QR string and poll transaction settlement
