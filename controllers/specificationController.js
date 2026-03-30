const { ProductSpecification, Product, sequelize } = require("../models");
const catchAsync = require("../utils/catchAsync");
const Message = require("../constants/messages");
const { Op } = require("sequelize");

/* ================= COMMON RESPONSE ================= */
const sendResponse = (res, { status = 200, success = true, message = "", data = null, meta = null }) => {
  return res.status(status).json({ success, message, data, meta });
};

/* =========================================================
   ================= CLIENT CONTROLLERS =====================
   ========================================================= */

/**
 * Get all specifications
 * GET /api/specifications
 */
/* ================= GET ALL SPECIFICATIONS ================= */
const getSpecifications = catchAsync(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const { productId } = req.query;

  const where = {};
  
  if (productId) {
    where.productId = productId;
  }

  const total = await ProductSpecification.count({ where });
  const totalPages = Math.ceil(total / limit) || 1;

  if (page > totalPages) {
    return sendResponse(res, {
      status: 400,
      success: false,
      message: Message.ERROR.PAGE_NOT_FOUND
    });
  }

  const specifications = await ProductSpecification.findAll({
    where,
    include: [
      {
        model: Product,
        attributes: ["id", "name", "category"]
      }
    ],
    limit,
    offset: (page - 1) * limit,
    order: [["createdAt", "DESC"]]
  });

  return sendResponse(res, {
    message: "Specifications fetched successfully",
    meta: { total, page, limit, totalPages },
    data: specifications
  });
});

/**
 * Get a single specification
 * GET /api/specifications/:id
 */
/* ================= GET SPECIFICATION BY ID ================= */
const getSpecificationById = catchAsync(async (req, res, next) => {
  const specification = await ProductSpecification.findByPk(req.params.id, {
    include: [
      {
        model: Product,
        attributes: ["id", "name", "category", "price"]
      }
    ]
  });

  if (!specification) {
    return sendResponse(res, {
      status: 404,
      success: false,
      message: "Specification not found"
    });
  }

  return sendResponse(res, {
    message: "Specification fetched successfully",
    data: specification
  });
});

/**
 * Get specifications by product ID
 * GET /api/specifications/:productId
 */
/* ================= GET SPECIFICATIONS BY PRODUCT ID ================= */
const getSpecificationsByProductId = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const product = await Product.findByPk(productId);
  if (!product) {
    return sendResponse(res, {
      status: 404,
      success: false,
      message: "Product not found"
    });
  }

  const specifications = await ProductSpecification.findAll({
    where: { productId },
    order: [["createdAt", "DESC"]]
  });

  return sendResponse(res, {
    message: "Specifications fetched successfully",
    data: specifications
  });
});

/**
 * Search specifications
 * GET /api/specifications/search
 */
/* ================= SEARCH SPECIFICATIONS ================= */
const searchSpecifications = catchAsync(async (req, res, next) => {
  const key = req.query.key?.trim();

  if (!key) {
    return sendResponse(res, {
      status: 400,
      success: false,
      message: "Search key is required"
    });
  }

  const { count, rows } = await ProductSpecification.findAndCountAll({
    where: {
      [Op.or]: [
        sequelize.where(
          sequelize.cast(sequelize.col("specifications"), "text"),
          { [Op.iLike]: `%${key}%` }
        )
      ]
    },
    include: [
      {
        model: Product,
        attributes: ["id", "name"]
      }
    ]
  });

  return sendResponse(res, {
    message: count ? "Search results fetched" : "No specifications found",
    data: rows,
    meta: { total: count }
  });
});

/* =========================================================
   ================= ADMIN CONTROLLERS ======================
   ========================================================= */

/**
 * Create a new specification
 * POST /api/specifications
 */
/* ================= CREATE SPECIFICATION ================= */
const createSpecification = catchAsync(async (req, res, next) => {
  const { productId, specifications } = req.body;

  if (!productId) {
    return sendResponse(res, {
      status: 400,
      success: false,
      message: "Product ID is required"
    });
  }

  const product = await Product.findByPk(productId);
  if (!product) {
    return sendResponse(res, {
      status: 404,
      success: false,
      message: "Product not found"
    });
  }

  const specification = await ProductSpecification.create({
    productId,
    specifications: specifications || {}
  });

  return sendResponse(res, {
    status: 201,
    message: "Specification created successfully",
    data: specification
  });
});

/**
 * Update a specification
 * PATCH /api/specifications/:id
 */
/* ================= UPDATE SPECIFICATION ================= */
const updateSpecification = catchAsync(async (req, res, next) => {
  const specification = await ProductSpecification.findByPk(req.params.id);

  if (!specification) {
    return sendResponse(res, {
      status: 404,
      success: false,
      message: "Specification not found"
    });
  }

  await specification.update(req.body);

  return sendResponse(res, {
    message: "Specification updated successfully",
    data: specification
  });
});

/**
 * Delete a specification
 * DELETE /api/specifications/:id
 */
/* ================= DELETE SPECIFICATION ================= */
const deleteSpecification = catchAsync(async (req, res, next) => {
  const specification = await ProductSpecification.findByPk(req.params.id);

  if (!specification) {
    return sendResponse(res, {
      status: 404,
      success: false,
      message: "Specification not found"
    });
  }

  await specification.destroy();

  return sendResponse(res, {
    message: "Specification deleted successfully"
  });
});

module.exports = {
  getSpecifications,
  getSpecificationById,
  getSpecificationsByProductId,
  searchSpecifications,
  createSpecification,
  updateSpecification,
  deleteSpecification
};
