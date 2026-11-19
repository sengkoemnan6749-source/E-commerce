import * as catalogService from '../services/catalogService.js';

export async function getCategories(_req, res, next) {
  try {
    const categories = await catalogService.listCategories();
    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProducts(req, res, next) {
  try {
    const result = await catalogService.listProducts(req.query);
    res.json({
      success: true,
      count: result.products.length,
      pagination: result.pagination,
      data: result.products,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const product = await catalogService.getProductById(req.params.id);
    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductReviews(req, res, next) {
  try {
    const reviews = await catalogService.listProductReviews(req.params.id);
    res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProductReview(req, res, next) {
  try {
    const result = await catalogService.addProductReview(req.params.id, {
      ...req.body,
      userId: req.user?.uid || null,
    });
    res.status(201).json({
      success: true,
      data: result.review,
      meta: {
        rating: result.rating,
        reviewsCount: result.reviewsCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function markReviewHelpful(req, res, next) {
  try {
    const updated = await catalogService.markReviewHelpful(
      req.params.id,
      req.params.reviewId,
      req.user?.uid
    );
    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

