import zlib from 'zlib';

const mermaidCode = `graph TD
    classDef root fill:#1e3a8a,stroke:#1d4ed8,stroke-width:2px,color:#ffffff,font-weight:bold,rx:8px,ry:8px;
    classDef subroot fill:#bfdbfe,stroke:#60a5fa,stroke-width:1.5px,color:#1e3a8a,font-weight:bold,rx:6px,ry:6px;
    
    classDef colOverview fill:#6ee7b7,stroke:#10b981,stroke-width:1.5px,color:#064e3b,font-weight:bold,rx:6px,ry:6px;
    classDef colProducts fill:#93c5fd,stroke:#3b82f6,stroke-width:1.5px,color:#1e3a8a,font-weight:bold,rx:6px,ry:6px;
    classDef colCategories fill:#c084fc,stroke:#9333ea,stroke-width:1.5px,color:#3b0764,font-weight:bold,rx:6px,ry:6px;
    classDef colOrders fill:#fca5a5,stroke:#ef4444,stroke-width:1.5px,color:#7f1d1d,font-weight:bold,rx:6px,ry:6px;
    classDef colCustomers fill:#67e8f9,stroke:#06b6d4,stroke-width:1.5px,color:#164e63,font-weight:bold,rx:6px,ry:6px;
    classDef colPayments fill:#fde047,stroke:#eab308,stroke-width:1.5px,color:#713f12,font-weight:bold,rx:6px,ry:6px;
    classDef colReviews fill:#d8b4fe,stroke:#a855f7,stroke-width:1.5px,color:#581c87,font-weight:bold,rx:6px,ry:6px;
    classDef colPromotions fill:#f472b6,stroke:#ec4899,stroke-width:1.5px,color:#831843,font-weight:bold,rx:6px,ry:6px;
    classDef colCMS fill:#7dd3fc,stroke:#0284c7,stroke-width:1.5px,color:#0c4a6e,font-weight:bold,rx:6px,ry:6px;
    classDef colReports fill:#86efac,stroke:#22c55e,stroke-width:1.5px,color:#14532d,font-weight:bold,rx:6px,ry:6px;
    classDef colSettings fill:#a78bfa,stroke:#7c3aed,stroke-width:1.5px,color:#2e1065,font-weight:bold,rx:6px,ry:6px;
    
    classDef item fill:#f8fafc,stroke:#cbd5e1,stroke-width:1px,color:#1e293b,rx:4px,ry:4px;
    classDef subitem fill:#f1f5f9,stroke:#94a3b8,stroke-width:1px,color:#334155,rx:4px,ry:4px;

    ADMIN["ADMIN"]:::root

    ADMIN --> LOGIN["Login"]:::subroot
    ADMIN --> DASH["Dashboard"]:::subroot

    DASH --> M_OVERVIEW["Overview"]:::colOverview
    DASH --> M_PRODUCTS["Products"]:::colProducts
    DASH --> M_CATEGORIES["Categories"]:::colCategories
    DASH --> M_ORDERS["Orders"]:::colOrders
    DASH --> M_CUSTOMERS["Customers"]:::colCustomers
    DASH --> M_PAYMENTS["Payments"]:::colPayments
    DASH --> M_REVIEWS["Reviews"]:::colReviews
    DASH --> M_PROMOTIONS["Promotions"]:::colPromotions
    DASH --> M_CMS["CMS"]:::colCMS
    DASH --> M_REPORTS["Reports"]:::colReports
    DASH --> M_SETTINGS["Settings"]:::colSettings

    %% 1. Overview
    M_OVERVIEW --> OV1["Total Sales"]:::item
    OV1 --> OV2["Total Orders"]:::item
    OV2 --> OV3["Total Products"]:::item
    OV3 --> OV4["Total Customers"]:::item
    OV4 --> OV5["Recent Orders"]:::item

    %% 2. Products
    M_PRODUCTS --> PR1["All Products"]:::item
    PR1 --> PR2["Add Product"]:::item
    PR2 --> PR3["Edit Product"]:::item
    PR3 --> PR4["Product Detail"]:::item
    PR4 --> PR5["Brands"]:::item
    PR5 --> PR6["Attributes (Size, Color, etc.)"]:::item

    %% 3. Categories
    M_CATEGORIES --> CT1["All Categories"]:::item
    CT1 --> CT2["Add Category"]:::item
    CT2 --> CT3["Edit Category"]:::item

    %% 4. Orders
    M_ORDERS --> OR1["All Orders"]:::item
    OR1 --> OR2["Order Detail"]:::item
    OR2 --> OR3["Status"]:::item
    OR3 --> ST1["Pending"]:::subitem
    ST1 --> ST2["Confirmed"]:::subitem
    ST2 --> ST3["Processing"]:::subitem
    ST3 --> ST4["Shipped"]:::subitem
    ST4 --> ST5["Delivered"]:::subitem
    ST5 --> ST6["Cancelled"]:::subitem

    %% 5. Customers
    M_CUSTOMERS --> CS1["All Customers"]:::item
    CS1 --> CS2["Customer Detail"]:::item

    %% 6. Payments
    M_PAYMENTS --> PM1["All Payments"]:::item
    PM1 --> PM2["Paid"]:::item
    PM2 --> PM3["Pending"]:::item
    PM3 --> PM4["Failed"]:::item
    PM4 --> PM5["Refunded"]:::item

    %% 7. Reviews
    M_REVIEWS --> RV1["All Reviews"]:::item
    RV1 --> RV2["Published"]:::item
    RV2 --> RV3["Pending / Reported"]:::item

    %% 8. Promotions
    M_PROMOTIONS --> PO1["Coupons"]:::item
    PO1 --> PO2["Discounts"]:::item

    %% 9. CMS
    M_CMS --> CM1["Banner"]:::item
    CM1 --> CM2["About"]:::item
    CM2 --> CM3["Terms"]:::item
    CM3 --> CM4["Policy"]:::item
    CM4 --> CM5["Contact us"]:::item

    %% 10. Reports
    M_REPORTS --> RP1["Sales Report"]:::item
    RP1 --> RP2["Order Report"]:::item
    RP2 --> RP3["Product Report"]:::item
    RP3 --> RP4["Customer Report"]:::item

    %% 11. Settings
    M_SETTINGS --> STG1["Store Settings"]:::item
    STG1 --> STG2["Admin Profile"]:::item
    STG2 --> STG3["Users & Roles Management"]:::item
    STG3 --> STG4["Payment Settings"]:::item
    STG4 --> STG5["Shipping Settings"]:::item
    STG5 --> STG6["Logout"]:::item`;

const state = {
  code: mermaidCode,
  mermaid: { theme: 'default' },
  autoSync: true,
  updateDiagram: true
};

const json = JSON.stringify(state);
const deflated = zlib.deflateSync(json);
const base64 = deflated.toString('base64');
const pakoUrl = 'https://mermaid.live/edit#pako:' + base64.replace(/\+/g, '-').replace(/\//g, '_');

console.log('--- ADMIN MERMAID LIVE LINK ---');
console.log(pakoUrl);
