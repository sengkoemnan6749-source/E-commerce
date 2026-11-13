import { useState, useEffect } from 'react';
import { productService } from '../services/productService';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    setProducts(productService.getProducts());
    setCategories(productService.getCategories());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    productService.syncFromBackend();

    const handleSync = () => {
      setProducts(productService.getProducts());
      setCategories(productService.getCategories());
    };

    window.addEventListener('techtonic:catalog-updated', handleSync);
    return () => window.removeEventListener('techtonic:catalog-updated', handleSync);
  }, []);

  return {
    products,
    categories,
    loading,
    refresh,
    getProductById: (id) => productService.getProductById(id),
    saveProduct: (data) => {
      const updated = productService.saveProduct(data);
      setProducts(updated);
      return updated;
    },
    deleteProduct: (id) => {
      const updated = productService.deleteProduct(id);
      setProducts(updated);
      return updated;
    },
    saveCategory: (data) => {
      const updated = productService.saveCategory(data);
      setCategories(updated);
      return updated;
    },
    deleteCategory: (id) => {
      const updated = productService.deleteCategory(id);
      setCategories(updated);
      return updated;
    }
  };
}
