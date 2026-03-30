const express = require("express");
const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoriesController");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

// Public routes
router.get("/", getCategories);

//this is for dashbord related api  based on product type it will fetchdata
router.get("/:slug", getCategoryBySlug);

// Admin routes (protected)
router.post("/", protect, restrictTo("admin"), createCategory);
router.put("/:id", protect, restrictTo("admin"), updateCategory);
router.patch("/:id", protect, restrictTo("admin"), updateCategory);
router.delete("/:id", protect, restrictTo("admin"), deleteCategory);

module.exports = router;