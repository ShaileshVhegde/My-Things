const express = require('express');
const { addProduct, getProducts, getProductById, deleteProduct, getProductStats } = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// Dashboard stats
router.get('/stats', getProductStats);

// Product CRUD — file upload is optional, handled inside controller
router.post('/add', (req, res, next) => {
  // Dynamically load multer only if Cloudinary is configured
  try {
    const { upload } = require('../config/cloudinary');
    upload.fields([
      { name: 'bill', maxCount: 1 },
      { name: 'warranty', maxCount: 1 },
      { name: 'manual', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        console.error('File upload error:', err.message);
        return res.status(400).json({ error: `File upload failed: ${err.message}` });
      }
      next();
    });
  } catch (e) {
    console.error('Cloudinary not configured (skipping uploads):', e.message);
    next();
  }
});

router.post('/add', addProduct);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.delete('/:id', deleteProduct);

module.exports = router;
