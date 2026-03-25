const {
  Product,
  ProductImage,
  ProductSpecification,
  ProductVariant,
  sequelize
} = require("../models");
const Message = require('../constants/messages')
const catchAsync = require('../utils/catchAsync');

const { Op } = require("sequelize");

/* ================= COMMON RESPONSE ================= */
const sendResponse = (res, { status = 200, success = true, message = "", data = null, meta = null }) => {
  return res.status(status).json({ success, message, data, meta });
};

/* ================= GET ALL PRODUCTS ================= */
const getProducts = catchAsync(async (req, res, next) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    const where = { isActive: true };

    if (req.query.category) {
      where.category = req.query.category;
    }

    if (req.query.search) {
      const key = req.query.search.trim();
      where[Op.or] = [
        { name: { [Op.iLike]: `%${key}%` } },
        { description: { [Op.iLike]: `%${key}%` } }
      ];
    }

    const total = await Product.count({ where });
    const totalPages = Math.ceil(total / limit) || 1;

    if (page > totalPages) {
      return sendResponse(res, { status: 400, success: false, message:Message.ERROR.PAGE_NOT_FOUND });
    }

    const products = await Product.findAll({
      where,
      include: ["images", "specifications", "variants"],
      limit,
      offset: (page - 1) * limit,
      order: [["createdAt", "DESC"]]
    });

    return sendResponse(res, {
      message: "Products fetched successfully",
      meta: { total, page, limit, totalPages },
      data: products
    });
  });


/* ================= GET SINGLE PRODUCT ================= */
const getProductById = catchAsync(async (req, res, next) => {
    const product = await Product.findByPk(req.params.id, {
      include: ["images", "specifications", "variants"]
    });

    if (!product || !product.isActive) {
      return sendResponse(res, { status: 404, success: false, message: "Product not found" });
    }

    return sendResponse(res, { message: "Product fetched successfully", data: product });
  });

/* ================= SEARCH PRODUCTS ================= */
const searchProducts = catchAsync(async (req, res, next) => {
    const key = req.query.key?.trim();

    if (!key) {
      return sendResponse(res, {
        status: 400,
        success: false,
        message: "Search key is required"
      });
    }

    const { count, rows } = await Product.findAndCountAll({
      where: {
        isActive: true,
        [Op.or]: [
          { name: { [Op.iLike]: `%${key}%` } },
          { description: { [Op.iLike]: `%${key}%` } }
        ]
      },
      include: ["images"]
    });

    return sendResponse(res, {
      message: count ? "Search results fetched" : "No products found",
      data: rows,
      meta: { total: count }
    });
  });

/* ================= RELATED PRODUCTS ================= */
const getRelatedProducts = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // 1️⃣ Get current product
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // 2️⃣ Smart category + price based recommendation
    let related = await Product.findAll({
      where: {
        category: { [Op.iLike]: product.category }, // case-insensitive
        id: { [Op.ne]: product.id }, // exclude current product
        price: {
          [Op.between]: [
            product.price * 0.7,
            product.price * 1.3
          ]
        },
        isActive: true
      },
      include: ["images"],
      limit: 10,
      order: [["createdAt", "DESC"]]
    });

    // 3️⃣ Fallback → Trending products (if no match)
    if (!related.length) {
      related = await Product.findAll({
        where: {
          id: { [Op.ne]: product.id },
          isActive: true
        },
        include: ["images"],
        order: [["soldCount", "DESC"]], 
        limit: 10
      });
    }

    // 4️⃣ Final fallback → latest products
    if (!related.length) {
      related = await Product.findAll({
        where: {
          id: { [Op.ne]: product.id },
          isActive: true
        },
        include: ["images"],
        order: [["createdAt", "DESC"]],
        limit: 10
      });
    }

    return res.status(200).json({
      success: true,
      message: "Smart recommendations fetched",
      data: related
    });
  });

/* ================= FULL PRODUCT DETAILS ================= */
const getFullProductDetails = catchAsync(async (req, res, next) => {
    const product = await Product.findByPk(req.params.id, {
      include: ["images", "specifications", "variants"]
    });

    if (!product) {
      return sendResponse(res, {
        status: 404,
        success: false,
        message: "Product not found"
      });
    }

    return sendResponse(res, {
      message: "Full product details fetched",
      data: product
    });
  });




/* =========================================================
   ================= ADMIN CONTROLLERS ======================
   ========================================================= */

/* ================= CREATE PRODUCT ================= */
const createProduct = catchAsync(async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const {
      name,
      description,
      originalPrice,
      discountPercentage = 0,
      category,
      stock = 0,
      images = [],
      specifications = {},
      variants = []
    } = req.body;

    if (!name || !category) throw new Error("Name & category required");

    if (!originalPrice || originalPrice <= 0) {
      throw new Error("Invalid price");
     }

    if (discountPercentage < 0 || discountPercentage > 90) {
      throw new Error("Invalid discount");
    }

    const finalPrice = originalPrice - (originalPrice * discountPercentage) / 100;

    const product = await Product.create(
      { name, description, originalPrice, discountPercentage, price: finalPrice, category, stock },
      { transaction: t }
    );

    if (images.length) {
      await ProductImage.bulkCreate(
        images.map(img => ({ productId: product.id, imageUrl: img })),
        { transaction: t }
      );
    }

    if (Object.keys(specifications).length) {
      await ProductSpecification.create(
        { productId: product.id, ...specifications },
        { transaction: t }
      );
    }

    if (variants.length) {
      await ProductVariant.bulkCreate(
        variants.map(v => ({
          productId: product.id,
          color: v.color,
          stock: v.stock,
          price: v.price
        })),
        { transaction: t }
      );
    }

    await t.commit();

    return sendResponse(res, { status: 201, message: "Product created", data: product });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

/* ================= UPDATE PRODUCT ================= */
const updateProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return sendResponse(res, { status: 404, success: false, message: "Product not found" });
    }

    await product.update(req.body);

    return sendResponse(res, { message: "Product updated", data: product });
  });

/* ================= DELETE PRODUCT ================= */
const deleteProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return sendResponse(res, { status: 404, success: false, message: "Product not found" });
    }

      await product.update({ isActive: false });

    return sendResponse(res, { message: "Product deleted" });
  });

module.exports = {
  getProducts,
  getProductById,
  searchProducts,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getFullProductDetails
};
