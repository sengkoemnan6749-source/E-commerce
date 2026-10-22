# TechTonic Store — Frontend UI

> **"Engineered for the Modern Digital Lifestyle"**  
> Modern B2C Consumer Electronics E-Commerce Storefront & Admin Portal.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Run Locally
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (if not already done)
npm install

# Start Vite development server
npm run dev
```

Visit the application in your browser:
- **Customer Storefront:** [http://localhost:3000/](http://localhost:3000/)
- **Shop Catalog:** [http://localhost:3000/shop](http://localhost:3000/shop)
- **Product Detail:** [http://localhost:3000/product/prod-001](http://localhost:3000/product/prod-001)
- **Cart Page:** [http://localhost:3000/cart](http://localhost:3000/cart)
- **2-Step Checkout:** [http://localhost:3000/checkout](http://localhost:3000/checkout)
- **Order Tracking:** [http://localhost:3000/orders/ORD-20260924-0001](http://localhost:3000/orders/ORD-20260924-0001)
- **Customer Account:** [http://localhost:3000/account](http://localhost:3000/account)
- **Admin Dashboard:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🛠️ Technology Stack
- **Framework:** React 19 + Vite 6
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS 3.4
- **Iconography:** Lucide React (Clean vector SVG icons, strictly zero emojis)
- **State Management:** React Context API with persistent `localStorage` synchronization
- **Typography:** Plus Jakarta Sans & UI Monospace

---

## 📦 Project Structure

```
E-Commerce/
├── frontend/
│   ├── public/
│   │   ├── images/
│   │   └── favicon.svg
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Button, Input, Modal, Badge, Pagination, Toast
│   │   │   ├── layout/        # Navbar, Footer, MobileMenu, CustomerLayout
│   │   │   ├── product/       # ProductCard, ProductGrid, ProductGallery, ProductInfo, ProductSpecs, ProductReviews
│   │   │   ├── cart/          # CartDrawer, CartItem, CartSummary
│   │   │   ├── checkout/      # ShippingForm, PaymentMethod, CardPayment, KHQRPayment, OrderSummary
│   │   │   └── order/         # OrderStatus, OrderStepper, Invoice
│   │   │
│   │   ├── pages/
│   │   │   ├── Home/          # Hero, Categories, Featured, Best Sellers, Brand Perks
│   │   │   ├── Shop/          # Multi-filter catalog with price slider & sorting
│   │   │   ├── ProductDetail/ # High-res gallery, variants, specs, verified reviews
│   │   │   ├── Cart/          # Full shopping bag with promo codes
│   │   │   ├── Checkout/      # 2-step shipping & KHQR/Card payment
│   │   │   ├── OrderSuccess/  # Serialized order confirmation & invoice trigger
│   │   │   ├── OrderTracking/ # 5-stage shipment progress tracker
│   │   │   ├── About/         # Engineering philosophy & Toul Kork flagship info
│   │   │   ├── Login/         # Customer authentication with demo autofill
│   │   │   ├── Register/      # Account registration with Cambodia phone validation
│   │   │   └── Account/       # Overview, Profile, Orders, Addresses, Invoices
│   │   │
│   │   ├── admin/
│   │   │   ├── Dashboard/     # Metrics cards, revenue chart, inventory alerts
│   │   │   ├── Products/      # CRUD product catalog management
│   │   │   ├── Categories/    # Department taxonomy management
│   │   │   ├── Orders/        # Fulfillment audit & status switcher
│   │   │   ├── Customers/     # Registered VIP & customer directory
│   │   │   └── Components/    # AdminLayout with dark theme sidebar
│   │   │
│   │   ├── services/          # mockData, productService, orderService, authService, paymentService, api
│   │   ├── store/             # StoreContext (Cart, Auth, Wishlist, Toasts)
│   │   ├── hooks/             # useCart, useAuth, useProducts
│   │   ├── utils/             # formatPrice, formatDate, validation
│   │   ├── routes/            # AppRoutes.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── business-requirements.md
│   ├── system-requirements.md
│   ├── api-documentation.md
│   └── ui-design.md
│
└── tools/                     # Audit & testing utilities
```

---

## 💳 Mock Payment & Discount Codes
- **Discount Codes:**
  - `TECH10` — $10.00 off instant discount
  - `SAVE5` — $5.00 off instant discount
- **KHQR Simulation:**
  - Real NBC Bakong QR visual code with support for ABA Mobile, Wing Bank, ACLEDA Mobile, Sathapana, and Canadia Bank.
  - "Simulate Mobile Scan & Pay" button for instant testing.
- **Card Payment:**
  - Interactive digital credit card visualizer with real-time cardholder and number reflection.

---

## 🛡️ License
Proprietary — TechTonic Store Cambodia. All Rights Reserved.
