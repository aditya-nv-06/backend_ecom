const express = require("express");
const router = express.Router();
const {
  getSpecifications,
  getSpecificationById,
  getSpecificationsByProductId,
  searchSpecifications,
  createSpecification,
  updateSpecification,
  deleteSpecification
} = require("../../controllers/specificationController");
const { protect, restrictTo } = require("../../middleware/auth.middleware");

/* ================= CLIENT ROUTES ================= */

// Get all specifications with pagination
router.get("/", getSpecifications);

// Search specifications
router.get("/search", searchSpecifications);

// Get specifications by product ID
router.get("/product/:productId", getSpecificationsByProductId);

// Get single specification by ID
router.get("/:id", getSpecificationById);

/* ================= ADMIN ROUTES ================= */

// Create specification (admin only)
router.post("/", protect, restrictTo("admin"), createSpecification);


// Update specification (admin only)
router.put("/:id", protect, restrictTo("admin"), updateSpecification);
router.patch("/:id", protect, restrictTo("admin"), updateSpecification);

// Delete specification (admin only)
router.delete("/:id", protect, restrictTo("admin"), deleteSpecification);

module.exports = router;
