import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../config/firebase';
import { api } from '../services/api';
import { authService } from '../services/authService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { shippingService } from '../services/shippingService';
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
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'kh') return 'km';
      return saved || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang) => {
    const normalized = lang === 'kh' ? 'km' : lang;
    setLanguageState(normalized);
    try {
      localStorage.setItem(LANG_KEY, normalized);
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
  };

  // Sync HTML lang and class for typography optimization (Kantumruy Pro & relaxed line-height)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isKh = language === 'km' || language === 'kh';
      document.documentElement.lang = isKh ? 'km' : 'en';
      if (isKh) {
        document.documentElement.classList.add('lang-kh');
      } else {
        document.documentElement.classList.remove('lang-kh');
      }
    }
    return () => {};
  }, [language]);

  // Hydrate catalog from live backend API on app boot
  useEffect(() => {
    productService.syncFromBackend();
  }, []);

  const [authReady, setAuthReady] = useState(() => !(isFirebaseConfigured && firebaseAuth));
  const [pending2fa, setPending2fa] = useState(null);
  const syncedUserUidRef = useRef(null);

  const mergeByKey = (localList, serverList, keyFn) => {
    const merged = [];
    const seen = new Set();
    [...(Array.isArray(localList) ? localList : []), ...(Array.isArray(serverList) ? serverList : [])].forEach((item) => {
      if (!item || !item.id) return;
      const k = keyFn(item);
      if (!seen.has(k)) {
        seen.add(k);
        merged.push(item);
      }
    });
    return merged;
  };

  // Keep Firebase Auth session & API bearer token synchronized
  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setAuthReady(true);
      return undefined;
    }
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          api.setAuthToken(token);
          const twoFactor = await authService.getTwoFactorStatus();
          if (twoFactor.enabled && !twoFactor.verified) {
            setPending2fa({ email: fbUser.email || '' });
            setRawUser(null);
          } else {
            setPending2fa(null);
            const profile = await authService.syncBackendProfile();
            if (profile) {
              setRawUser(profile);
              const uid = profile.id || profile.uid || fbUser.uid;
              if (syncedUserUidRef.current !== uid) {
                syncedUserUidRef.current = uid;
                if (Array.isArray(profile.cart) && profile.cart.length > 0) {
                  setCart((prev) =>
                    sanitizeCartList(
                      mergeByKey(prev, profile.cart, (it) => `${it.id}::${it.selectedVariant || it.variant || 'Standard'}`)
                    )
                  );
                }
                if (Array.isArray(profile.wishlist) && profile.wishlist.length > 0) {
                  setWishlist((prev) =>
                    sanitizeWishlistList(mergeByKey(prev, profile.wishlist, (it) => String(it.id)))
                  );
                }
              }
              orderService.fetchMyOrders().catch(() => {});
            }
          }
        } catch (err) {
          if (
            err?.status === 401 ||
            err?.status === 403 ||
            err?.code === 'TWO_FACTOR_REQUIRED' ||
            err?.code === 'TOKEN_REVOKED'
          ) {
            setRawUser(null);
            if (err?.code === 'TWO_FACTOR_REQUIRED') {
              setPending2fa({ email: fbUser.email || '' });
            }
          }
          // Non-fatal if backend is temporarily offline
        } finally {
          setAuthReady(true);
        }
      } else {
        syncedUserUidRef.current = null;
        api.setAuthToken(null);
        api.setUser2faToken?.(null);
        setPending2fa(null);
        setRawUser(null);
        orderService.clearOrdersCache();
        setAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

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
    const validAddresses = Array.isArray(u.savedAddresses)
      ? u.savedAddresses
      : Array.isArray(u.addresses)
        ? u.addresses
        : [];

    return {
      ...u,
      name: u.fullName || u.name || u.email || 'Customer',
      fullName: u.fullName || u.name || u.email || 'Customer',
      phone: u.phone || '',
      addresses: validAddresses,
      savedAddresses: validAddresses
    };
  };

  const user = normalizeUser(rawUser);

  const login = async (email, password) => {
    try {
      const res = await authService.loginWithEmail(email, password);
      if (res?.requires2fa) {
        setPending2fa({ email: res.email || email.trim() });
        setRawUser(null);
        return { success: false, requires2fa: true, email: res.email || email.trim() };
      }
      const loggedUser = res?.profile || res;
      setPending2fa(null);
      setRawUser(loggedUser);
      orderService.fetchMyOrders().catch(() => {});
      showToast(`Welcome back, ${loggedUser.fullName || loggedUser.name || 'Customer'}!`);
      return { success: true, user: normalizeUser(loggedUser) };
    } catch (error) {
      return { success: false, message: error.message || 'Invalid email or password' };
    }
  };

  const register = async (userData) => {
    try {
      const newUser = await authService.registerWithEmail(userData);
      setPending2fa(null);
      setRawUser(newUser);
      orderService.fetchMyOrders().catch(() => {});
      showToast(`Account created successfully! Welcome, ${newUser.fullName || newUser.name || 'Customer'}!`);
      return { success: true, user: normalizeUser(newUser) };
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const res = await authService.loginWithGoogle();
      if (res?.requires2fa) {
        setPending2fa({ email: res.email || '' });
        setRawUser(null);
        return { success: false, requires2fa: true, email: res.email || '' };
      }
      const loggedUser = res?.profile || res;
      setPending2fa(null);
      setRawUser(loggedUser);
      orderService.fetchMyOrders().catch(() => {});
      showToast(`Welcome, ${loggedUser.fullName || loggedUser.name || 'Customer'}!`);
      return { success: true, user: normalizeUser(loggedUser) };
    } catch (error) {
      return { success: false, message: error.message || 'Google sign-in failed' };
    }
  };

  const completeTwoFactorLogin = async ({ totpCode, recoveryCode }) => {
    try {
      await authService.verifyTwoFactor({ totpCode, recoveryCode });
      const profile = await authService.syncBackendProfile();
      if (!profile) {
        throw new Error('Unable to load user profile.');
      }
      setPending2fa(null);
      setRawUser(profile);
      orderService.fetchMyOrders().catch(() => {});
      authService.reportSecurityEvent('LOGIN_SUCCESS', 'Completed 2FA sign-in', profile.email);
      showToast(`Welcome back, ${profile.fullName || profile.name || 'Customer'}!`);
      return { success: true, user: normalizeUser(profile) };
    } catch (error) {
      return { success: false, message: error.message || 'Invalid verification code' };
    }
  };

  const logout = () => {
    authService.logout();
    orderService.clearOrdersCache();
    setPending2fa(null);
    setRawUser(null);
    showToast('Signed out successfully.');
  };

  const updateProfile = async (data) => {
    try {
      const updated = await authService.updateProfile(data);
      if (updated) setRawUser(updated);
      showToast('Profile updated successfully.');
      return updated;
    } catch (error) {
      showToast(error.message || 'Failed to update profile.', 'error');
      return null;
    }
  };

  const addAddress = async (addr) => {
    try {
      const updated = await authService.saveAddress(addr);
      if (updated) setRawUser({ ...updated });
      return updated;
    } catch (error) {
      showToast(error.message || 'Failed to save address.', 'error');
      return null;
    }
  };

  const deleteAddress = async (addrId) => {
    try {
      const updated = await authService.deleteAddress(addrId);
      if (updated) setRawUser({ ...updated });
      return updated;
    } catch (error) {
      showToast(error.message || 'Failed to delete address.', 'error');
      return null;
    }
  };

  const setDefaultAddress = async (addrId) => {
    try {
      const updated = await authService.setDefaultAddress(addrId);
      if (updated) setRawUser({ ...updated });
      return updated;
    } catch (error) {
      showToast(error.message || 'Failed to update default address.', 'error');
      return null;
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
      return [];
    } catch {
      return [];
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [shippingConfig, setShippingConfig] = useState(() => shippingService.getCachedShippingConfig());

  useEffect(() => {
    let active = true;
    shippingService.fetchShippingConfig().then((cfg) => {
      if (active && cfg) setShippingConfig(cfg);
    });
    const onShippingUpdate = (e) => {
      if (e?.detail) setShippingConfig(e.detail);
    };
    window.addEventListener('techtonic:shipping-updated', onShippingUpdate);
    return () => {
      active = false;
      window.removeEventListener('techtonic:shipping-updated', onShippingUpdate);
    };
  }, []);

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

  const applyPromo = async (code) => {
    const normalized = (code || '').trim().toUpperCase();
    if (!normalized) {
      return { success: false, message: 'Please enter a promo code.' };
    }
    try {
      const currentSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const res = await api.post('/promos/validate', {
        code: normalized,
        subtotal: currentSubtotal,
      });
      if (res?.data?.valid) {
        const amt = Number(res.data.discountAmount || 0);
        setDiscount(amt);
        setPromoCode(res.data.code || normalized);
        return {
          success: true,
          message: res.data.message || `Promo code applied: $${amt.toFixed(2)} off!`,
        };
      }
      return { success: false, message: res?.data?.message || 'Invalid promo code.' };
    } catch (err) {
      return { success: false, message: err?.message || 'Invalid or expired promo code.' };
    }
  };

  const applyCoupon = (code) => applyPromo(code);

  const removeCoupon = () => {
    setDiscount(0);
    setPromoCode('');
  };

  // Cart calculations
  const subtotal = Math.round(
    cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0) * 100
  ) / 100;
  const freeShippingThreshold = Number(shippingConfig?.freeShippingThreshold || 0);
  const shippingFee =
    cart.length > 0
      ? shippingService.calculateShippingFee(shippingConfig, null, subtotal).shippingFee
      : 0;
  const effectiveDiscount =
    cart.length > 0
      ? Math.round(Math.min(subtotal, Math.max(0, Number(discount || 0))) * 100) / 100
      : 0;
  const total = Math.round(Math.max(0, subtotal + shippingFee - effectiveDiscount) * 100) / 100;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Re-validate active promo code when cart items/subtotal change
  useEffect(() => {
    if (!promoCode) return undefined;
    if (cart.length === 0 || subtotal <= 0) {
      setDiscount(0);
      setPromoCode('');
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      api
        .post('/promos/validate', { code: promoCode, subtotal })
        .then((res) => {
          if (!active) return;
          if (res?.data?.valid) {
            setDiscount(Number(res.data.discountAmount || 0));
          } else {
            setDiscount(0);
            setPromoCode('');
          }
        })
        .catch(() => {
          if (!active) return;
          setDiscount(0);
          setPromoCode('');
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [subtotal, promoCode, cart.length]);

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

  // Debounced cross-device Firestore sync for authenticated user's cart & wishlist
  useEffect(() => {
    const uid = rawUser?.id || rawUser?.uid;
    if (!uid || syncedUserUidRef.current !== uid) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      api
        .put('/auth/state', {
          cart: sanitizeCartList(cart),
          wishlist: sanitizeWishlistList(wishlist),
        })
        .catch(() => {});
    }, 700);
    return () => window.clearTimeout(timer);
  }, [cart, wishlist, rawUser?.id, rawUser?.uid]);

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
    authReady,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    pending2fa,
    login,
    loginWithGoogle,
    completeTwoFactorLogin,
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
    freeShippingThreshold,
    discount: effectiveDiscount,
    discountAmount: effectiveDiscount,
    promoCode,
    appliedCoupon: promoCode ? { code: promoCode, amount: effectiveDiscount } : null,
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
