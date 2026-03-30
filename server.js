const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { sequelize, connectDB } = require('./config/sequelize');
const errorHandler = require('./middleware/error.middleware');
const AppError = require('./utils/AppError');
const messages = require('./constants/messages');
const  createDatabaseIfNotExists  = require('./utils/createDatabase');

// ✅ ROUTES
const routes = require('./routes/index');
const qaRoutes = require("./routes/qa.routes");

const app = express();

// ================= SECURITY =================
// Prevent XSS attacks

// ================= CORS =================
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// ================= LOGGING =================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ================= RATE LIMIT =================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max requests per IP
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// ================= BODY PARSING =================
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// ================= LOAD MODELS DYNAMICALLY =================
// Load all model files to ensure associations are registered
// This is done before database sync to avoid foreign key issues
const modelsPath = path.join(__dirname, "models");
fs.readdirSync(modelsPath)
  .filter((file) => file.endsWith(".js"))
  .forEach((file) => require(path.join(modelsPath, file)));

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ✅ USE ROUTES (CLEAN)
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running'
  });
});

// ✅ Adjust QA route registration
app.use('/api/products', qaRoutes);

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({ success: false, message: messages.ERROR.NOT_FOUND });
});

// ================= GLOBAL ERROR HANDLER =================
app.use(errorHandler);

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1️⃣ Connect to database (already handles sync)
      await createDatabaseIfNotExists();

        // 2️⃣ Connect Sequelize and sync models
        await connectDB();

    // 2️⃣ Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
    });

    // 3️⃣ Global unhandled promise rejection
    process.on("unhandledRejection", (err) => {
      console.error("❌ Unhandled Rejection:", err);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    console.error("❌ Server start error:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
