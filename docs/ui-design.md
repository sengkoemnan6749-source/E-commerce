# TechTonic Store — UI / UX Design System

## 1. Design Philosophy
- **Modern & Minimal:** Generous whitespace, clean contrast, subtle card elevations.
- **Tech-Focused:** Precision typography (`Plus Jakarta Sans`), monospaced serial codes, high-tech dark hero banners.
- **Strictly No Emojis:** All iconography is rendered via vector Lucide React SVG icons.
- **Authentic Cambodian Context:** NBC Bakong KHQR integration, Phnom Penh local delivery couriers, dual USD / KHR currency formatting.

---

## 2. Color Palette
- **Background Light:** `bg-slate-50` (`#f8fafc`)
- **Card Surfaces:** `#ffffff` with subtle border `border-slate-200/90`
- **Brand Primary Accent:** Electric Blue `#2563eb` (Hover `#1d4ed8`)
- **Dark Neutral (Headings/Hero):** Deep Slate `#0f172a` to `#020617`
- **Success / In Stock:** Emerald `#059669` / `#10b981`
- **Warning / Low Stock:** Amber `#d97706` / `#f59e0b`
- **Danger / Discount Badge:** Rose `#e11d48` / `#ef4444`

---

## 3. Typography
- **Primary Font:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- **Monospace Font:** JetBrains Mono / UI Monospace for SKUs, order IDs, prices, and specs.

---

## 4. Key Interactive Components
1. **Pinned Glass Navbar:** Stays fixed on scroll with backdrop-blur, live debounced search autocomplete, and instant cart drawer trigger.
2. **Slide-Over Cart Drawer:** Free shipping goal tracker ($100 threshold), instant quantity steppers, and 1-click checkout.
3. **2-Step Checkout:** Step 1 Shipping validation; Step 2 KHQR Bakong mobile scanner or interactive credit card visualizer.
4. **5-Stage Order Stepper:** Responsive desktop horizontal connector line & mobile vertical timeline tracking stages from Confirmed to Delivered.
5. **Admin Console:** Dark theme sidebar, metrics cards, custom SVG monthly revenue trend chart, and real-time inventory editor.
