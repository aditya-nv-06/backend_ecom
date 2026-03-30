const express = require("express");
const { query, param } = require("express-validator");
const { validate } = require("../../middleware/validation.middleware");

const {
  getProducts,
  getProductById,
  searchProducts,
  getRelatedProducts,
  getFullProductDetails
} = require("../../controllers/productController");

const catchAsync = require("../../utils/catchAsync");

const router = express.Router();

/* ================= PUBLIC ROUTES ================= */

// 🔍 SEARCH
router.get(
  "/search",
  [
    query("key").trim().notEmpty().withMessage("Search key is required"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  catchAsync(searchProducts) // wrap async in catchAsync
);

// 📦 LIST PRODUCTS
router.get("/", catchAsync(getProducts));

// 📄 FULL DETAILS
router.get("/:id/full", catchAsync(getFullProductDetails));

// 🔗 RELATED PRODUCTS
router.get("/:id/related", catchAsync(getRelatedProducts));

// 📌 SINGLE PRODUCT
router.get("/:id", catchAsync(getProductById));

module.exports = router;
