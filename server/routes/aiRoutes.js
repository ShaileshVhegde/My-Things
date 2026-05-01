const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  extractProductData,
  askProductQuestion,
  getProductAIStatus,
} = require('../controllers/aiController');

// All AI routes require authentication
router.use(authMiddleware);

// POST /api/ai/extract  — trigger OCR + structured extraction (called after product add)
router.post('/extract', extractProductData);

// POST /api/ai/ask  — answer a question about a product
router.post('/ask', askProductQuestion);

// GET  /api/ai/status/:productId  — get OCR status + summary + chat history
router.get('/status/:productId', getProductAIStatus);

module.exports = router;
