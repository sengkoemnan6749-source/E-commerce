const CART_KEY = 'techtonic_cart';

export const cartService = {
  getCart() {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },
  saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  },
  clearCart() {
    localStorage.removeItem(CART_KEY);
  }
};
