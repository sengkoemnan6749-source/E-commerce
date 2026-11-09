import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { productService } from '../services/productService';
import { getTranslation } from '../utils/translations';

const StoreContext = createContext(null);

const CART_KEY = 'techtonic_cart';
const WISHLIST_KEY = 'techtonic_wishlist';
const LANG_KEY = 'techtonic_lang';

export function StoreProvider({ children }) {
  // -------------------------------------------------------------
  // 0. Language State (i18n)
  // -------------------------------------------------------------
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
  };

  // Sync HTML lang and class for typography optimization (Kantumruy Pro & relaxed line-height)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isKh = language === 'kh';
      document.documentElement.lang = isKh ? 'km' : 'en';
      if (isKh) {
        document.documentElement.classList.add('lang-kh');
      } else {
        document.documentElement.classList.remove('lang-kh');
      }
    }
  }, [language]);

  const t = (key, fallback = '') => getTranslation(language, key, fallback);
  // -------------------------------------------------------------
  // 1. Toast Notifications
  // -------------------------------------------------------------
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const addToast = (message, type = 'success') => {
    showToast(message, type);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // -------------------------------------------------------------
  // 2. Auth State
  // -------------------------------------------------------------
  const [rawUser, setRawUser] = useState(() => authService.getCurrentUser());

  const normalizeUser = (u) => {
    if (!u) return null;
    const validAddresses = (Array.isArray(u.savedAddresses) && u.savedAddresses.length > 0)
      ? u.savedAddresses
      : (Array.isArray(u.addresses) && u.addresses.length > 0)
        ? u.addresses
        : [
            {
              id: 'addr-default',
              label: 'Work / Studio Lab',
              fullName: u.fullName || u.name || 'Sara Meng',
              phone: u.phone || '+855 12 888 999',
              address: 'Street 310, Building 24, BKK1',
              city: 'Khan Chamkarmon',
              province: 'Phnom Penh',
              postalCode: '120101',
              isDefault: true
            }
          ];

    return {
      ...u,
      name: u.fullName || u.name || 'Sara Meng',
      fullName: u.fullName || u.name || 'Sara Meng',
      phone: u.phone || '+855 12 888 999',
      addresses: validAddresses,
      savedAddresses: validAddresses
    };
  };

  const user = normalizeUser(rawUser);

  const login = async (email, password) => {
    const loggedUser = authService.login(email, password);
    setRawUser(loggedUser);
    showToast(`Welcome back, ${loggedUser.fullName || 'Customer'}!`);
    return { success: true, user: normalizeUser(loggedUser) };
  };

  const register = async (userData) => {
    const newUser = authService.register(userData);
    setRawUser(newUser);
    showToast(`Account created successfully! Welcome, ${newUser.fullName || 'Customer'}!`);
    return { success: true, user: normalizeUser(newUser) };
  };

  const loginAsCustomer = () => {
    const u = authService.loginAsCustomer();
    setRawUser(u);
    showToast(`Switched to Customer account (${u.fullName})`, 'success');
    return normalizeUser(u);
  };

  const loginAsAdmin = () => {
    const u = authService.loginAsAdmin();
    setRawUser(u);
    showToast(`Switched to Administrator account (${u.fullName})`, 'success');
    return normalizeUser(u);
  };

  const logout = () => {
    authService.logout();
    setRawUser(null);
    showToast('Signed out successfully.');
  };

  const updateProfile = (data) => {
    const updated = authService.updateProfile(data);
    setRawUser(updated);
    showToast('Profile updated successfully.');
  };

  const addAddress = (addr) => {
    const updated = authService.saveAddress(addr);
    setRawUser({ ...updated });
  };

  const deleteAddress = (addrId) => {
    const updated = authService.deleteAddress(addrId);
    setRawUser({ ...updated });
  };

  const setDefaultAddress = (addrId) => {
    if (user?.addresses) {
      const updated = user.addresses.map(a => ({
        ...a,
        isDefault: a.id === addrId
      }));
      setRawUser({ ...rawUser, savedAddresses: updated, addresses: updated });
    }
  };

  // -------------------------------------------------------------
  // 3. Cart State
  // -------------------------------------------------------------
  const sanitizeCartList = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(item => {
      if (!item) return item;
      const cleanImg = productService.getCleanProductImage(item, item.selectedVariant || item.variant);
      return {
        ...item,
        image: cleanImg
      };
    });
  };

  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return sanitizeCartList(parsed);
      }
      // Initial 2 items to match the reference mockup cart badge ("2")
      const p1 = productService.getProductById('prod-001');
      const p2 = productService.getProductById('prod-012');
      const defaults = [];
      if (p1) defaults.push({ ...p1, quantity: 1, selectedVariant: 'Midnight Black', image: productService.getCleanProductImage(p1) });
      if (p2) defaults.push({ ...p2, quantity: 1, selectedVariant: 'Titanium Silver', image: productService.getCleanProductImage(p2) });
      return defaults;
    } catch {
      return [];
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    try {
      const sanitized = sanitizeCartList(cart);
      localStorage.setItem(CART_KEY, JSON.stringify(sanitized));
    } catch (e) {
      console.error('Failed to sync cart:', e);
    }
  }, [cart]);

  // Robust addToCart supporting (product, qty, variant, customImage) OR (product, variant, qty, customImage)
  const addToCart = (product, arg2 = 1, arg3 = null, arg4 = null) => {
    let quantity = 1;
    let variant = 'Standard';
    let customImage = typeof arg4 === 'string' ? arg4 : null;

    if (typeof arg2 === 'number') {
      quantity = Math.max(1, arg2);
      variant = typeof arg3 === 'string' && arg3 ? arg3 : (product.variants?.[0]?.name || 'Standard');
    } else if (typeof arg2 === 'string') {
      variant = arg2;
      quantity = typeof arg3 === 'number' ? Math.max(1, arg3) : 1;
    } else {
      variant = product.variants?.[0]?.name || 'Standard';
      quantity = 1;
    }

    const cleanImg = productService.getCleanProductImage(product, variant);
    const primaryImg = (customImage && !customImage.includes('unsplash.com')) ? customImage : cleanImg;

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.id === product.id && (item.variant === variant || item.selectedVariant === variant));
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
            image: primaryImg,
            category: product.categoryName || product.category,
            variant: variant,
            selectedVariant: variant,
            quantity: quantity
          }
        ];
      }
    });
  };

  const updateQuantity = (itemId, variantOrQty, possibleQty) => {
    let variant = null;
    let newQty = 1;

    if (typeof variantOrQty === 'string') {
      variant = variantOrQty;
      newQty = possibleQty;
    } else if (typeof variantOrQty === 'number') {
      newQty = variantOrQty;
    }

    if (newQty <= 0) {
      removeFromCart(itemId, variant);
      return;
    }

    setCart(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          if (!variant || item.variant === variant || item.selectedVariant === variant) {
            return { ...item, quantity: newQty };
          }
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId, variant = null) => {
    setCart(prev =>
      prev.filter(item => {
        if (item.id === itemId) {
          if (!variant || item.variant === variant || item.selectedVariant === variant) {
            return false;
          }
        }
        return true;
      })
    );
    showToast('Item removed from cart.', 'info');
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPromoCode('');
  };

  const applyPromo = (code) => {
    const normalized = (code || '').trim().toUpperCase();
    if (normalized === 'TECH10') {
      setDiscount(10);
      setPromoCode('TECH10');
      return { success: true, message: 'Promo code applied: $10.00 off!' };
    } else if (normalized === 'SAVE5') {
      setDiscount(5);
      setPromoCode('SAVE5');
      return { success: true, message: 'Promo code applied: $5.00 off!' };
    } else {
      return { success: false, message: 'Invalid promo code. Try TECH10 or SAVE5.' };
    }
  };

  const applyCoupon = (code) => applyPromo(code);

  const removeCoupon = () => {
    setDiscount(0);
    setPromoCode('');
  };

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 100 || subtotal === 0 ? 0 : 5;
  const total = Math.max(0, subtotal + shippingFee - discount);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // -------------------------------------------------------------
  // 4. Wishlist State
  // -------------------------------------------------------------
  const sanitizeWishlistList = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(item => {
      if (!item) return item;
      const full = productService.getProductById(item.id) || item;
      const cleanImg = productService.getCleanProductImage(full);
      return {
        ...full,
        image: cleanImg
      };
    });
  };

  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const clean = sanitizeWishlistList(parsed);
      if (stored) {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(clean));
      }
      return clean;
    } catch {
      return [];
    }
  });

  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
  const openWishlistDrawer = () => setIsWishlistDrawerOpen(true);
  const closeWishlistDrawer = () => setIsWishlistDrawerOpen(false);

  useEffect(() => {
    try {
      const sanitized = sanitizeWishlistList(wishlist);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(sanitized));
    } catch (e) {
      console.error('Failed to sync wishlist:', e);
    }
  }, [wishlist]);

  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      } else {
        const full = productService.getProductById(product.id) || product;
        const clean = {
          ...full,
          image: productService.getCleanProductImage(full)
        };
        return [...prev, clean];
      }
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(item => item.id !== productId));
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  const moveToCart = (product, variant = null) => {
    addToCart(product, 1, variant);
    removeFromWishlist(product.id);
  };

  const moveAllWishlistToCart = () => {
    if (wishlist.length === 0) return;
    wishlist.forEach(item => {
      addToCart(item, 1);
    });
    setWishlist([]);
    setIsWishlistDrawerOpen(false);
  };

  const isWishlisted = (productId) => wishlist.some(item => item.id === productId);
  const isInWishlist = (productId) => isWishlisted(productId);

  const contextValue = {
    // Toasts
    toasts,
    showToast,
    addToast,
    removeToast,

    // Auth
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    loginAsCustomer,
    loginAsAdmin,
    register,
    logout,
    updateProfile,
    addAddress,
    deleteAddress,
    setDefaultAddress,

    // Cart
    cart,
    items: cart,
    cartCount,
    totalItems: cartCount,
    subtotal,
    shippingFee,
    discount,
    discountAmount: discount,
    promoCode,
    appliedCoupon: promoCode ? { code: promoCode, amount: discount } : null,
    total,
    isCartDrawerOpen,
    isDrawerOpen: isCartDrawerOpen,
    setIsCartDrawerOpen,
    openDrawer: () => setIsCartDrawerOpen(true),
    closeDrawer: () => setIsCartDrawerOpen(false),
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyPromo,
    applyCoupon,
    removeCoupon,

    // Wishlist
    wishlist,
    wishlistCount: wishlist.length,
    isWishlistDrawerOpen,
    isWishlistOpen: isWishlistDrawerOpen,
    setIsWishlistDrawerOpen,
    openWishlistDrawer,
    closeWishlistDrawer,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
    moveToCart,
    moveAllWishlistToCart,
    isWishlisted,
    isInWishlist,

    // Language & Localization (i18n)
    language,
    lang: language,
    setLanguage,
    setLang: setLanguage,
    t
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}

export function useCart() {
  return useStore();
}

export function useAuth() {
  return useStore();
}

export function useWishlist() {
  return useStore();
}

export function useToast() {
  return useStore();
}

export function useLanguage() {
  const { language, setLanguage, t } = useStore();
  return { language, lang: language, setLanguage, setLang: setLanguage, t };
}
