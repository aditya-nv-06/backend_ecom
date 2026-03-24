const { Question, Product, User } = require("../models");
const sendResponse = (res, { status = 200, success = true, message = "", data = null, meta = null }) =>
  res.status(status).json({ success, message, data, meta });


const askQuestion = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { question } = req.body;
    const userId = req.user.id;

    const product = await Product.findByPk(productId);
    if (!product || !product.isActive)
      return sendResponse(res, { status: 404, success: false, message: "Product not found or inactive" });

    const newQuestion = await Question.create({ productId, userId, question: question.trim() });
    return sendResponse(res, { status: 201, message: "Question added", data: newQuestion });
  } catch (err) {
    next(err);
  }
};


const answerQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    const answeredBy = req.user.id;

    const q = await Question.findByPk(questionId);
    if (!q) return sendResponse(res, { status: 404, success: false, message: "Question not found" });

    // Only admin or product owner can answer
    const product = await Product.findByPk(q.productId);
    if (!req.user.isAdmin && req.user.id !== product.userId)
      return sendResponse(res, { status: 403, success: false, message: "Unauthorized to answer this question" });

    await q.update({ answer: answer.trim(), answeredBy });
    const updatedQuestion = await Question.findByPk(questionId, {
      include: [
        { model: User, as: "user", attributes: ["id", "name"] },
        { model: User, as: "answeredByUser", attributes: ["id", "name"] }
      ]
    });
    return sendResponse(res, { message: "Answer added/updated", data: updatedQuestion });
  } catch (err) {
    next(err);
  }
};


const getProductQuestions = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const { count, rows } = await Question.findAndCountAll({
      where: { productId },
      include: [
        { model: User, as: "user", attributes: ["id", "name"] },
        { model: User, as: "answeredByUser", attributes: ["id", "name"] }
      ],
      limit, offset,
      order: [["createdAt", "DESC"]]
    });

    const questions = rows.map(q => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      askedBy: q.user,
      answeredBy: q.answeredByUser || null,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    }));

    return sendResponse(res, {
      message: count === 0 ? "No questions found" : "Questions fetched",
      meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
      data: questions
    });
  } catch (err) {
    next(err);
  }
};


const updateQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { question } = req.body;
    const userId = req.user.id;

    const q = await Question.findByPk(questionId);
    if (!q) return sendResponse(res, { status: 404, success: false, message: "Question not found" });
    if (q.userId !== userId) return sendResponse(res, { status: 403, success: false, message: "Unauthorized" });

    await q.update({ question: question.trim() });
    return sendResponse(res, { message: "Question updated", data: q });
  } catch (err) {
    next(err);
  }
};

/* ================= DELETE QUESTION ================= */
const deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;

    const q = await Question.findByPk(questionId);
    if (!q) return sendResponse(res, { status: 404, success: false, message: "Question not found" });
    if (q.userId !== userId) return sendResponse(res, { status: 403, success: false, message: "Unauthorized" });

    await q.destroy();
    return sendResponse(res, { message: "Question deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { askQuestion, answerQuestion, getProductQuestions, updateQuestion, deleteQuestion };
