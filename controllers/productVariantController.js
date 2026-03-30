const { Product, ProductVariant } = require("../models");
const { Op } = require("sequelize");
const messages = require('../constants/messages');
const catchAsync = require('../utils/catchAsync');

/**
 * Get all product variants
 * GET /api/product-variants
 */

/**
 * Get a single product variant
 * GET /api/product-variants/:id
 */
const getVariantById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const variant = await ProductVariant.findByPk(id, {
        include: [
            {
                model: Product,
                as: 'variantProduct',
                attributes: ['id', 'name', 'price']
            }
        ]
    });

    if (!variant) {
        return res.status(404).json({ success: false, message: messages.ERROR.NOT_FOUND });
    }

    return res.json({ success: true, data: variant });
});

/**
 * Create a new product variant
 * POST /api/product-variants
 */

/**
 * Update a product variant
 * PATCH /api/product-variants/:id
 */

/**
 * Delete a product variant
 * DELETE /api/product-variants/:id
 */

// ================= GET VARIANTS BY PRODUCT ID =================
const getVariantsByProduct = catchAsync(async (req, res, next) => {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: messages.ERROR.NOT_FOUND });
    }

    const variants = await ProductVariant.findAll({
      where: { productId },
      attributes: ["id", "color", "stock", "price"]
    });

    if (!variants.length) {
      return res.status(404).json({ success: false, message: messages.ERROR.NOT_FOUND });
    }

    return res.json({ success: true, data: variants });
  });

// ================= SELECT VARIANT BY COLOR =================
const getVariantByColor = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    const { color } = req.query;

    if (!color) {
      return res.status(400).json({ success: false, message: messages.ERROR.REQUIRED_FIELDS });
    }

    const variant = await ProductVariant.findOne({
      where: {
        productId,
        color: { [Op.iLike]: color } // case-insensitive
      },
      attributes: ["id", "color", "stock", "price"] // removed hexCode
    });

    if (!variant) {
      return res.status(404).json({ success: false, message: messages.ERROR.NOT_FOUND });
    }

    return res.json({ success: true, data: variant });
  });


module.exports = { getVariantsByProduct, getVariantByColor, getVariantById };
