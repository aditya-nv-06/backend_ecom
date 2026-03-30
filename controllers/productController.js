const {
  Product,
  ProductImage,
  ProductSpecification,
  ProductVariant,
  Category,
  sequelize
} = require("../models");

const Message = require("../constants/messages");
const catchAsync = require("../utils/catchAsync");
const { Op } = require("sequelize");

/* ================= COMMON RESPONSE ================= */
const sendResponse = (res, {
  status = 200,
  success = true,
  message = "",
  data = null,
  meta = null
}) => res.status(status).json({ success, message, data, meta });


/* ================= GET ALL PRODUCTS ================= */
const getProducts = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const offset = (page - 1) * limit;

  // Base filter
  const where = { isActive: true };

  // Search filter
  if (req.query.search) {
    const key = req.query.search.trim();
    where[Op.or] = [
      { name: { [Op.iLike]: `%${key}%` } },
      { description: { [Op.iLike]: `%${key}%` } }
    ];
  }

  // Price filter
  if (req.query.minPrice || req.query.maxPrice) {
    where.price = {};
    if (req.query.minPrice) where.price[Op.gte] = req.query.minPrice;
    if (req.query.maxPrice) where.price[Op.lte] = req.query.maxPrice;
  }

  // Category filter using association
  const include = [
    { association: "images", attributes: ["id", "imageUrl"] }
  ];
  if (req.query.category) {
    include.push({
      model: Category,
      as: "productCategory",
      where: { name: req.query.category },
      attributes: ["id", "name"]
    });
  }

  const total = await Product.count({ where });
  const totalPages = Math.ceil(total / limit) || 1;

  if (page > totalPages) {
    return sendResponse(res, {
      status: 400,
      success: false,
      message: Message.ERROR.PAGE_NOT_FOUND
    });
  }

  const products = await Product.findAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include
  });

  return sendResponse(res, {
    message: Message.SUCCESS.PRODUCTS_FETCHED,
    data: products,
    meta: { total, page, limit, totalPages }
  });
});


/* ================= GET PRODUCT BY ID ================= */
const getProductById = catchAsync(async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    include: ["images", "specifications", "variants", "details", { model: Category, as: "productCategory" }]
  });

  if (!product || !product.isActive) {
    return sendResponse(res, {
      status: 404,
      success: false,
      message: Message.ERROR.PRODUCT_NOT_FOUND
    });
  }

  return sendResponse(res, {
    message: Message.SUCCESS.PRODUCT_FETCHED,
    data: product
  });
});

/* ================= SEARCH PRODUCTS ================= */
const searchProducts = catchAsync(async (req, res) => {
  const key = req.query.key.trim();
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const offset = (page - 1) * limit;

  const where = {
    isActive: true,
    [Op.or]: [
      { name: { [Op.iLike]: `%${key}%` } },
      { description: { [Op.iLike]: `%${key}%` } }
    ]
  };

  const total = await Product.count({ where });
  const totalPages = Math.ceil(total / limit) || 1;

  const products = await Product.findAll({
    where,
    limit,
    offset,
    include: [{ association: "images", attributes: ["id", "imageUrl"] }]
  });

  return sendResponse(res, {
    message: Message.SUCCESS.PRODUCTS_FETCHED || "Products retrieved",
    data: products,
    meta: { total, page, limit, totalPages }
  });
});

/* ================= GET RELATED PRODUCTS ================= */
const getRelatedProducts = catchAsync(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  
  if (!product) {
    return sendResponse(res, { status: 404, success: false, message: Message.ERROR.PRODUCT_NOT_FOUND });
  }

  let related = await Product.findAll({
    where: {
      categoryId: product.categoryId,
      id: { [Op.ne]: product.id },
      price: {
        [Op.between]: [
          product.price * 0.7,
          product.price * 1.3
        ]
      },
      isActive: true
    },
    include: [{ association: "images", attributes: ["id", "imageUrl"] }],
    limit: 10,
    order: [["createdAt", "DESC"]]
  });

  if (!related.length) {
    related = await Product.findAll({
      where: {
        categoryId: product.categoryId,
        id: { [Op.ne]: product.id },
        isActive: true
      },
      include: [{ association: "images", attributes: ["id", "imageUrl"] }],
      order: [["soldCount", "DESC"]],
      limit: 10
    });
  }

  if (!related.length) {
    related = await Product.findAll({
      where: {
        id: { [Op.ne]: product.id },
        isActive: true
      },
      include: [{ association: "images", attributes: ["id", "imageUrl"] }],
      order: [["createdAt", "DESC"]],
      limit: 10
    });
  }

  return sendResponse(res, {
    message: "Related products fetched",
    data: related
  });
});

/* ================= GET FULL PRODUCT DETAILS ================= */
// Identical to getProductById but explicitly exported to fix router crash
const getFullProductDetails = getProductById;



/* ================= CREATE PRODUCT ================= */
/* ================= CREATE PRODUCT ================= */
const createProduct = catchAsync(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      description,
      brand,
      originalPrice,
      discountPercentage = 0,
      category, // string name of category
      stock = 0,
      images = [],
      specifications = {},
      details = [], // New JSONB sections
      variants = []
    } = req.body;

    if (!name || !category) throw new Error("Name and category are required");
    if (!originalPrice || originalPrice <= 0) throw new Error("Invalid original price");
    if (discountPercentage < 0 || discountPercentage > 90) throw new Error("Invalid discount percentage");

    // 2. Automatic Category Management
    const normalizedCategory = category.trim().toLowerCase();
    
    // Check if category exists by name OR slug to prevent unique constraint errors
    let categoryRecord = await Category.findOne({ 
      where: { 
        [Op.or]: [
          { name: normalizedCategory },
          { slug: normalizedCategory }
        ]
      },
      transaction 
    });

    if (!categoryRecord) {
      categoryRecord = await Category.create(
        { name: normalizedCategory }, // slug auto-generated by model hook
        { transaction }
      );
    }

    const finalPrice = originalPrice - (originalPrice * discountPercentage) / 100;

    // 3. Create Product (Storing only categoryId)
    const product = await Product.create({
      name,
      description,
      brand,
      originalPrice,
      discountPercentage,
      price: finalPrice,
      discountPrice: finalPrice,
      categoryId: categoryRecord.id,
      stock
    }, { transaction });

    // 4. Create Associated Data
    if (images.length) {
      await ProductImage.bulkCreate(
        images.map(img => ({ productId: product.id, imageUrl: img })),
        { transaction }
      );
    }

    // --- Specifications ---
    if (specifications && Object.keys(specifications).length) {
      await ProductSpecification.create({ productId: product.id, specifications }, { transaction });
    }

    // --- Variants ---
    if (variants.length) {
      await ProductVariant.bulkCreate(
        variants.map(v => ({ 
          productId: product.id, 
          color: v.color, 
          size: v.size, // New field
          price: v.price, 
          stock: v.stock 
        })),
        { transaction }
      );
    }

    // --- Product Details (Dynamic Sections) ---
    if (details && details.length) {
      const { ProductDetails } = require("../models"); // Ensure it's available if not already destructured
      await ProductDetails.create({ 
        productId: product.id, 
        sections: details 
      }, { transaction });
    }

    await transaction.commit();

    // 5. Fetch Full Product with Associations ---
    const fullProduct = await Product.findByPk(product.id, {
      include: ["images", "specifications", "variants", "details", { model: Category, as: "productCategory" }]
    });

    return sendResponse(res, {
      status: 201,
      message: "Product created successfully",
      data: fullProduct
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("❌ Error creating product:", error);
    return sendResponse(res, { 
      status: 400, 
      success: false, 
      message: error.name === 'SequelizeUniqueConstraintError' ? `Conflict: ${error.errors[0].message}` : error.message 
    });
  }
});


/* ================= UPDATE PRODUCT ================= */
const updateProduct = catchAsync(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) return sendResponse(res, { status: 404, success: false, message: Message.ERROR.PRODUCT_NOT_FOUND });

  const { originalPrice, discountPercentage } = req.body;
  if (originalPrice || discountPercentage !== undefined) {
    const price = originalPrice || product.originalPrice;
    const discount = discountPercentage ?? product.discountPercentage;
    const finalPrice = price - (price * discount) / 100;
    req.body.price = finalPrice;
    req.body.discountPrice = finalPrice;
  }

  await product.update(req.body);

  return sendResponse(res, {
    message: "Product updated successfully",
    data: product
  });
});


/* ================= DELETE PRODUCT ================= */
const deleteProduct = catchAsync(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) return sendResponse(res, { status: 404, success: false, message: Message.ERROR.PRODUCT_NOT_FOUND });

  await product.update({ isActive: false });

  return sendResponse(res, { message: "Product deleted successfully" });
});


/* ================= EXPORT ================= */
module.exports = {
  getProducts,
  getProductById,
  searchProducts,
  getRelatedProducts,
  getFullProductDetails,
  createProduct,
  updateProduct,
  deleteProduct
};
