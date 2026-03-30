const { Review, Product, User, sequelize } = require("../models");
const messages = require("../constants/messages");
const catchAsync = require("../utils/catchAsync");

const sendResponse = (
  res,
  { status = 200, success = true, message = "", data = null, meta = null }
) => res.status(status).json({ success, message, data, meta });

/* ================= UPDATE PRODUCT RATING ================= */
const updateProductRating = async (productId) => {
  const result = await Review.findOne({
    where: { productId },
    attributes: [
      [sequelize.fn("AVG", sequelize.col("rating")), "avgRating"],
      [sequelize.fn("COUNT", sequelize.col("id")), "reviewCount"]
    ],
    raw: true
  });

  const avgRating = result.avgRating ? parseFloat(result.avgRating).toFixed(1) : 0;
  const reviewCount = result.reviewCount || 0;

  await Product.update(
    {
      rating: avgRating,
      totalReviews: reviewCount
    },
    { where: { id: productId } }
  );
};

/* ================= ADD REVIEW ================= */
const addReview = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const product = await Product.findByPk(productId);

  if (!product || !product.isActive) {
    return sendResponse(res, {
      status: 404,
      success: false,
      message: messages.ERROR.NOT_FOUND
    });
  }

  // 🔴 Check if user already reviewed this product
  const existingReview = await Review.findOne({
    where: { productId, userId }
  });

  if (existingReview) {
    return sendResponse(res, {
      status: 400,
      success: false,
      message: "You have already reviewed this product"
    });
  }

  // ✅ Create review
  const newReview = await Review.create({
    productId,
    userId,
    rating,
    comment: comment.trim()
  });

  await updateProductRating(productId);

  return sendResponse(res, {
    status: 201,
    message: "Review added",
    data: newReview
  });
});


/* ================= GET REVIEWS ================= */
const getReviews = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, rating, sort = "createdAt" } = req.query;

  const where = { productId };

  if (rating) where.rating = rating;

  const offset = (page - 1) * limit;

  const { count, rows } = await Review.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "reviewUser",
        attributes: ["id", "name"]
      }
    ],
    limit: parseInt(limit),
    offset,
    order: [[sort, "DESC"]]
  });

  const totalPages = Math.ceil(count / limit);
  
  const product = await Product.findByPk(productId, {
    attributes: ["rating", "totalReviews"]
  });

  return sendResponse(res, {
    message: "Reviews fetched",
    data: {
      reviews: rows,
      averageRating: product?.rating || 0,
      totalReviews: product?.totalReviews || 0
    },
    meta: {
      total: count,
      page: parseInt(page),
      totalPages,
      limit: parseInt(limit)
    }
  });
});

/* ================= UPDATE REVIEW ================= */
const updateReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const review = await Review.findByPk(reviewId);

  if (!review) {
    return sendResponse(res, {
      status: 404,
      success: false,
      message: messages.ERROR.NOT_FOUND
    });
  }

  if (review.userId !== userId) {
    return sendResponse(res, {
      status: 403,
      success: false,
      message: messages.ERROR.UNAUTHORIZED
    });
  }

  await review.update({
    rating,
    comment: comment ? comment.trim() : review.comment
  });

  await updateProductRating(review.productId);

  return sendResponse(res, {
    message: "Review updated",
    data: review
  });
});

/* ================= DELETE REVIEW ================= */
const deleteReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  const review = await Review.findByPk(reviewId);

  if (!review) {
    return sendResponse(res, {
      status: 404,
      success: false,
      message: messages.ERROR.NOT_FOUND
    });
  }

  if (review.userId !== userId) {
    return sendResponse(res, {
      status: 403,
      success: false,
      message: messages.ERROR.UNAUTHORIZED
    });
  }

  const productId = review.productId;

  await review.destroy();

  await updateProductRating(productId);

  return sendResponse(res, {
    message: "Review deleted"
  });
});

module.exports = {
  addReview,
  getReviews,
  updateReview,
  deleteReview
};
