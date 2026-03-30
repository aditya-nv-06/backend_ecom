const { Category } = require("../models");
const catchAsync = require("../utils/catchAsync");

const sendResponse = (res, { status = 200, success = true, message = "", data = null }) => {
  return res.status(status).json({ success, message, data });
};

/**
 * Get all categories
 * GET /api/categories
 */
const getCategories = catchAsync(async (req, res) => {
  const categories = await Category.findAll();
  return sendResponse(res, {
    message: "Categories fetched successfully",
    data: categories,
  });
});

/**
 * Get a single category
 * GET /api/categories/:id
 */
const getCategoryBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  const category = await Category.findOne({
    where: { slug: slug.toLowerCase() },
    include: [
      {
        association: "products",
        attributes: [
          "id",
          "name",
          "description",
          "originalPrice",
          "discountPercentage",
          "price",
          "stock",
          "isActive",
        ],
      },
    ],
  });

  if (!category) {
    return sendResponse(res, {
      status: 404,
      success: false,
      message: "Category not found",
    });
  }

  return sendResponse(res, {
    message: "Category details fetched successfully",
    data: category,
  });
});

/**
 * Create a new category
 * POST /api/categories
 */
const createCategory = catchAsync(async (req, res) => {
  const { name, description, image } = req.body;

  if (!name) {
    return sendResponse(res, {
      status: 400,
      success: false,
      message: "Category name is required",
    });
  }

  // Slug is auto-generated from name via model hook
  const category = await Category.create({ name, description, image });
  return sendResponse(res, {
    status: 201,
    message: "Category created successfully",
    data: category,
  });
});

/**
 * Update a category
 * PATCH /api/categories/:id
 */
const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description, image } = req.body;

  const category = await Category.findByPk(id);

  if (!category) {
    return sendResponse(res, {
      status: 404,
      success: false,
      message: "Category not found",
    });
  }

  await category.update({
    name: name ?? category.name,
    description: description ?? category.description,
    image: image ?? category.image,
  });

  return sendResponse(res, {
    message: "Category updated successfully",
    data: category,
  });
});

/**
 * Delete a category
 * DELETE /api/categories/:id
 */
const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByPk(id);

  if (!category) {
    return sendResponse(res, {
      status: 404,
      success: false,
      message: "Category not found",
    });
  }

  await category.destroy();
  return sendResponse(res, {
    message: "Category deleted successfully",
  });
});

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};