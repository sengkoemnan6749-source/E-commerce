import zlib from 'zlib';

const mermaidCode = `graph TD
    classDef root fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#ffffff,font-weight:bold,rx:8px,ry:8px;
    classDef home fill:#3b82f6,stroke:#1d4ed8,stroke-width:1.5px,color:#ffffff,font-weight:bold,rx:6px,ry:6px;
    classDef shop fill:#06b6d4,stroke:#0891b2,stroke-width:1.5px,color:#ffffff,font-weight:bold,rx:6px,ry:6px;
    classDef detail fill:#8b5cf6,stroke:#7c3aed,stroke-width:1.5px,color:#ffffff,font-weight:bold,rx:6px,ry:6px;
    classDef wishlist fill:#f59e0b,stroke:#d97706,stroke-width:1.5px,color:#ffffff,font-weight:bold,rx:6px,ry:6px;
    classDef cart fill:#ef4444,stroke:#dc2626,stroke-width:1.5px,color:#ffffff,font-weight:bold,rx:6px,ry:6px;
    classDef checkout fill:#10b981,stroke:#059669,stroke-width:1.5px,color:#ffffff,font-weight:bold,rx:6px,ry:6px;
    classDef confirm fill:#6366f1,stroke:#4f46e5,stroke-width:1.5px,color:#ffffff,font-weight:bold,rx:6px,ry:6px;
    classDef account fill:#ec4899,stroke:#db2777,stroke-width:1.5px,color:#ffffff,font-weight:bold,rx:6px,ry:6px;
    classDef auth fill:#0284c7,stroke:#0369a1,stroke-width:1.5px,color:#ffffff,font-weight:bold,rx:6px,ry:6px;
    classDef footer fill:#475569,stroke:#334155,stroke-width:1.5px,color:#ffffff,font-weight:bold,rx:6px,ry:6px;
    classDef item fill:#f8fafc,stroke:#cbd5e1,stroke-width:1px,color:#1e293b,rx:4px,ry:4px;

    ROOT["CUSTOMER<br/>(E-commerce Website)"]:::root

    ROOT --> B_HOME["I. Home"]:::home
    ROOT --> B_SHOP["II. Shop"]:::shop
    ROOT --> B_DETAIL["III. Product Detail"]:::detail
    ROOT --> B_WISH["IV. Wishlist"]:::wishlist
    ROOT --> B_CART["V. Cart"]:::cart
    ROOT --> B_CHECK["VI. Checkout"]:::checkout
    ROOT --> B_CONFIRM["VII. Order Confirmation"]:::confirm
    ROOT --> B_ACCOUNT["VIII. My Account"]:::account
    ROOT --> B_AUTH["IX. Authentication"]:::auth
    ROOT --> B_FOOTER["X. Footer"]:::footer

    B_HOME --> H1["Hero Banner"]:::item
    H1 --> H2["Categories"]:::item
    H2 --> H3["Featured Products"]:::item
    H3 --> H4["New Products"]:::item
    H4 --> H5["Discount / Promotion"]:::item
    H5 --> H6["Footer"]:::item

    B_SHOP --> S1["All Products"]:::item
    S1 --> S2["Categories"]:::item
    S2 --> S3["Search"]:::item
    S3 --> S4["Filter"]:::item
    S4 --> S5["Sort"]:::item

    B_DETAIL --> D1["Product Images"]:::item
    D1 --> D2["Product Information"]:::item
    D2 --> D3["Price"]:::item
    D3 --> D4["Stock"]:::item
    D4 --> D5["Quantity"]:::item
    D5 --> D6["Add to Cart"]:::item
    D6 --> D7["Add to Wishlist"]:::item
    D7 --> D8["Reviews"]:::item
    D8 --> D9["Related Products"]:::item

    B_WISH --> W1["Wishlist Items"]:::item
    W1 --> W2["Add to Cart"]:::item

    B_CART --> C1["Cart Items"]:::item
    C1 --> C2["Update Quantity"]:::item
    C2 --> C3["Remove Item"]:::item
    C3 --> C4["Subtotal"]:::item
    C4 --> C5["Promo Code / Coupon"]:::item
    C5 --> C6["Checkout"]:::item

    B_CHECK --> K1["Shipping Address"]:::item
    K1 --> K2["Order Summary"]:::item
    K2 --> K3["Payment Method"]:::item
    K3 --> K4["Place Order"]:::item

    B_CONFIRM --> CF1["Order Number"]:::item
    CF1 --> CF2["Order Summary"]:::item
    CF2 --> CF3["Continue Shopping"]:::item

    B_ACCOUNT --> A1["Profile"]:::item
    A1 --> A2["My Orders"]:::item
    A2 --> A2_1["Order List"]:::item
    A2_1 --> A2_2["Order Detail"]:::item
    A2_2 --> A2_3["Order Tracking"]:::item
    A2_3 --> A3["Wishlist"]:::item
    A3 --> A4["Addresses"]:::item
    A4 --> A5["Change Password"]:::item
    A5 --> A6["Logout"]:::item

    B_AUTH --> AU1["Login"]:::item
    AU1 --> AU2["Register"]:::item
    AU2 --> AU3["Forgot Password"]:::item

    B_FOOTER --> F1["About Us"]:::item
    F1 --> F2["Contact Us"]:::item
    F2 --> F3["FAQ"]:::item
    F3 --> F4["Policies"]:::item
    F4 --> F4_1["Terms"]:::item
    F4_1 --> F4_2["Privacy"]:::item
    F4_2 --> F4_3["Refund"]:::item
    F4_3 --> F4_4["Shipping"]:::item
    F4_4 --> F5["Order Tracking"]:::item`;

const state = {
  code: mermaidCode,
  mermaid: { theme: 'default' },
  autoSync: true,
  updateDiagram: true
};

const json = JSON.stringify(state);
// Mermaid.live pako deflate format:
const deflated = zlib.deflateSync(json);
const base64 = deflated.toString('base64');
// replace standard base64 characters for url safety
const pakoUrl = 'https://mermaid.live/edit#pako:' + base64.replace(/\+/g, '-').replace(/\//g, '_');

console.log('--- MERMAID LIVE LINK ---');
console.log(pakoUrl);
