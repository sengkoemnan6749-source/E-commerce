# TechTonic Store — System Requirements Document (SRD)

## 1. System Architecture
- **Framework:** React 19 / Vite 6 SPA (Single Page Application)
- **Styling:** Tailwind CSS 3.4 with custom design tokens and Plus Jakarta Sans typography
- **Routing:** React Router DOM v7 with nested routing for Customer and Admin layouts
- **State Management:** React Context API with persistent `localStorage` synchronization
- **Icons:** Lucide React clean vector SVG icon library (Strictly zero emojis)
- **Local Dev Server:** Vite listening on `http://localhost:3000`

---

## 2. Client-Side State Schemas

### 2.1 Cart State
```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  variant: string;
  selectedVariant: string;
  quantity: number;
}
```

### 2.2 Order State
```typescript
interface Order {
  id: string; // e.g. #ORD-20260924-XXXX
  createdAt: string;
  status: 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';
  customerName: string;
  customerPhone: string;
  shippingAddress: Address;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: 'PAID';
  carrier: string;
  estimatedDelivery: string;
}
```

---

## 3. Responsive Breakpoints
- **Mobile:** 375px - 767px (Single column, slide-over hamburger navigation, sticky checkout action)
- **Tablet:** 768px - 1023px (2-column grids, collapsible filter panels)
- **Desktop:** 1024px - 1440px+ (4-column catalog grids, fixed sticky sidebar summaries, multi-step checkout)
