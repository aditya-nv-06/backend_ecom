const express = require("express");
const { body, param, query } = require("express-validator");

const { validate } = require("../middleware/validation.middleware");
const { protect } = require("../middleware/auth.middleware");

const {
  askQuestion,
  answerQuestion,
  getProductQuestions,
  updateQuestion,
  deleteQuestion
} = require("../controllers/qaController");

const router = express.Router();

/* ================= ASK QUESTION ================= */

router.post(
  "/:productId/questions",
  protect,
  [
    param("productId").isUUID().withMessage("Invalid product ID"),
    body("question").trim().notEmpty().withMessage("Question is required")
  ],
  validate,
  askQuestion
);

/* ================= GET QUESTIONS ================= */

router.get(
  "/:productId/questions",
  [
    param("productId").isUUID().withMessage("Invalid product ID"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 })
  ],
  validate,
  getProductQuestions
);

/* ================= ANSWER QUESTION ================= */

router.post(
  "/questions/:questionId/answer",
  protect,
  [
    param("questionId").isUUID().withMessage("Invalid question ID"),
    body("answer").trim().notEmpty().withMessage("Answer required")
  ],
  validate,
  answerQuestion
);

/* ================= UPDATE QUESTION ================= */

router.put(
  "/questions/:questionId",
  protect,
  [
    param("questionId").isUUID(),
    body("question").trim().notEmpty()
  ],
  validate,
  updateQuestion
);

/* ================= DELETE QUESTION ================= */

router.delete(
  "/questions/:questionId",
  protect,
  [
    param("questionId").isUUID()
  ],
  validate,
  deleteQuestion
);

// Test route for debugging
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Test route working' });
});

module.exports = router;
