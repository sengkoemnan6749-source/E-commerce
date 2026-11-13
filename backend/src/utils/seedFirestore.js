import 'dotenv/config';
import { FieldValue } from 'firebase-admin/firestore';
import { db, firebaseReady, firebaseError, projectId } from '../config/firebase.js';
import {
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_USER,
} from '../../../frontend/src/services/mockData.js';

const DEFAULT_SPECS = {
  Connectivity: 'Bluetooth 5.3 + 2.4GHz Wireless + USB-C',
  'Battery Life': 'Up to 60 Hours continuous playback',
  'Charging Time': 'Full charge in 45 minutes via Fast GaN',
  Materials: 'Aerospace Grade CNC Aluminum + Memory Foam',
  Warranty: '12-Month Official TechTonic Replacement',
};

const DEFAULT_IN_BOX = [
  'TechTonic Hardware Unit',
  'Braided 100W USB-C to USB-C Cable (1.8m)',
  'Hardshell Travel Case with Magnetic Latch',
  'Warranty Authentication Card & Manual',
];

const DEFAULT_REVIEWS = [
  {
    id: 'rev-seed-1',
    author: 'Vireak S.',
    location: 'Phnom Penh, Cambodia',
    locationKm: 'ភ្នំពេញ, កម្ពុជា',
    rating: 5,
    date: 'September 18, 2026',
    dateKm: '១៨ កញ្ញា ២០២៦',
    verified: true,
    title: 'Exceeded all expectations for software engineering setup',
    titleKm: 'លើសពីការរំពឹងទុកសម្រាប់ការរៀបចំតុធ្វើការសរសេរកូដ',
    comment:
      'The build quality is incredible. Fast delivery within 3 hours in Toul Kork via GrabExpress. Pairs instantly with my MacBook and Windows workstation.',
    commentKm:
      'គុណភាពផលិតល្អអស្ចារ្យណាស់។ ដឹកជញ្ជូនរហ័សក្នុងរយៈពេល ៣ ម៉ោងនៅទួលគោកតាមរយៈ GrabExpress។ ភ្ជាប់បានភ្លាមៗជាមួយ MacBook និងកុំព្យូទ័រ Windows របស់ខ្ញុំ។',
    helpful: 18,
  },
  {
    id: 'rev-seed-2',
    author: 'Dara Chan',
    location: 'Siem Reap, Cambodia',
    locationKm: 'សៀមរាប, កម្ពុជា',
    rating: 5,
    date: 'September 12, 2026',
    dateKm: '១២ កញ្ញា ២០២៦',
    verified: true,
    title: 'Crisp sound and premium tactile feedback',
    titleKm: 'សំឡេងច្បាស់ល្អ និងការប៉ះបញ្ជាមានគុណភាពខ្ពស់',
    comment:
      'I upgraded from an older model and the difference is day and night. Battery life lasts nearly 2 weeks on normal use. Worth every cent.',
    commentKm:
      'ខ្ញុំបានប្តូរពីម៉ូដែលចាស់ ហើយភាពខុសគ្នាគឺដាច់ស្រឡះ។ ថ្មកាន់បានជិត ២ សប្តាហ៍សម្រាប់ការប្រើប្រាស់ធម្មតា។ ស័ក្តិសមនឹងតម្លៃពិតៗ។',
    helpful: 9,
  },
  {
    id: 'rev-seed-3',
    author: 'Sreynich Pich',
    location: 'Battambang, Cambodia',
    locationKm: 'បាត់ដំបង, កម្ពុជា',
    rating: 4,
    date: 'August 28, 2026',
    dateKm: '២៨ សីហា ២០២៦',
    verified: true,
    title: 'Solid engineering, sleek aesthetic',
    titleKm: 'រចនាសម្ព័ន្ធរឹងមាំ និងរូបរាងទាន់សម័យ',
    comment:
      'Minimalist design matches my workspace setup perfectly. Only minor note is that the charging cable is slightly short, but 100W GaN performance is top tier.',
    commentKm:
      'ការរចនាសាមញ្ញស៊ីគ្នាឥតខ្ចោះជាមួយតុធ្វើការរបស់ខ្ញុំ។ មានតែចំណុចតូចមួយគឺខ្សែសាករាងខ្លីបន្តិច ប៉ុន្តែសមត្ថភាព GaN 100W គឺកំពូលតែម្ដង។',
    helpful: 4,
  },
];

function cleanImagePath(path) {
  if (!path || typeof path !== 'string' || path.includes('unsplash.com')) {
    return '/images/products/prod-001-main.png';
  }
  return path.replace(/\.jpg$/i, '.png');
}

function buildProductDoc(product, index) {
  const images = (product.images || []).map(cleanImagePath);
  const primaryImage = cleanImagePath(product.image || images[0]);
  const variants = (product.variants || []).map((v, idx) => ({
    ...v,
    image: cleanImagePath(v.image || images[idx] || primaryImage),
    inStock: v.inStock !== false,
  }));
  const gallery = Array.from(new Set([primaryImage, ...images, ...variants.map((v) => v.image)]));

  return {
    id: String(product.id),
    slug: product.slug || String(product.id),
    name: product.name,
    category: product.category,
    categoryId: product.categoryId || product.category,
    categoryName: product.categoryName || product.category,
    subcategory: product.subcategory || null,
    subcategorySlug: product.subcategorySlug || null,
    price: Number(product.price) || 0,
    originalPrice: product.originalPrice != null ? Number(product.originalPrice) : null,
    rating: Number(product.rating) || 4.8,
    reviewsCount: Number(product.reviewsCount) || 0,
    stock: Number(product.stock ?? 0),
    isBestSeller: Boolean(product.isBestSeller),
    isFeatured: Boolean(product.isFeatured),
    badge: product.badge || null,
    tagline: product.tagline || '',
    description: product.description || '',
    image: primaryImage,
    secondaryImage: gallery[1] || primaryImage,
    images: gallery,
    gallery,
    variants,
    specs: product.specs || DEFAULT_SPECS,
    inBox: product.inBox || DEFAULT_IN_BOX,
    sortOrder: index + 1,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function commitOperationsInChunks(operations, chunkSize = 400) {
  for (let i = 0; i < operations.length; i += chunkSize) {
    const batch = db.batch();
    const slice = operations.slice(i, i + chunkSize);
    for (const op of slice) {
      batch.set(op.ref, op.data, { merge: true });
    }
    await batch.commit();
  }
}

async function seedFirestore() {
  if (!firebaseReady || !db) {
    console.error('[Seed] Firebase is not ready:', firebaseError);
    process.exit(1);
  }

  console.log(`[Seed] Starting Firestore seed for project: ${projectId}`);

  const categoryCounts = INITIAL_PRODUCTS.reduce((acc, p) => {
    const key = p.category || p.categoryId;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const operations = [];

  // 1. Categories
  INITIAL_CATEGORIES.forEach((cat, idx) => {
    const ref = db.collection('categories').doc(String(cat.id));
    operations.push({
      ref,
      data: {
        ...cat,
        id: String(cat.id),
        itemCount: categoryCounts[cat.id] ?? cat.itemCount ?? 0,
        sortOrder: idx + 1,
        updatedAt: FieldValue.serverTimestamp(),
      },
    });
  });

  // 2. Products + deterministic sample reviews
  INITIAL_PRODUCTS.forEach((product, idx) => {
    const productRef = db.collection('products').doc(String(product.id));
    operations.push({
      ref: productRef,
      data: buildProductDoc(product, idx),
    });

    DEFAULT_REVIEWS.forEach((rev, rIdx) => {
      const reviewRef = productRef.collection('reviews').doc(rev.id);
      operations.push({
        ref: reviewRef,
        data: {
          ...rev,
          productId: String(product.id),
          createdAt: new Date(Date.UTC(2026, 8, 18 - rIdx * 6)).toISOString(),
        },
      });
    });
  });

  // 3. Seed sample customer profiles (and Sara's saved addresses)
  INITIAL_CUSTOMERS.forEach((cust) => {
    const custRef = db.collection('users').doc(String(cust.id));
    operations.push({
      ref: custRef,
      data: {
        id: String(cust.id),
        uid: String(cust.id),
        name: cust.name,
        fullName: cust.name,
        email: cust.email,
        phone: cust.phone,
        avatar: cust.id === 'cust-1' ? INITIAL_USER.avatar : '/images/avatars/sara.png',
        role: 'customer',
        status: cust.status || 'Active',
        ordersCount: Number(cust.ordersCount) || 0,
        totalSpent: Number(cust.totalSpent) || 0,
        preferredLanguage: 'en',
        memberSince: 'January 2025',
        updatedAt: FieldValue.serverTimestamp(),
      },
    });
  });

  (INITIAL_USER.savedAddresses || []).forEach((addr) => {
    const addrRef = db.collection('users').doc('cust-1').collection('addresses').doc(String(addr.id));
    operations.push({
      ref: addrRef,
      data: {
        ...addr,
        id: String(addr.id),
        createdAt: new Date(Date.UTC(2026, 0, 15)).toISOString(),
      },
    });
  });

  // 4. Promo codes
  const promoCodes = [
    {
      code: 'TECH10',
      type: 'fixed',
      value: 10,
      minSubtotal: 0,
      active: true,
      description: 'Promo code applied: $10.00 off!',
    },
    {
      code: 'SAVE5',
      type: 'fixed',
      value: 5,
      minSubtotal: 0,
      active: true,
      description: 'Promo code applied: $5.00 off!',
    },
  ];
  promoCodes.forEach((promo) => {
    operations.push({
      ref: db.collection('promoCodes').doc(promo.code),
      data: {
        ...promo,
        updatedAt: FieldValue.serverTimestamp(),
      },
    });
  });

  // 5. Initial orders
  INITIAL_ORDERS.forEach((order) => {
    const cleanId = String(order.id).replace(/^#/, '');
    operations.push({
      ref: db.collection('orders').doc(cleanId),
      data: {
        ...order,
        id: cleanId,
        userId: 'cust-1',
        discountAmount: Number(order.discount ?? order.discountAmount ?? 0),
        updatedAt: FieldValue.serverTimestamp(),
      },
    });
  });

  await commitOperationsInChunks(operations);

  console.log(
    `[Seed] Done! Seeded ${INITIAL_CATEGORIES.length} categories, ${INITIAL_PRODUCTS.length} products, ${INITIAL_PRODUCTS.length * DEFAULT_REVIEWS.length} sample reviews, ${INITIAL_CUSTOMERS.length} customers, ${promoCodes.length} promo codes, and ${INITIAL_ORDERS.length} orders.`
  );
  process.exit(0);
}

seedFirestore().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});

