const { Wishlist, Product, ProductImage, Category } = require("../models");
const messages = require('../constants/messages');
const catchAsync = require('../utils/catchAsync');

const sendResponse = (res, { status = 200, success = true, message = "", data = null, meta = null }) => {
  return res.status(status).json({ success, message, meta, data });
};

/* ================= ADD TO WISHLIST ================= */
const addToWishlist = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const { productId } = req.body;

  if (!userId) throw new Error(messages.ERROR.UNAUTHORIZED);

  const product = await Product.findByPk(productId);
  if (!product || !product.isActive) {
    return sendResponse(res, { status: 404, success: false, message: messages.ERROR.NOT_FOUND });
  }

  const exists = await Wishlist.findOne({ where: { userId, productId } });
  if (exists) {
    return sendResponse(res, { status: 400, success: false, message: "Already in wishlist" });
  }

  const item = await Wishlist.create({ userId, productId });

  const wishlistItem = await Wishlist.findByPk(item.id, {
    include: [
      {
        model: Product,
        as: "wishlistProduct",
        attributes: ["id", "name", "price", "discountPercentage", "rating"],
        include: [
          { model: ProductImage, as: "images", attributes: ["imageUrl"], limit: 1 },
          { model: Category, as: "productCategory", attributes: ["name"] }
        ]
      }
    ]
  });

  const productData = wishlistItem.wishlistProduct.toJSON();
  const discountPrice = productData.price - (productData.price * (productData.discountPercentage || 0) / 100);

  const formatted = {
    id: wishlistItem.id,
    product: {
      ...productData,
      discountPrice,
      category: productData.productCategory?.name || null,
      thumbnail: productData.images?.[0]?.imageUrl || null
    }
  };

  return sendResponse(res, { status: 201, message: "Added to wishlist", data: formatted });
});

/* ================= GET WISHLIST ITEM BY ID ================= */
const getWishlistById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const item = await Wishlist.findOne({
    where: { id },
    include: [
      {
        model: Product,
        as: "wishlistProduct",
        attributes: ["id", "name", "price", "discountPercentage", "rating"],
        include: [
          { model: ProductImage, as: "images", attributes: ["imageUrl"], limit: 1 },
          { model: Category, as: "productCategory", attributes: ["name"] }
        ]
      }
    ]
  });

  if (!item) return sendResponse(res, { status: 404, success: false, message: messages.ERROR.NOT_FOUND });

  const productData = item.wishlistProduct.toJSON();
  const discountPrice = productData.price - (productData.price * (productData.discountPercentage || 0) / 100);

  const formatted = {
    id: item.id,
    product: {
      ...productData,
      discountPrice,
      category: productData.productCategory?.name || null,
      thumbnail: productData.images?.[0]?.imageUrl || null
    }
  };

  return sendResponse(res, { data: formatted });
});

/* ================= GET ALL WISHLIST ================= */
const getWishlist = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const { count, rows } = await Wishlist.findAndCountAll({
    where: { userId },
    include: [
      {
        model: Product,
        as: "wishlistProduct",
        attributes: ["id", "name", "price", "discountPercentage", "rating"],
        include: [
          { model: ProductImage, as: "images", attributes: ["imageUrl"], limit: 1 },
          { model: Category, as: "productCategory", attributes: ["name"] }
        ]
      }
    ]
  });

  const formatted = rows.map(item => {
    const productData = item.wishlistProduct.toJSON();
    const discountPrice = productData.price - (productData.price * (productData.discountPercentage || 0) / 100);

    return {
      id: item.id,
      product: {
        ...productData,
        discountPrice,
        category: productData.productCategory?.name || null,
        thumbnail: productData.images?.[0]?.imageUrl || null
      }
    };
  });

  return sendResponse(res, { message: "Wishlist fetched", data: formatted, meta: { count } });
});

/* ================= REMOVE FROM WISHLIST ================= */
const removeFromWishlist = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const deletedCount = await Wishlist.destroy({ where: { userId, productId } });

  if (deletedCount === 0) {
    return sendResponse(res, { status: 404, success: false, message: messages.ERROR.NOT_FOUND });
  }

  return sendResponse(res, { message: "Removed from wishlist" });
});

/* ================= CHECK IF PRODUCT IN WISHLIST ================= */
const checkWishlistItem = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const exists = await Wishlist.findOne({ where: { userId, productId } });

  return sendResponse(res, { data: { exists: !!exists } });
});

module.exports = {
  addToWishlist,
  getWishlist,
  getWishlistById,
  removeFromWishlist,
  checkWishlistItem
};
