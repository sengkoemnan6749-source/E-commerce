import { productService } from '../services/productService';

export const productStore = {
  getProducts: () => productService.getProducts(),
  getProductById: (id) => productService.getProductById(id),
  getCategories: () => productService.getCategories()
};

export default productStore;
