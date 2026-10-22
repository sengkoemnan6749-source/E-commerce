export const INITIAL_CATEGORIES = [
  {
    id: 'audio',
    name: 'Audio & Acoustics',
    slug: 'audio',
    description: 'Studio-grade noise cancellation, beryllium drivers, and lossless wireless acoustics.',
    image: '/images/products/prod-001-main.png',
    itemCount: 10,
    badge: 'Popular',
    subcategories: [
      { name: 'Wireless Earbuds', slug: 'wireless-earbuds' },
      { name: 'Bluetooth Headphones', slug: 'bluetooth-headphones' },
      { name: 'Wired Earphones', slug: 'wired-earphones' },
      { name: 'Bluetooth Speakers', slug: 'bluetooth-speakers' },
      { name: 'Soundbars', slug: 'soundbars' },
      { name: 'Studio Headphones', slug: 'studio-headphones' },
      { name: 'Microphones', slug: 'microphones' },
      { name: 'Gaming Headsets', slug: 'gaming-headsets' },
      { name: 'Lavalier Microphones', slug: 'lavalier-microphones' },
      { name: 'USB Microphones', slug: 'usb-microphones' },
      { name: 'Portable Speakers', slug: 'portable-speakers' },
      { name: 'Conference Speakers', slug: 'conference-speakers' },
      { name: 'Audio Interfaces', slug: 'audio-interfaces' },
      { name: 'DACs & Amplifiers', slug: 'dacs-amplifiers' },
      { name: 'Subwoofers', slug: 'subwoofers' }
    ]
  },
  {
    id: 'wearables',
    name: 'Smart Wearables',
    slug: 'wearables',
    description: 'High-precision AMOLED displays, biosensors, and all-day health tracking.',
    image: '/images/products/prod-004-silver.png',
    itemCount: 10,
    badge: 'Trending',
    subcategories: [
      { name: 'Smartwatches', slug: 'smartwatches' },
      { name: 'Fitness Trackers', slug: 'fitness-trackers' },
      { name: 'Smart Rings', slug: 'smart-rings' },
      { name: 'Smart Bands', slug: 'smart-bands' },
      { name: 'Sports Watches', slug: 'sports-watches' },
      { name: 'Kids Smartwatches', slug: 'kids-smartwatches' },
      { name: 'Smart Glasses', slug: 'smart-glasses' },
      { name: 'Sleep Trackers', slug: 'sleep-trackers' },
      { name: 'Health Monitoring Devices', slug: 'health-monitoring-devices' },
      { name: 'GPS Trackers', slug: 'gps-trackers' }
    ]
  },
  {
    id: 'workspace',
    name: 'Workspace Peripherals',
    slug: 'workspace',
    description: 'Custom mechanical switches, CNC aluminum frames, and ergonomic productivity gear.',
    image: '/images/products/prod-006-main.png',
    itemCount: 10,
    badge: 'Hot',
    subcategories: [
      { name: 'Wireless Keyboards', slug: 'wireless-keyboards' },
      { name: 'Mechanical Keyboards', slug: 'mechanical-keyboards' },
      { name: 'Computer Mice', slug: 'computer-mice' },
      { name: 'Gaming Mice', slug: 'gaming-mice' },
      { name: 'Webcams', slug: 'webcams' },
      { name: 'USB Hubs', slug: 'usb-hubs' },
      { name: 'Mouse Pads', slug: 'mouse-pads' },
      { name: 'Laptop Stands', slug: 'laptop-stands' },
      { name: 'Monitor Stands', slug: 'monitor-stands' },
      { name: 'Docking Stations', slug: 'docking-stations' },
      { name: 'Presentation Clickers', slug: 'presentation-clickers' },
      { name: 'Number Pads', slug: 'number-pads' },
      { name: 'Ergonomic Keyboards', slug: 'ergonomic-keyboards' },
      { name: 'Drawing Tablets', slug: 'drawing-tablets' },
      { name: 'External Keypads', slug: 'external-keypads' }
    ]
  },
  {
    id: 'power',
    name: 'Power & Mobile',
    slug: 'power',
    description: 'Gallium Nitride (GaN III) high-wattage charging, magnetic wireless power banks.',
    image: '/images/products/prod-009-charger.png',
    itemCount: 10,
    badge: 'Essential',
    subcategories: [
      { name: 'Power Banks', slug: 'power-banks' },
      { name: 'Wall Chargers', slug: 'wall-chargers' },
      { name: 'Wireless Chargers', slug: 'wireless-chargers' },
      { name: 'Charging Cables', slug: 'charging-cables' },
      { name: 'Car Chargers', slug: 'car-chargers' },
      { name: 'GaN Chargers', slug: 'gan-chargers' },
      { name: 'Multi-Port Chargers', slug: 'multi-port-chargers' },
      { name: 'USB-C Chargers', slug: 'usb-c-chargers' },
      { name: 'MagSafe Chargers', slug: 'magsafe-chargers' },
      { name: 'Charging Stations', slug: 'charging-stations' },
      { name: 'Travel Adapters', slug: 'travel-adapters' },
      { name: 'Solar Power Banks', slug: 'solar-power-banks' },
      { name: 'Battery Packs', slug: 'battery-packs' },
      { name: 'Power Strips', slug: 'power-strips' },
      { name: 'Portable Power Stations', slug: 'portable-power-stations' }
    ]
  }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'TechTonic ANC Pro Headphones',
    category: 'audio',
    categoryName: 'Audio & Acoustics',
    subcategory: 'Bluetooth Headphones',
    subcategorySlug: 'bluetooth-headphones',
    price: 119.99,
    originalPrice: 129.99,
    rating: 4.9,
    reviewsCount: 342,
    stock: 24,
    isBestSeller: true,
    isFeatured: true,
    badge: 'Best Seller',
    tagline: '40mm Beryllium Drivers · 60h Battery · -45dB Hybrid ANC',
    description: 'Engineered for audio purists and remote creators. The TechTonic ANC Pro delivers studio-reference acoustic fidelity powered by custom 40mm beryllium dynamic drivers and state-of-the-art quad-microphone hybrid active noise cancellation.',
    images: [
      '/images/products/prod-001-main.png',
      '/images/products/prod-001-alt.png',
      '/images/products/prod-001-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Stealth Matte Black',
        colorHex: '#18181b',
        image: '/images/products/prod-001-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Glacier Frost White',
        colorHex: '#f1f5f9',
        image: '/images/products/prod-001-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Midnight Sapphire Blue',
        colorHex: '#1e3a8a',
        image: '/images/products/prod-001-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Driver Size': '40mm Custom Beryllium Diaphragm',
      'Noise Cancellation': '-45dB Hybrid Active (Dual-feed)',
      'Battery Life': '60 Hours (ANC Off) / 45 Hours (ANC On)',
      'Fast Charge': '10 min charge = 5 hours playback (USB-C)',
      'Bluetooth': 'Bluetooth 5.3 + Multipoint LE Audio',
      'Codecs': 'LDAC, AAC, SBC, aptX Adaptive',
      'Weight': '248 grams',
      'Warranty': '1-Year Official Phnom Penh Lab Warranty'
    }
  },
  {
    id: 'prod-002',
    name: 'TechTonic Pods Pure',
    category: 'audio',
    categoryName: 'Audio & Acoustics',
    subcategory: 'Wireless Earbuds',
    subcategorySlug: 'wireless-earbuds',
    price: 69.99,
    originalPrice: 79.99,
    rating: 4.8,
    reviewsCount: 188,
    stock: 35,
    isBestSeller: false,
    isFeatured: true,
    badge: 'Popular',
    tagline: 'Dual Driver TWS · Spatial Audio · Wireless Case',
    description: 'Ultra-compact true wireless earbuds with balanced armatures and graphene woofers. Features IPX5 sweat resistance and intuitive capacitive touch sensors for seamless track switching.',
    images: [
      '/images/products/prod-002-main.png',
      '/images/products/prod-002-alt.png',
      '/images/products/prod-002-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Pearl White',
        colorHex: '#f8fafc',
        image: '/images/products/prod-002-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Obsidian Matte Black',
        colorHex: '#18181b',
        image: '/images/products/prod-002-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Lavender Mist',
        colorHex: '#c084fc',
        image: '/images/products/prod-002-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Audio Driver': '10mm Dynamic + Knowles Balanced Armature',
      'Battery Life': '8 hours per charge + 32 hours case',
      'Water Resistance': 'IPX5 Sweat & Splash Guard',
      'Wireless Charging': 'Qi-Certified & USB-C',
      'Weight': '4.2g per earbud'
    }
  },
  {
    id: 'prod-003',
    name: 'Studio Master Reference Monitor',
    category: 'audio',
    categoryName: 'Audio & Acoustics',
    subcategory: 'Bluetooth Speakers',
    subcategorySlug: 'bluetooth-speakers',
    price: 199.99,
    originalPrice: 229.99,
    rating: 4.9,
    reviewsCount: 94,
    stock: 8,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Studio',
    tagline: 'Nearfield Active Desktop Monitor Pair',
    description: 'High-resolution desktop reference speakers tuned for video editors, music producers, and acoustic connoisseurs desiring uncolored flat frequency curve.',
    images: [
      '/images/products/prod-003-main.png',
      '/images/products/prod-003-alt.png',
      '/images/products/prod-003-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Studio Arctic White',
        colorHex: '#f8fafc',
        image: '/images/products/prod-003-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Obsidian Carbon Black',
        colorHex: '#18181b',
        image: '/images/products/prod-003-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Titanium Silver',
        colorHex: '#94a3b8',
        image: '/images/products/prod-003-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Output Power': '80W RMS Total',
      'Frequency Response': '45Hz - 22kHz',
      'Inputs': 'Optical, TRS Balanced, RCA, Bluetooth 5.2',
      'Cabinet': 'Acoustic-inert MDF with Front Port'
    }
  },
  {
    id: 'prod-004',
    name: 'TechTonic Pulse Smartwatch V2',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    subcategory: 'Smartwatches',
    subcategorySlug: 'smartwatches',
    price: 149.99,
    originalPrice: 169.99,
    rating: 4.8,
    reviewsCount: 215,
    stock: 18,
    isBestSeller: true,
    isFeatured: true,
    badge: 'New Gen',
    tagline: '1.43" AMOLED 60Hz · SpO2 · Titanium Bezel',
    description: 'Crafted with aerospace-grade titanium alloy and curved sapphire crystal glass. Features 24/7 heart rate variability, SpO2 sensor, sleep staging, and 120+ sport modes with GPS.',
    images: [
      '/images/products/prod-004-main.png',
      '/images/products/prod-004-alt.png',
      '/images/products/prod-004-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Space Black',
        colorHex: '#18181b',
        image: '/images/products/prod-004-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Starlight Rose Gold',
        colorHex: '#f3e8d7',
        image: '/images/products/prod-004-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Midnight Ocean Blue',
        colorHex: '#1e3a8a',
        image: '/images/products/prod-004-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Display': '1.43" AMOLED, 466x466, 1000 nits Peak',
      'Sensors': 'Optical HR, SpO2, Accelerometer, Barometer, ECG',
      'Battery Life': 'Up to 14 Days Typical Use',
      'Water Resistance': '5 ATM + IP68 (Swim-Proof)',
      'Connectivity': 'Bluetooth 5.3 BLE + Standalone GPS'
    }
  },
  {
    id: 'prod-005',
    name: 'ActiveTrack Band',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    subcategory: 'Fitness Trackers',
    subcategorySlug: 'fitness-trackers',
    price: 49.99,
    originalPrice: 59.99,
    rating: 4.7,
    reviewsCount: 142,
    stock: 40,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Lightweight',
    tagline: 'Ultralight Fitness Tracker · 21-Day Battery',
    description: 'Weighing only 18 grams, the ActiveTrack Band monitors steps, workout calorie burn, stress score, and rem sleep cycles while remaining completely unobtrusive.',
    images: [
      '/images/products/prod-005-main.png',
      '/images/products/prod-005-alt.png',
      '/images/products/prod-005-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Midnight Obsidian Black',
        colorHex: '#18181b',
        image: '/images/products/prod-005-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Sage Emerald Green',
        colorHex: '#10b981',
        image: '/images/products/prod-005-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Sunset Coral Orange',
        colorHex: '#f97316',
        image: '/images/products/prod-005-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Weight': '18.5 grams with strap',
      'Battery': '21 days continuous tracking',
      'Display': '1.1" OLED Sunlight Display',
      'Water Rating': '50 meters water resistant'
    }
  },
  {
    id: 'prod-006',
    name: 'TechTonic Pro 75% Keyboard',
    category: 'workspace',
    categoryName: 'Workspace Peripherals',
    subcategory: 'Mechanical Keyboards',
    subcategorySlug: 'mechanical-keyboards',
    price: 129.99,
    originalPrice: 149.99,
    rating: 4.9,
    reviewsCount: 420,
    stock: 12,
    isBestSeller: true,
    isFeatured: true,
    badge: 'Top Choice',
    tagline: 'CNC Aluminum · Gasket Mount · Hot-Swappable',
    description: 'The definitive mechanical typing instrument for developers and writers. Features sound-dampening PORON foam, screw-in pre-lubed stabilizers, south-facing RGB, and QMK/VIA key remapping support.',
    images: [
      '/images/products/prod-006-main.png',
      '/images/products/prod-006-alt.png',
      '/images/products/prod-006-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'CNC Charcoal Gray',
        colorHex: '#334155',
        image: '/images/products/prod-006-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Glacier White & Mint',
        colorHex: '#f1f5f9',
        image: '/images/products/prod-006-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Cyber Midnight Navy',
        colorHex: '#1e3a8a',
        image: '/images/products/prod-006-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Layout': '75% Compact (82 Keys + Rotary Dial)',
      'Mount Type': 'Double Gasket Mount with PC Plate',
      'Case': 'CNC Anodized 6063 Aluminum',
      'Connectivity': 'Tri-Mode: 2.4GHz Wireless, Bluetooth 5.1, USB-C',
      'Battery': '4000mAh Rechargeable (200h without RGB)',
      'Firmware': 'QMK / VIA Web Configurator Compatible'
    }
  },
  {
    id: 'prod-007',
    name: 'TechTonic Ergonomic Mouse',
    category: 'workspace',
    categoryName: 'Workspace Peripherals',
    subcategory: 'Computer Mice',
    subcategorySlug: 'computer-mice',
    price: 59.99,
    originalPrice: 69.99,
    rating: 4.8,
    reviewsCount: 160,
    stock: 28,
    isBestSeller: false,
    isFeatured: true,
    badge: 'Ergonomic',
    tagline: '57° Natural Handshake Angle · Silent Clicks',
    description: 'Eliminate wrist fatigue and carpal strain with a 57-degree natural handshake posture. Built with an optical sensor up to 4000 DPI and quiet-touch micro-switches.',
    images: [
      '/images/products/prod-007-main.png',
      '/images/products/prod-007-alt.png',
      '/images/products/prod-007-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Charcoal Slate',
        colorHex: '#334155',
        image: '/images/products/prod-007-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Polar Glacier White',
        colorHex: '#f8fafc',
        image: '/images/products/prod-007-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Blush Rose Pink',
        colorHex: '#fb7185',
        image: '/images/products/prod-007-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Sensor': 'PAW3311 4000 DPI Optical',
      'Angle': '57° Vertical Ergonomic Grip',
      'Buttons': '6 Programmable Silent Buttons',
      'Battery': 'Rechargeable 500mAh (Up to 3 months per charge)'
    }
  },
  {
    id: 'prod-008',
    name: 'DeskMat Stealth Precision XXL',
    category: 'workspace',
    categoryName: 'Workspace Peripherals',
    subcategory: 'Mouse Pads',
    subcategorySlug: 'mouse-pads',
    price: 24.99,
    originalPrice: 29.99,
    rating: 4.9,
    reviewsCount: 88,
    stock: 45,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Accessory',
    tagline: '900x400mm Micro-weave Water Resistant',
    description: 'Heavy 4mm thickness non-slip natural rubber base with anti-fraying stitched edges and fluid-repellent nano-coating.',
    images: [
      '/images/products/prod-008-main.png',
      '/images/products/prod-008-alt.png',
      '/images/products/prod-008-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Stealth Obsidian Topo',
        colorHex: '#18181b',
        image: '/images/products/prod-008-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Blueprint Cyber Cyan',
        colorHex: '#0284c7',
        image: '/images/products/prod-008-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Lunar Slate White',
        colorHex: '#e2e8f0',
        image: '/images/products/prod-008-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Dimensions': '900 x 400 x 4 mm',
      'Surface': 'Micro-Textured Low Friction Cloth',
      'Base': 'Heavy Textured Rubber Non-Slip'
    }
  },
  {
    id: 'prod-009',
    name: 'TechTonic 100W GaN Charger',
    category: 'power',
    categoryName: 'Power & Mobile',
    subcategory: 'GaN Chargers',
    subcategorySlug: 'gan-chargers',
    price: 45.99,
    originalPrice: 54.99,
    rating: 4.9,
    reviewsCount: 275,
    stock: 30,
    isBestSeller: true,
    isFeatured: true,
    badge: 'GaN III',
    tagline: '3x USB-C + 1x USB-A · PD 3.0 · Foldable Plug',
    description: 'Powered by Navitas Gallium Nitride III ICs. Powers MacBook Pro 16", iPad Pro, iPhone, and accessories simultaneously in a footprint 40% smaller than OEM chargers.',
    images: [
      '/images/products/prod-009-main.png',
      '/images/products/prod-009-alt.png',
      '/images/products/prod-009-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Matte Stealth Black',
        colorHex: '#18181b',
        image: '/images/products/prod-009-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Pure Arctic White',
        colorHex: '#f8fafc',
        image: '/images/products/prod-009-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Cyber Blue GaNFast',
        colorHex: '#0284c7',
        image: '/images/products/prod-009-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Total Output': '100W Max',
      'Ports': '2x USB-C (100W), 1x USB-C (30W), 1x USB-A (22.5W)',
      'Protocol': 'PD 3.0, QC 4+, PPS (Samsung Super Fast 2.0)',
      'Protection': 'Active ThermalGuard 4.0 Overvoltage & Short Protection'
    }
  },
  {
    id: 'prod-010',
    name: 'TechTonic MagSafe 10,000mAh Power Bank',
    category: 'power',
    categoryName: 'Power & Mobile',
    subcategory: 'Power Banks',
    subcategorySlug: 'power-banks',
    price: 39.99,
    originalPrice: 49.99,
    rating: 4.8,
    reviewsCount: 198,
    stock: 22,
    isBestSeller: false,
    isFeatured: true,
    badge: 'MagSafe',
    tagline: '15W Magnetic Fast Snap · 20W PD USB-C Bi-directional',
    description: 'Snap-and-charge magnetic power bank featuring strong N52 neodymium magnets, a built-in foldout zinc-alloy kickstand, and real-time digital battery percentage display.',
    images: [
      '/images/products/prod-010-main.png',
      '/images/products/prod-010-alt.png',
      '/images/products/prod-010-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Space Grey Snap',
        colorHex: '#64748b',
        image: '/images/products/prod-010-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Pearl White Snap',
        colorHex: '#f8fafc',
        image: '/images/products/prod-010-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Obsidian Black Snap',
        colorHex: '#18181b',
        image: '/images/products/prod-010-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Capacity': '10,000mAh (38.5Wh)',
      'Wireless Output': '15W / 10W / 7.5W / 5W',
      'Wired Output': 'USB-C PD 20W Max',
      'Stand': 'Integrated Multi-angle Zinc Kickstand'
    }
  },
  {
    id: 'prod-011',
    name: '240W Braided USB-C Cable (2M)',
    category: 'power',
    categoryName: 'Power & Mobile',
    subcategory: 'Charging Cables',
    subcategorySlug: 'charging-cables',
    price: 16.99,
    originalPrice: 19.99,
    rating: 4.9,
    reviewsCount: 110,
    stock: 55,
    isBestSeller: false,
    isFeatured: false,
    badge: '240W PD',
    tagline: 'E-Marker Chip · Kevlar Reinforced · 480Mbps',
    description: 'Certified USB-IF 240W EPR charging cable with ultra-durable 48-strand double-braided nylon sleeve and gold-plated terminals.',
    images: [
      '/images/products/prod-011-main.png',
      '/images/products/prod-011-alt.png',
      '/images/products/prod-011-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Charcoal Black Braided',
        colorHex: '#1e293b',
        image: '/images/products/prod-011-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Silver Slate Braided',
        colorHex: '#cbd5e1',
        image: '/images/products/prod-011-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Alpine Electric Blue',
        colorHex: '#2563eb',
        image: '/images/products/prod-011-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Max Power': '240W (48V / 5A)',
      'Length': '2 Meters (6.6 Feet)',
      'Bend Test': '30,000+ Verified Cycles'
    }
  },
  {
    id: 'prod-012',
    name: 'TechTonic Pulse Ultra Titanium',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    subcategory: 'Smartwatches',
    subcategorySlug: 'smartwatches',
    price: 219.99,
    originalPrice: 249.99,
    rating: 5.0,
    reviewsCount: 76,
    stock: 6,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Pro Tier',
    tagline: 'Dual-frequency GPS · Sapphire Crystal · 100m Dive Safe',
    description: 'The pinnacle of rugged smartwatch engineering. Unibody grade-5 titanium casing, sapphire crystal face, dual-frequency L1+L5 GPS navigation, and 30-day battery life.',
    images: [
      '/images/products/prod-012-main.png',
      '/images/products/prod-012-alt.png',
      '/images/products/prod-012-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Brushed Titanium',
        colorHex: '#94a3b8',
        image: '/images/products/prod-012-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Tactical DLC Black',
        colorHex: '#18181b',
        image: '/images/products/prod-012-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Deep Ocean Navy',
        colorHex: '#1d4ed8',
        image: '/images/products/prod-012-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Case': 'Grade 5 Aerospace Titanium',
      'Battery': '30 days expedition mode',
      'GPS': 'Dual-Band L1 + L5 GNSS',
      'Dive Rating': 'EN13319 100-meter Certified'
    }
  },
  {
    id: 'prod-013',
    name: 'TechTonic AudioForge Hi-Fi DAC & Amp',
    category: 'audio',
    categoryName: 'Audio & Acoustics',
    subcategory: 'DACs & Amplifiers',
    subcategorySlug: 'dacs-amplifiers',
    price: 179.99,
    originalPrice: 199.99,
    rating: 5.0,
    reviewsCount: 64,
    stock: 14,
    isBestSeller: false,
    isFeatured: true,
    badge: 'Hi-Fi Audio',
    tagline: 'Dual ESS Sabre 9038 · DSD512 · 4.4mm Balanced Output',
    description: 'Audiophile-grade desktop USB DAC and balanced headphone amplifier. Unlocks master-quality lossless acoustic reproduction with ultra-low 0.0001% THD+N distortion and precision volume control.',
    images: [
      '/images/products/prod-013-main.png',
      '/images/products/prod-013-alt.png',
      '/images/products/prod-013-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Space Grey Aluminum',
        colorHex: '#64748b',
        image: '/images/products/prod-013-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Glacier Silver',
        colorHex: '#e2e8f0',
        image: '/images/products/prod-013-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Stealth Matte Black',
        colorHex: '#18181b',
        image: '/images/products/prod-013-v3.png',
        inStock: true
      }
    ],
    specs: {
      'DAC Chipset': 'Dual ESS Sabre ES9038Q2M',
      'Supported Formats': 'PCM 32-bit/768kHz, DSD512 Native, MQA',
      'Output Power': '1200mW @ 32Ω Balanced / 600mW Single-Ended',
      'Outputs': '4.4mm Balanced, 6.35mm SE, RCA Line Out',
      'Inputs': 'USB-C Audio, Optical Toslink, Coaxial SPDIF'
    }
  },
  {
    id: 'prod-014',
    name: 'TechTonic 3-in-1 Foldable MagSafe Station',
    category: 'power',
    categoryName: 'Power & Mobile',
    subcategory: 'Charging Stations',
    subcategorySlug: 'charging-stations',
    price: 69.99,
    originalPrice: 79.99,
    rating: 4.8,
    reviewsCount: 145,
    stock: 35,
    isBestSeller: false,
    isFeatured: true,
    badge: 'Qi2 15W',
    tagline: 'Foldable Magnetic Charging · iPhone, Watch & Pods · Travel Pouch',
    description: 'The ultimate all-in-one travel charging station. Fast-charges iPhone with 15W Qi2 MagSafe, Apple Watch ultra fast charger, and dedicated AirPods wireless pad in a palm-sized folding aircraft aluminum package.',
    images: [
      '/images/products/prod-014-main.png',
      '/images/products/prod-014-alt.png',
      '/images/products/prod-014-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Matte Obsidian',
        colorHex: '#18181b',
        image: '/images/products/prod-014-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Silver Aluminum',
        colorHex: '#cbd5e1',
        image: '/images/products/prod-014-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Space Gray',
        colorHex: '#64748b',
        image: '/images/products/prod-014-v3.png',
        inStock: true
      }
    ],
    specs: {
      'MagSafe Output': '15W Fast Wireless Qi2 Certified',
      'Watch Output': '5W Fast Magnetic Puck',
      'Earbuds Output': '5W Qi Charging Tray',
      'Input': 'USB-C 30W+ PD Required',
      'Materials': 'CNC Anodized Aluminum + Silicone Base'
    }
  },
  {
    id: 'prod-015',
    name: 'TechTonic PowerTower 6-Port Desktop Hub',
    category: 'power',
    categoryName: 'Power & Mobile',
    subcategory: 'Multi-Port Chargers',
    subcategorySlug: 'multi-port-chargers',
    price: 89.99,
    originalPrice: 109.99,
    rating: 4.9,
    reviewsCount: 210,
    stock: 19,
    isBestSeller: true,
    isFeatured: false,
    badge: '200W GaN',
    tagline: '200W Total Output · 4x USB-C + 2x USB-A · Active Cooling',
    description: 'Clean up your entire desk with a single 200W GaN desktop power hub. Fast charges two 16" laptops simultaneously at 100W each while delivering dedicated power to tablets and phones.',
    images: [
      '/images/products/prod-015-main.png',
      '/images/products/prod-015-alt.png',
      '/images/products/prod-015-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Stealth Black',
        colorHex: '#18181b',
        image: '/images/products/prod-015-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Space Silver',
        colorHex: '#cbd5e1',
        image: '/images/products/prod-015-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Cyber Blue',
        colorHex: '#0284c7',
        image: '/images/products/prod-015-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Max Output': '200W Combined GaN III',
      'Port Configuration': '4x USB-C PD 3.0 (up to 140W single), 2x USB-A QC 4.0',
      'Safety': 'ThermalGuard Intelligent Sensor & Surge Protection',
      'Power Cord': '1.5M Heavy Duty Detachable AC Cable'
    }
  },
  {
    id: 'prod-016',
    name: 'Studio Master Pro Acoustic Monitor (White Edition)',
    category: 'audio',
    categoryName: 'Audio & Acoustics',
    subcategory: 'Bluetooth Speakers',
    subcategorySlug: 'bluetooth-speakers',
    price: 219.99,
    originalPrice: 249.99,
    rating: 4.9,
    reviewsCount: 112,
    stock: 8,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Studio White',
    tagline: '5" Kevlar Woofers · Bi-Amp 100W RMS · Balanced XLR & TRS',
    description: 'Pristine white studio active monitors for demanding producers and acousticians. Featuring custom 5-inch white woven Kevlar low-frequency drivers and 1-inch silk dome tweeters.',
    images: [
      '/images/products/prod-016-main.png',
      '/images/products/prod-016-alt.png',
      '/images/products/prod-016-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Satin Studio White',
        colorHex: '#f8fafc',
        image: '/images/products/prod-016-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Obsidian Black',
        colorHex: '#18181b',
        image: '/images/products/prod-016-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Cyber Cyan Accent',
        colorHex: '#06b6d4',
        image: '/images/products/prod-016-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Power': '100W RMS Total Bi-Amplified Class-D',
      'Frequency Response': '42Hz - 24kHz',
      'Inputs': 'Balanced XLR, 1/4" TRS, RCA Unbalanced',
      'Controls': 'Acoustic Space Calibration & HF Trim'
    }
  },
  {
    id: 'prod-017',
    name: 'TechTonic SlimKey Wireless Keyboard',
    category: 'workspace',
    categoryName: 'Workspace Peripherals',
    subcategory: 'Wireless Keyboards',
    subcategorySlug: 'wireless-keyboards',
    price: 69.99,
    originalPrice: 79.99,
    rating: 4.8,
    reviewsCount: 142,
    stock: 25,
    isBestSeller: false,
    isFeatured: true,
    badge: 'Ultra-Slim',
    tagline: 'Scissor-Switch Typing · Multi-Device Bluetooth · Dual Mac/Win',
    description: 'Ultralight low-profile wireless keyboard crafted with whisper-quiet scissor key mechanisms, smart power-saving sleep mode, and seamless switching across 3 Bluetooth devices.',
    images: [
      '/images/products/prod-017-main.png',
      '/images/products/prod-017-alt.png',
      '/images/products/prod-017-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Space Charcoal',
        colorHex: '#1e293b',
        image: '/images/products/prod-017-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Glacier Silver & White',
        colorHex: '#f1f5f9',
        image: '/images/products/prod-017-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Rose Quartz',
        colorHex: '#f43f5e',
        image: '/images/products/prod-017-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Switch Type': 'Low-Profile Scissor Keys (1.5mm travel)',
      'Connectivity': 'Bluetooth 5.2 + 2.4GHz USB Receiver',
      'Battery Life': 'Up to 5 Months (Rechargeable USB-C)',
      'Weight': '420 grams'
    }
  },
  {
    id: 'prod-018',
    name: 'TechTonic NanoGlide Wireless Optical Mouse',
    category: 'workspace',
    categoryName: 'Workspace Peripherals',
    subcategory: 'Computer Mice',
    subcategorySlug: 'computer-mice',
    price: 34.99,
    originalPrice: 39.99,
    rating: 4.9,
    reviewsCount: 118,
    stock: 38,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Silent Click',
    tagline: 'Quiet-Click Microswitches · 24-Month Battery · Rubberized Grip',
    description: 'Sleek contoured travel mouse with acoustic-dampened silent buttons, precision 2400 DPI optical sensor, and durable rubberized side grips for fatigue-free all-day browsing.',
    images: [
      '/images/products/prod-018-main.png',
      '/images/products/prod-018-alt.png',
      '/images/products/prod-018-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Graphite Grey',
        colorHex: '#475569',
        image: '/images/products/prod-018-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Arctic White',
        colorHex: '#f8fafc',
        image: '/images/products/prod-018-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Emerald Teal',
        colorHex: '#0d9488',
        image: '/images/products/prod-018-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Sensor': 'Advanced 2400 DPI Optical Tracking',
      'Battery Life': '24 Months (1x AA included)',
      'Scroll Wheel': 'Micro-Gear Precision Roller with Tilt-Wheel',
      'Buttons': '5 Silent Tactile Click Buttons'
    }
  },
  {
    id: 'prod-019',
    name: 'TechTonic Cobalt Tune Wireless Headphones',
    category: 'audio',
    categoryName: 'Audio & Acoustics',
    subcategory: 'Bluetooth Headphones',
    subcategorySlug: 'bluetooth-headphones',
    price: 89.99,
    originalPrice: 109.99,
    rating: 4.9,
    reviewsCount: 230,
    stock: 28,
    isBestSeller: true,
    isFeatured: true,
    badge: 'Pure Bass',
    tagline: '40mm Dynamic Bass Drivers · 50h Playback · Foldable Design',
    description: 'Energetic acoustic response tuned with punchy low-end sub-bass and ultra-clear highs. Features soft-padded on-ear memory cushions, built-in call mic, and quick 5-minute charge for 3 hours of playtime.',
    images: [
      '/images/products/prod-019-main.png',
      '/images/products/prod-019-alt.png',
      '/images/products/prod-019-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Cobalt Blue',
        colorHex: '#2563eb',
        image: '/images/products/prod-019-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Coral Rose Pink',
        colorHex: '#f43f5e',
        image: '/images/products/prod-019-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Stealth Midnight Black',
        colorHex: '#18181b',
        image: '/images/products/prod-019-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Driver Size': '40mm High-Output Dynamic Transducer',
      'Frequency': '20Hz - 20kHz Deep Bass Curve',
      'Battery': '50 Hours Continuous Listening',
      'Weight': '160 grams Ultra-Lightweight'
    }
  },
  {
    id: 'prod-020',
    name: 'TechTonic Studio Pro DJ Master Headphones',
    category: 'audio',
    categoryName: 'Audio & Acoustics',
    subcategory: 'Studio Headphones',
    subcategorySlug: 'studio-headphones',
    price: 169.99,
    originalPrice: 199.99,
    rating: 5.0,
    reviewsCount: 94,
    stock: 12,
    isBestSeller: false,
    isFeatured: true,
    badge: 'Pro DJ',
    tagline: '50mm Neodymium Drivers · Cyan LED Acoustic Trim · Coiled Studio Cable',
    description: 'The choice of professional sound designers and electronic producers. Delivers transparent flat-response audio monitoring, 90-degree swiveling earcups for one-ear monitoring, and dual-output 3.5mm/6.35mm locking cable.',
    images: [
      '/images/products/prod-020-main.png',
      '/images/products/prod-020-alt.png',
      '/images/products/prod-020-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Studio Cyan & Gunmetal',
        colorHex: '#06b6d4',
        image: '/images/products/prod-020-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Electric Amber Glow',
        colorHex: '#f59e0b',
        image: '/images/products/prod-020-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Glacier Frost White',
        colorHex: '#f8fafc',
        image: '/images/products/prod-020-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Driver': '50mm Custom Neodymium Studio Magnet',
      'Impedance': '32 Ohms (Easy to Drive on Phones & Interfaces)',
      'Cable': '3-Meter Coiled Heavy Duty OFC Copper with 6.35mm Gold Adapter',
      'Acoustic Seal': 'Circumaural Sound-Isolating Earcups'
    }
  },
  {
    id: 'prod-021',
    name: 'TechTonic Halo Titan Smart Ring',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    subcategory: 'Smart Rings',
    subcategorySlug: 'smart-rings',
    price: 199.99,
    originalPrice: 229.99,
    rating: 4.9,
    reviewsCount: 88,
    stock: 22,
    isBestSeller: true,
    isFeatured: true,
    badge: 'Titanium',
    tagline: 'Titanium Aerocraft Shell · Sleep & Readiness Score · 7-Day Battery',
    description: 'Precision biometric ring forged from aerospace grade titanium with hypoallergenic PVD coating. Continuous heart rate variability (HRV), skin temperature tracking, and comprehensive sleep stage staging without a screen distraction.',
    images: [
      '/images/products/prod-021-main.png',
      '/images/products/prod-021-alt.png',
      '/images/products/prod-021-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Stealth Titanium',
        colorHex: '#475569',
        image: '/images/products/prod-021-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Rose Gold PVD',
        colorHex: '#f43f5e',
        image: '/images/products/prod-021-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Mirror Chrome Silver',
        colorHex: '#e2e8f0',
        image: '/images/products/prod-021-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Material': 'Grade 5 Aerospace Titanium + Medical PVD',
      'Sensors': 'Green/Red Optical PPG, Skin Temperature, 3D Accelerometer',
      'Water Resistance': '100m (10 ATM) Dive Proof',
      'Battery Life': 'Up to 7 Days on a Single 45-min Charge',
      'Weight': 'Just 3.5 grams'
    }
  },
  {
    id: 'prod-022',
    name: 'TechTonic Lumina 4K Pro Webcam',
    category: 'workspace',
    categoryName: 'Workspace Peripherals',
    subcategory: 'Webcams',
    subcategorySlug: 'webcams',
    price: 139.99,
    originalPrice: 159.99,
    rating: 4.9,
    reviewsCount: 156,
    stock: 18,
    isBestSeller: true,
    isFeatured: true,
    badge: '4K 60FPS',
    tagline: 'Sony STARVIS CMOS · Dual Stereo Beamforming Mics · Magnetic Privacy Shutter',
    description: 'Broadcast-quality 4K ultra-high-definition webcam engineered with large 1/2.8" Sony STARVIS CMOS sensor, HDR color science, AI subject auto-framing, and an acoustic-isolating stereo microphone array.',
    images: [
      '/images/products/prod-022-main.png',
      '/images/products/prod-022-alt.png',
      '/images/products/prod-022-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Matte Obsidian',
        colorHex: '#18181b',
        image: '/images/products/prod-022-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Studio Silver',
        colorHex: '#cbd5e1',
        image: '/images/products/prod-022-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Cyber Crimson Accent',
        colorHex: '#e11d48',
        image: '/images/products/prod-022-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Resolution': '4K UHD (3840x2160) @ 30/60 FPS, 1080p @ 60 FPS',
      'Sensor': '1/2.8" Sony STARVIS Back-Illuminated Sensor',
      'Field of View': 'Adjustable 65° / 78° / 90° FoV',
      'Mounting': 'Universal Monitor Mount + 1/4" Tripod Thread',
      'Connection': 'Detachable USB-C 3.2 Gen 1 (2m Braided)'
    }
  },
  {
    id: 'prod-023',
    name: 'TechTonic VoxPro Studio USB Microphone',
    category: 'audio',
    categoryName: 'Audio & Acoustics',
    subcategory: 'USB Microphones',
    subcategorySlug: 'usb-microphones',
    price: 109.99,
    originalPrice: 129.99,
    rating: 4.8,
    reviewsCount: 174,
    stock: 26,
    isBestSeller: false,
    isFeatured: true,
    badge: 'Studio USB',
    tagline: '24-Bit/96kHz Condenser · Zero-Latency Monitoring · Spider Shockmount',
    description: 'Plug-and-play USB condenser microphone for podcasting, streaming, and studio voiceovers. Features custom 25mm cardioid capsule, tap-to-mute capacitive sensor with RGB ring indicator, and included vibration-dampening spider shockmount.',
    images: [
      '/images/products/prod-023-main.png',
      '/images/products/prod-023-alt.png',
      '/images/products/prod-023-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Midnight Charcoal Black',
        colorHex: '#1e293b',
        image: '/images/products/prod-023-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Polar Silver',
        colorHex: '#cbd5e1',
        image: '/images/products/prod-023-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Crimson Red Edition',
        colorHex: '#e11d48',
        image: '/images/products/prod-023-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Sample Rate': '24-Bit / 96kHz High-Resolution Audio',
      'Polar Pattern': 'Precision Cardioid',
      'Capsule': '25mm Studio Gold-Sputtered Condenser',
      'Outputs': 'USB-C Digital + 3.5mm Headphone Jack (Zero Latency)',
      'Mount': 'Reinforced Anti-Vibration Elastic Suspension Shockmount'
    }
  },
  {
    id: 'prod-024',
    name: 'TechTonic Viper Ultralight Esports Mouse',
    category: 'workspace',
    categoryName: 'Workspace Peripherals',
    subcategory: 'Gaming Mice',
    subcategorySlug: 'gaming-mice',
    price: 79.99,
    originalPrice: 89.99,
    rating: 4.9,
    reviewsCount: 204,
    stock: 31,
    isBestSeller: true,
    isFeatured: true,
    badge: '52g Esports',
    tagline: '52 Grams Featherweight · PAW3395 26K Sensor · 4000Hz Polling',
    description: 'Competitive wireless gaming mouse engineered for tournament precision. Ultra-light 52-gram honeycomb shell, PixArt PAW3395 26,000 DPI optical sensor, pure virgin PTFE skates, and optical switches with 100-million click lifespan.',
    images: [
      '/images/products/prod-024-main.png',
      '/images/products/prod-024-alt.png',
      '/images/products/prod-024-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Stealth Black Hex',
        colorHex: '#18181b',
        image: '/images/products/prod-024-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Glacier White Hex',
        colorHex: '#f8fafc',
        image: '/images/products/prod-024-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Neon Cyber Cyan',
        colorHex: '#06b6d4',
        image: '/images/products/prod-024-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Weight': '52 Grams (+- 2g)',
      'Sensor': 'PixArt PAW3395 Flagship (26,000 DPI, 650 IPS, 50G)',
      'Polling Rate': 'Up to 4000Hz Wireless Ultra-Fast Polling',
      'Switches': 'TTC Gold Optical (100M Clicks)',
      'Battery Life': '80 Hours continuous competitive gaming'
    }
  },
  {
    id: 'prod-025',
    name: 'TechTonic CinemaSound Dolby Atmos Soundbar',
    category: 'audio',
    categoryName: 'Audio & Acoustics',
    subcategory: 'Soundbars',
    subcategorySlug: 'soundbars',
    price: 249.99,
    originalPrice: 289.99,
    rating: 4.9,
    reviewsCount: 119,
    stock: 14,
    isBestSeller: false,
    isFeatured: true,
    badge: 'Dolby Atmos',
    tagline: '5.1.2 Spatial Audio · Up-Firing Drivers · eARC & Optical',
    description: 'Transforms your living room or desktop setup with true Dolby Atmos spatial immersion. Dual up-firing height transducers bounce sound off ceilings, while integrated bass chambers eliminate the need for an external bulky box.',
    images: [
      '/images/products/prod-025-main.png',
      '/images/products/prod-025-alt.png',
      '/images/products/prod-025-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Brushed Charcoal & Blue',
        colorHex: '#334155',
        image: '/images/products/prod-025-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Satin Silver Aluminum',
        colorHex: '#cbd5e1',
        image: '/images/products/prod-025-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Obsidian Stealth Black',
        colorHex: '#0f172a',
        image: '/images/products/prod-025-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Acoustic Architecture': '5.1.2 Virtual Surround with Up-Firing Channels',
      'Peak Power': '320W Peak / 160W Continuous RMS',
      'Connectivity': 'HDMI eARC (Pass-through 4K HDR), Optical TOSLink, Bluetooth 5.3, AUX',
      'Sound Modes': 'Cinema, Dialogue ClearVoice, Bass Boost, Music Fidelity'
    }
  },
  {
    id: 'prod-027',
    name: 'TechTonic ErgoLift CNC Aluminum Laptop Stand',
    category: 'workspace',
    categoryName: 'Workspace Peripherals',
    subcategory: 'Laptop Stands',
    subcategorySlug: 'laptop-stands',
    price: 49.99,
    originalPrice: 59.99,
    rating: 4.9,
    reviewsCount: 287,
    stock: 45,
    isBestSeller: true,
    isFeatured: true,
    badge: 'CNC Aluminum',
    tagline: 'Dual-Axis Ergonomic Tilt · Airflow Cooling Vents · Supports up to 17" Laptops',
    description: 'Precision CNC-machined aircraft grade aluminum laptop riser. Dual stepless friction hinges elevate your screen to eye level to eliminate neck fatigue, while the open ventilation cutouts maximize passive airflow cooling.',
    images: [
      '/images/products/prod-027-main.png',
      '/images/products/prod-027-alt.png',
      '/images/products/prod-027-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Space Grey Anodized',
        colorHex: '#64748b',
        image: '/images/products/prod-027-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Satin Silver',
        colorHex: '#cbd5e1',
        image: '/images/products/prod-027-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Obsidian Matte Black',
        colorHex: '#18181b',
        image: '/images/products/prod-027-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Compatibility': 'All laptops from 10" to 17.3" (MacBook, ThinkPad, Dell XPS, ASUS)',
      'Material': '6063 Anodized CNC Aircraft Aluminum + Anti-Slip Silicone Pads',
      'Load Capacity': 'Up to 10kg (22 lbs) without wobble',
      'Adjustability': 'Dual-axis 0° to 180° elevation and angle adjustment'
    }
  },
  {
    id: 'prod-026',
    name: 'TechTonic AeroStorm RGB Gaming Headset',
    category: 'audio',
    categoryName: 'Audio & Acoustics',
    subcategory: 'Gaming Headsets',
    subcategorySlug: 'gaming-headsets',
    price: 89.99,
    originalPrice: 109.99,
    rating: 4.8,
    reviewsCount: 164,
    stock: 28,
    isBestSeller: true,
    isFeatured: false,
    badge: 'RGB Gaming',
    tagline: '50mm Neodymium Drivers · 7.1 Spatial Audio · Detachable Mic',
    description: 'Ultra-low latency wireless gaming headset featuring custom 50mm neodymium acoustic drivers, 7.1 surround sound immersion, breathable cooling gel ear cushions, and broadcast-grade noise-cancelling boom microphone.',
    images: [
      '/images/products/prod-026-main.png',
      '/images/products/prod-026-alt.png',
      '/images/products/prod-026-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Cyber Cyan & Black',
        colorHex: '#06b6d4',
        image: '/images/products/prod-026-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Electric Violet Neon',
        colorHex: '#d946ef',
        image: '/images/products/prod-026-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Ember Red Racing',
        colorHex: '#ef4444',
        image: '/images/products/prod-026-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Driver Size': '50mm Custom Neodymium',
      'Surround Sound': '7.1 Spatial Immersion',
      'Connection': '2.4GHz Wireless + Bluetooth 5.3',
      'Microphone': 'Detachable Noise-Cancelling Boom',
      'Battery Life': 'Up to 48 Hours',
      'Weight': '290g'
    }
  },
  {
    id: 'prod-028',
    name: 'TechTonic Apex Enduro GPS Sports Watch',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    subcategory: 'Sports Watches',
    subcategorySlug: 'sports-watches',
    price: 189.99,
    originalPrice: 219.99,
    rating: 4.9,
    reviewsCount: 112,
    stock: 16,
    isBestSeller: true,
    isFeatured: true,
    badge: 'Enduro',
    tagline: 'Multi-Band GNSS · Solar Sapphire Glass · 100m Water Resist',
    description: 'Ultra-endurance rugged smartwatch built for marathoners, mountaineers, and tactical athletes. Dual-frequency multi-band GPS with barometric altimeter, 3-axis compass, and 21-day solar battery performance.',
    images: [
      '/images/products/prod-028-main.png',
      '/images/products/prod-028-alt.png',
      '/images/products/prod-028-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Titanium & Topo Dial',
        colorHex: '#10b981',
        image: '/images/products/prod-028-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Tactical Amber Night',
        colorHex: '#f59e0b',
        image: '/images/products/prod-028-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Cyber Blue Radar',
        colorHex: '#0ea5e9',
        image: '/images/products/prod-028-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Case Material': 'Grade 5 Aerospace Titanium',
      'Display': '1.4" Sunlight-Visible Chroma Memory-in-Pixel',
      'Water Rating': '10 ATM (100 Meters)',
      'Battery': '21 Days in Smartwatch Mode / 60h GPS',
      'Sensors': 'Multi-Band GNSS, Barometer, SpO2, Compass'
    }
  },
  {
    id: 'prod-029',
    name: 'TechTonic Curve OLED Fitness Band',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    subcategory: 'Smart Bands',
    subcategorySlug: 'smart-bands',
    price: 49.99,
    originalPrice: 59.99,
    rating: 4.7,
    reviewsCount: 230,
    stock: 45,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Featherlight',
    tagline: '1.47" Curved AMOLED · All-Day SpO2 · 14-Day Battery',
    description: 'Sleek, featherlight wellness tracker with vivid 2.5D curved AMOLED display. Tracks continuous heart rate, sleep architecture, stress levels, and 90+ fitness workouts.',
    images: [
      '/images/products/prod-029-main.png',
      '/images/products/prod-029-alt.png',
      '/images/products/prod-029-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Obsidian Black & Cyan',
        colorHex: '#06b6d4',
        image: '/images/products/prod-029-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Glacier White & Magenta',
        colorHex: '#ec4899',
        image: '/images/products/prod-029-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Solar Lime & Slate',
        colorHex: '#84cc16',
        image: '/images/products/prod-029-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Display': '1.47" Curved AMOLED 280x456',
      'Weight': '16g (without strap)',
      'Battery': '180mAh (up to 14 days)',
      'Water Resistance': '5 ATM Swim-Proof',
      'Health Sensors': 'PPG Heart Rate, Pulse Oximeter, 6-Axis Motion'
    }
  },
  {
    id: 'prod-030',
    name: 'TechTonic Junior Explorer SafeGPS Watch',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    subcategory: 'Kids Smartwatches',
    subcategorySlug: 'kids-smartwatches',
    price: 69.99,
    originalPrice: 79.99,
    rating: 4.8,
    reviewsCount: 88,
    stock: 22,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Kids Safe',
    tagline: '4G LTE Two-Way Calling · SOS Alert · Safe Zone Geofencing',
    description: 'Kid-friendly, shockproof smartwatch with real-time GPS tracking, 4G voice/video calling, one-touch SOS emergency button, and parental safe zone geofencing via companion app.',
    images: [
      '/images/products/prod-030-main.png',
      '/images/products/prod-030-alt.png',
      '/images/products/prod-030-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Oceanic Cobalt Blue',
        colorHex: '#2563eb',
        image: '/images/products/prod-030-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Berry Coral Pink',
        colorHex: '#f43f5e',
        image: '/images/products/prod-030-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Lime Safari Green',
        colorHex: '#22c55e',
        image: '/images/products/prod-030-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Cellular': '4G LTE Nano-SIM',
      'Camera': '2MP Front HD Camera',
      'Battery': '700mAh (up to 4 days standby)',
      'Durability': 'IP68 Dust & Water Resistant',
      'Safety Features': 'One-Touch SOS, Geofencing, Class Mode'
    }
  },
  {
    id: 'prod-031',
    name: 'TechTonic VisionAudio Smart Glasses',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    subcategory: 'Smart Glasses',
    subcategorySlug: 'smart-glasses',
    price: 139.99,
    originalPrice: 159.99,
    rating: 4.8,
    reviewsCount: 65,
    stock: 15,
    isBestSeller: false,
    isFeatured: true,
    badge: 'Audio Optics',
    tagline: 'Open-Ear Directional Acoustics · UV400 Polarized · Touch Tap',
    description: 'Modern ultralight acetate frames equipped with dual micro-speakers and noise-filtering microphones. Listen to music, take calls, and access voice assistants without blocking ambient awareness.',
    images: [
      '/images/products/prod-031-main.png',
      '/images/products/prod-031-alt.png',
      '/images/products/prod-031-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Stealth Matte Black',
        colorHex: '#18181b',
        image: '/images/products/prod-031-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Polarized Sapphire Blue',
        colorHex: '#0284c7',
        image: '/images/products/prod-031-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Tortoise Amber Gold',
        colorHex: '#d97706',
        image: '/images/products/prod-031-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Lenses': 'UV400 Polarized Anti-Glare',
      'Speakers': 'Dual Custom Micro Acoustic Chambers',
      'Battery Life': '6 Hours Playback / 30h Standby',
      'Microphone': 'Dual Beamforming with Wind Suppression',
      'Weight': '38 grams'
    }
  },
  {
    id: 'prod-032',
    name: 'TechTonic SomnaPad Contactless Sleep Tracker',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    subcategory: 'Sleep Trackers',
    subcategorySlug: 'sleep-trackers',
    price: 119.99,
    originalPrice: 139.99,
    rating: 4.9,
    reviewsCount: 74,
    stock: 14,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Wellness',
    tagline: 'Under-Mattress Piezo Sensor · Sleep Apnea Analysis · Zero Wearable',
    description: 'Medical-grade ultra-thin sensor pad placed beneath your mattress. Tracks heart rate, respiration, sleep cycles (Deep, REM, Light), and snoring without needing to wear a device to bed.',
    images: [
      '/images/products/prod-032-main.png',
      '/images/products/prod-032-alt.png',
      '/images/products/prod-032-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Heather Slate Gray',
        colorHex: '#94a3b8',
        image: '/images/products/prod-032-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Midnight Indigo',
        colorHex: '#4338ca',
        image: '/images/products/prod-032-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Pure Arctic White',
        colorHex: '#f8fafc',
        image: '/images/products/prod-032-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Placement': 'Under Mattress (compatible up to 15" thickness)',
      'Sensors': 'Pneumatic & Piezoelectric Biometric Sensor',
      'Connectivity': 'Wi-Fi 802.11 b/g/n & Bluetooth 5.0',
      'Power': 'Continuous USB-C Power Adapter',
      'App Integration': 'Apple Health, Google Fit, TechTonic Cloud'
    }
  },
  {
    id: 'prod-033',
    name: 'TechTonic VitalSense Health Monitor',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    subcategory: 'Health Monitoring Devices',
    subcategorySlug: 'health-monitoring-devices',
    price: 89.99,
    originalPrice: 99.99,
    rating: 4.8,
    reviewsCount: 92,
    stock: 19,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Medical Grade',
    tagline: 'Single-Lead ECG · Clinical SpO2 · Bluetooth Medical Sync',
    description: 'Pocket-sized vital diagnostic scanner providing 30-second medical-grade ECG rhythm recordings, oxygen saturation check, and cloud export for healthcare consultations.',
    images: [
      '/images/products/prod-033-main.png',
      '/images/products/prod-033-alt.png',
      '/images/products/prod-033-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Medical Silver Aluminum',
        colorHex: '#cbd5e1',
        image: '/images/products/prod-033-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Stealth Black & Cyan',
        colorHex: '#06b6d4',
        image: '/images/products/prod-033-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Rose Quartz Gold',
        colorHex: '#fb7185',
        image: '/images/products/prod-033-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Diagnostic Modes': 'Lead I/II ECG, SpO2, Heart Rate, HRV',
      'Recording Time': '30s to 5min continuous capture',
      'Display': 'High-Contrast OLED Waveform Screen',
      'Battery': 'Rechargeable Lithium (500 measurements/charge)',
      'Data Export': 'PDF Clinical Report to Doctor'
    }
  },
  {
    id: 'prod-034',
    name: 'TechTonic HyperHub 10-in-1 USB-C Hub',
    category: 'workspace',
    categoryName: 'Workspace Peripherals',
    subcategory: 'USB Hubs',
    subcategorySlug: 'usb-hubs',
    price: 59.99,
    originalPrice: 69.99,
    rating: 4.9,
    reviewsCount: 178,
    stock: 32,
    isBestSeller: true,
    isFeatured: false,
    badge: 'Essential Hub',
    tagline: '4K@60Hz HDMI · 100W PD Pass-Through · UHS-II SD · Gigabit LAN',
    description: 'Precision-milled aerospace aluminum multi-port hub. Expands a single USB-C port into dual 4K HDMI, Gigabit Ethernet, 100W Power Delivery, SD/MicroSD high-speed readers, and 3x USB 3.2 Gen 2 ports.',
    images: [
      '/images/products/prod-034-main.png',
      '/images/products/prod-034-alt.png',
      '/images/products/prod-034-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Space Gray Aluminum',
        colorHex: '#64748b',
        image: '/images/products/prod-034-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Glacier Silver',
        colorHex: '#e2e8f0',
        image: '/images/products/prod-034-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Stealth Obsidian',
        colorHex: '#18181b',
        image: '/images/products/prod-034-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Ports': '1x HDMI 4K@60Hz, 1x 100W PD USB-C, 3x USB-A 3.2, 1x RJ45 Gigabit, SD/TF 4.0',
      'Transfer Rate': 'Up to 10Gbps high-speed data',
      'Materials': 'Unibody Anodized Aluminum with Heat Fins',
      'Compatibility': 'MacBook Pro, Windows Laptops, iPad Pro, Steam Deck'
    }
  },
  {
    id: 'prod-035',
    name: 'TechTonic StudioDock Dual 4K Docking Station',
    category: 'workspace',
    categoryName: 'Workspace Peripherals',
    subcategory: 'Docking Stations',
    subcategorySlug: 'docking-stations',
    price: 149.99,
    originalPrice: 179.99,
    rating: 4.9,
    reviewsCount: 104,
    stock: 12,
    isBestSeller: false,
    isFeatured: true,
    badge: 'Studio Grade',
    tagline: 'Dual 4K@60Hz Display · 12-in-1 Matrix · 96W Host Charging',
    description: 'Heavyweight desk docking hub for creative workstations. Drives dual independent 4K monitors with audio jacks, optical out, 5x USB-A/C high speed ports, and 96W smart host charging.',
    images: [
      '/images/products/prod-035-main.png',
      '/images/products/prod-035-alt.png',
      '/images/products/prod-035-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Titanium Charcoal',
        colorHex: '#475569',
        image: '/images/products/prod-035-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Stealth Matte Black',
        colorHex: '#18181b',
        image: '/images/products/prod-035-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Satin Silver',
        colorHex: '#cbd5e1',
        image: '/images/products/prod-035-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Displays': 'Dual 4K@60Hz (HDMI 2.0 + DisplayPort 1.4)',
      'Charging Output': '96W Smart Host Laptop PD',
      'Audio': '3.5mm Headphone/Mic Combo + Optical TOSLINK',
      'Body': 'Heavyweight Vertical Alloy Stand with Rubber Isolators'
    }
  },
  {
    id: 'prod-036',
    name: 'TechTonic Nano 65W GaN Dual-Port Wall Charger',
    category: 'power',
    categoryName: 'Power & Mobile',
    subcategory: 'Wall Chargers',
    subcategorySlug: 'wall-chargers',
    price: 34.99,
    originalPrice: 39.99,
    rating: 4.8,
    reviewsCount: 290,
    stock: 50,
    isBestSeller: true,
    isFeatured: false,
    badge: 'Compact GaN',
    tagline: 'Ultra-Compact GaN III · Dual USB-C PD 3.0 · Foldable Prongs',
    description: '50% smaller than standard 60W bricks. Dual USB-C ports dynamically split 65W of pure GaN power to charge both your laptop and phone simultaneously at maximum velocity.',
    images: [
      '/images/products/prod-036-main.png',
      '/images/products/prod-036-alt.png',
      '/images/products/prod-036-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Polar Arctic White',
        colorHex: '#f8fafc',
        image: '/images/products/prod-036-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Stealth Midnight Black',
        colorHex: '#18181b',
        image: '/images/products/prod-036-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Cyber Mint',
        colorHex: '#10b981',
        image: '/images/products/prod-036-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Technology': 'GaN III (Gallium Nitride) Semiconductor',
      'Total Output': '65W Max Power Delivery 3.0 / PPS',
      'Port Allocation': 'Single: 65W / Dual: 45W + 20W',
      'Dimensions': '38mm x 32mm x 42mm',
      'Safety': 'Thermal Guard 2.0 Real-time Temp Monitoring'
    }
  },
  {
    id: 'prod-037',
    name: 'TechTonic MagPad 15W Qi2 Wireless Charger',
    category: 'power',
    categoryName: 'Power & Mobile',
    subcategory: 'Wireless Chargers',
    subcategorySlug: 'wireless-chargers',
    price: 29.99,
    originalPrice: 34.99,
    rating: 4.8,
    reviewsCount: 145,
    stock: 38,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Qi2 Fast',
    tagline: 'Qi2 Certified · 15W Full Speed Magnetic Snap · CNC Zinc Ring',
    description: 'Next-gen Qi2 magnetic wireless charging pad with integrated braided 1.5m cable. Delivers fast 15W inductive charging with low heat generation and anti-scratch matte silicone pad.',
    images: [
      '/images/products/prod-037-main.png',
      '/images/products/prod-037-alt.png',
      '/images/products/prod-037-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Brushed Aluminum & White',
        colorHex: '#f1f5f9',
        image: '/images/products/prod-037-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Ceramic Space Black',
        colorHex: '#18181b',
        image: '/images/products/prod-037-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Champagne Rose Gold',
        colorHex: '#f43f5e',
        image: '/images/products/prod-037-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Standard': 'Official Qi2 Magnetic Induction',
      'Wireless Speed': '15W Peak Charging Speed',
      'Cable': '1.5m High-Density Braided USB-C Cable',
      'Materials': 'CNC Machined Zinc Alloy + Soft Silicone Face'
    }
  },
  {
    id: 'prod-038',
    name: 'TechTonic Velocity 75W Metal Car Turbo Charger',
    category: 'power',
    categoryName: 'Power & Mobile',
    subcategory: 'Car Chargers',
    subcategorySlug: 'car-chargers',
    price: 24.99,
    originalPrice: 29.99,
    rating: 4.9,
    reviewsCount: 180,
    stock: 40,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Turbo Metal',
    tagline: 'Dual USB-C PD 45W + 30W · Solid Zinc Body · Ambient Ice Blue LED',
    description: 'Full metal alloy dual-port car charger fitting flush with 12V/24V cigarette sockets. Powers MacBooks, iPads, and smartphones at high-speed while driving.',
    images: [
      '/images/products/prod-038-main.png',
      '/images/products/prod-038-alt.png',
      '/images/products/prod-038-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Gunmetal & Ice Blue Halo',
        colorHex: '#0ea5e9',
        image: '/images/products/prod-038-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Tactical Black & Ember Red',
        colorHex: '#ef4444',
        image: '/images/products/prod-038-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Silver Chrome & Amber',
        colorHex: '#f59e0b',
        image: '/images/products/prod-038-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Input Voltage': 'DC 12V - 24V Compatible (Cars & Trucks)',
      'Output Ports': 'USB-C1 (45W) + USB-C2 (30W)',
      'Total Wattage': '75W Concurrent Delivery',
      'Aesthetic': 'Flush Socket Fit with Ice-Blue Halo Ring'
    }
  },
  {
    id: 'prod-039',
    name: 'TechTonic Helios 25,000mAh Solar Power Bank',
    category: 'power',
    categoryName: 'Power & Mobile',
    subcategory: 'Solar Power Banks',
    subcategorySlug: 'solar-power-banks',
    price: 64.99,
    originalPrice: 79.99,
    rating: 4.8,
    reviewsCount: 119,
    stock: 26,
    isBestSeller: false,
    isFeatured: false,
    badge: 'Solar Rugged',
    tagline: '25,000mAh High Capacity · SunPower Solar Panel · IP67 Rugged',
    description: 'Heavy-duty adventure power bank with high-efficiency monocrystalline solar cell, integrated 3-mode emergency LED flashlight, dual USB-C PD 30W ports, and shockproof silicone bumpers.',
    images: [
      '/images/products/prod-039-main.png',
      '/images/products/prod-039-alt.png',
      '/images/products/prod-039-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Tactical Black & Safety Orange',
        colorHex: '#f97316',
        image: '/images/products/prod-039-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Rescue Cyber Cyan Edition',
        colorHex: '#06b6d4',
        image: '/images/products/prod-039-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Military Olive Green',
        colorHex: '#65a30d',
        image: '/images/products/prod-039-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Capacity': '25,000mAh / 92.5Wh (Airline Approved)',
      'Solar Harvest': 'High-Efficiency SunPower Monocrystalline Cell',
      'Outputs': 'Dual USB-C (30W PD) + 1x USB-A (18W QC 3.0)',
      'Water/Shock Rating': 'IP67 Waterproof, Dustproof, Drop-Tested'
    }
  },
  {
    id: 'prod-040',
    name: 'TechTonic UltraCharge 22kW Smart Charging Station',
    category: 'power',
    categoryName: 'Power & Mobile',
    subcategory: 'Charging Stations',
    subcategorySlug: 'charging-stations',
    price: 349.99,
    originalPrice: 399.99,
    rating: 4.9,
    reviewsCount: 48,
    stock: 10,
    isBestSeller: false,
    isFeatured: true,
    badge: 'Pro WallBox',
    tagline: '22kW Rapid Flow · RFID & App Authorization · Weatherproof IP65',
    description: 'Commercial-grade smart wallbox charging station with vibrant telemetry display, integrated RFID security, Type 2 heavy-duty braided cable, and dynamic load balancing.',
    images: [
      '/images/products/prod-040-main.png',
      '/images/products/prod-040-alt.png',
      '/images/products/prod-040-v3.png'
    ],
    variants: [
      {
        id: 'v1',
        name: 'Matte Obsidian & Neon Halo',
        colorHex: '#06b6d4',
        image: '/images/products/prod-040-main.png',
        inStock: true
      },
      {
        id: 'v2',
        name: 'Active Ready Green Edition',
        colorHex: '#10b981',
        image: '/images/products/prod-040-alt.png',
        inStock: true
      },
      {
        id: 'v3',
        name: 'Arctic Frost White',
        colorHex: '#f8fafc',
        image: '/images/products/prod-040-v3.png',
        inStock: true
      }
    ],
    specs: {
      'Power Rating': 'Up to 22kW Three-Phase (Adjustable from 7.4kW)',
      'Display': '4.3" High-Definition Color Telemetry Screen',
      'Security': 'NFC Card Tap + Mobile Bluetooth/Wi-Fi Auth',
      'Enclosure': 'IP65 Weatherproof & IK10 Vandal-Resistant'
    }
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'ORD-20260924-0001',
    createdAt: '2026-09-24T09:30:00.000Z',
    status: 'Out for Delivery',
    stepIndex: 3, // 0: Confirmed, 1: Processing, 2: Shipped, 3: Out for Delivery, 4: Delivered
    paymentMethod: 'Bakong KHQR (ABA Bank)',
    paymentStatus: 'Paid',
    subtotal: 119.99,
    shippingFee: 0,
    discount: 10.00,
    total: 109.99,
    customer: {
      fullName: 'Sara Meng',
      phone: '+855 12 345 678',
      email: 'sara.student@techtonic.com',
      address: 'Street 271, Sangkat Boeng Tumpun',
      city: 'Phnom Penh',
      province: 'Phnom Penh',
      postalCode: '12000'
    },
    items: [
      {
        id: 'prod-001',
        name: 'TechTonic ANC Pro Headphones',
        variant: 'Stealth Matte Black',
        price: 119.99,
        quantity: 1,
        image: '/images/products/prod-001-main.png'
      }
    ],
    tracking: {
      courier: 'TechTonic Same-Day Express',
      trackingCode: 'TT-EXP-88921',
      estimatedDelivery: 'Today, 2:30 PM – 4:00 PM',
      driverName: 'Sokha Rith',
      driverPhone: '012 998 771'
    }
  },
  {
    id: 'ORD-20260920-0042',
    createdAt: '2026-09-20T14:15:00.000Z',
    status: 'Delivered',
    stepIndex: 4,
    paymentMethod: 'Credit Card (Visa •••• 4242)',
    paymentStatus: 'Paid',
    subtotal: 129.99,
    shippingFee: 0,
    discount: 0,
    total: 129.99,
    customer: {
      fullName: 'Sara Meng',
      phone: '+855 12 345 678',
      email: 'sara.student@techtonic.com',
      address: 'Street 271, Sangkat Boeng Tumpun',
      city: 'Phnom Penh',
      province: 'Phnom Penh',
      postalCode: '12000'
    },
    items: [
      {
        id: 'prod-006',
        name: 'TechTonic Pro 75% Keyboard',
        variant: 'Pre-lubed Red Linear Switches',
        price: 129.99,
        quantity: 1,
        image: '/images/products/prod-006-main.png'
      }
    ],
    tracking: {
      courier: 'J&T Express Cambodia',
      trackingCode: 'JT-KH-441092',
      estimatedDelivery: 'Delivered on Sep 21, 2026',
      driverName: 'Chann Dara',
      driverPhone: '098 554 112'
    }
  }
];

export const INITIAL_USER = {
  id: 'usr-001',
  fullName: 'Sara Meng',
  email: 'sara.student@techtonic.com',
  phone: '+855 12 345 678',
  avatar: '/images/avatars/sara.png',
  role: 'customer',
  memberSince: 'January 2025',
  savedAddresses: [
    {
      id: 'addr-1',
      title: 'Home / Apartment',
      isDefault: true,
      fullName: 'Sara Meng',
      phone: '+855 12 345 678',
      address: 'Street 271, Building B, #42',
      city: 'Khan Mean Chey',
      province: 'Phnom Penh',
      postalCode: '12000'
    },
    {
      id: 'addr-2',
      title: 'Tech Campus / Office',
      isDefault: false,
      fullName: 'Sara Meng',
      phone: '+855 12 345 678',
      address: 'Russian Federation Blvd, RUPP STEM Lab',
      city: 'Khan Toul Kork',
      province: 'Phnom Penh',
      postalCode: '12150'
    }
  ]
};

export const INITIAL_ADMIN_STATS = {
  totalRevenue: 28450.00,
  revenueChange: '+14.2%',
  totalOrders: 184,
  ordersChange: '+8.1%',
  totalCustomers: 920,
  customersChange: '+22.5%',
  lowStockCount: 3,
  chartData: [
    { month: 'Apr', revenue: 3200 },
    { month: 'May', revenue: 4100 },
    { month: 'Jun', revenue: 4800 },
    { month: 'Jul', revenue: 5200 },
    { month: 'Aug', revenue: 6400 },
    { month: 'Sep', revenue: 7850 }
  ]
};

export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'Sara Meng',
    email: 'sara.student@techtonic.com',
    phone: '012 345 678',
    ordersCount: 4,
    totalSpent: 489.97,
    status: 'VIP Member'
  },
  {
    id: 'cust-2',
    name: 'Vireak Sok',
    email: 'vireak.dev@cambodia.io',
    phone: '098 765 432',
    ordersCount: 6,
    totalSpent: 840.50,
    status: 'Premier'
  },
  {
    id: 'cust-3',
    name: 'Dara Chan',
    email: 'dara.creator@gmail.com',
    phone: '077 123 456',
    ordersCount: 2,
    totalSpent: 219.00,
    status: 'Active'
  },
  {
    id: 'cust-4',
    name: 'Sreynich Pich',
    email: 'sreynich.p@techtonic.dev',
    phone: '015 998 877',
    ordersCount: 3,
    totalSpent: 365.20,
    status: 'Active'
  },
  {
    id: 'cust-5',
    name: 'Bona Keo',
    email: 'bona.keo@startup.kh',
    phone: '089 443 210',
    ordersCount: 5,
    totalSpent: 620.00,
    status: 'VIP Member'
  }
];
