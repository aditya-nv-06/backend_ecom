const express = require("express");
const router = express.Router();

const { getVariantsByProduct, getVariantByColor, getVariantById } = require("../controllers/productVariantController");
const { param, query } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");

// ================= GET SINGLE VARIANT BY ID =================
router.get(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid variant ID")
  ],
  validate,
  getVariantById
);

// ================= GET ALL VARIANTS BY PRODUCT ID =================
router.get(
  "/:productId/variants",
  [
    param("productId").isUUID().withMessage("Invalid product ID")
  ],
  validate,
  getVariantsByProduct
);

// ================= GET VARIANT BY COLOR =================
router.get(
  "/:productId/variant",
  [
    param("productId").isUUID().withMessage("Invalid product ID"),
    query("color").notEmpty().withMessage("Color is required")
  ],
  validate,
  getVariantByColor
);

module.exports = router;
