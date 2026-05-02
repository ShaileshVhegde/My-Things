const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');
const { createNotification } = require('../utils/notificationHelper');

// POST /api/products/add
const addProduct = async (req, res) => {
  try {
    const { productName, category, purchaseDate, warrantyValue, warrantyUnit, storeName, phoneNumber, location, notes } = req.body;

    if (!productName || !category || !purchaseDate || !warrantyValue || !warrantyUnit) {
      return res.status(400).json({ error: 'productName, category, purchaseDate, warrantyValue and warrantyUnit are required' });
    }

    // Calculate warranty expiry date from purchase date + value/unit
    const purchase = new Date(purchaseDate);
    const expiryDate = new Date(purchase);
    const val = parseInt(warrantyValue);

    if (warrantyUnit === 'Days') {
      expiryDate.setDate(expiryDate.getDate() + val);
    } else if (warrantyUnit === 'Months') {
      expiryDate.setMonth(expiryDate.getMonth() + val);
    } else if (warrantyUnit === 'Years') {
      expiryDate.setFullYear(expiryDate.getFullYear() + val);
    }

    // Build documents array from uploaded files
    const documents = [];
    if (req.files) {
      for (const [type, files] of Object.entries(req.files)) {
        for (const file of files) {
          documents.push({ url: file.path, publicId: file.filename, type });
        }
      }
    }

    const product = await Product.create({
      userId: req.user.id,
      productName,
      category,
      purchaseDate: purchase,
      warrantyValue: val,
      warrantyUnit,
      warrantyExpiryDate: expiryDate,
      storeDetails: {
        storeName: storeName || '',
        phoneNumber: phoneNumber || '',
        location: location || '',
      },
      notes: notes || '',
      documents,
    });

    // ── In-app notification ──
    await createNotification({
      userId: req.user.id,
      type: 'product_added',
      message: `✅ "${productName}" has been added to your vault. Warranty expires on ${expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
      productId: product._id,
    });

    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ error: error.message || 'Failed to add product' });
  }
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user.id })
      .select('-documents')
      .sort({ warrantyExpiryDate: 1 });

    res.status(200).json({ products });
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// GET /api/products/stats
const getProductStats = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user.id })
      .select('warrantyExpiryDate category productName');

    const now = new Date();
    let active = 0, expired = 0, expiringSoon = 0;
    const categoryMap = {};
    const expiringSoonList = [];

    products.forEach(p => {
      const daysLeft = Math.ceil((p.warrantyExpiryDate - now) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) {
        expired++;
      } else if (daysLeft <= 30) {
        expiringSoon++;
        expiringSoonList.push({ id: p._id, name: p.productName, daysLeft, expiryDate: p.warrantyExpiryDate });
      } else {
        active++;
      }
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

    const monthlyTrend = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
      const label = monthStart.toLocaleString('default', { month: 'short', year: '2-digit' });
      const count = products.filter(p => p.warrantyExpiryDate >= monthStart && p.warrantyExpiryDate <= monthEnd).length;
      monthlyTrend.push({ month: label, expiring: count });
    }

    res.status(200).json({
      total: products.length,
      active,
      expired,
      expiringSoon,
      categoryBreakdown,
      expiringSoonList: expiringSoonList.sort((a, b) => a.daysLeft - b.daysLeft),
      monthlyTrend,
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user.id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.status(200).json({ product });
  } catch (error) {
    console.error('Get Product Error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// PATCH /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user.id });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const allowedFields = ['productName', 'category', 'notes', 'warrantyValue', 'warrantyUnit', 'purchaseDate', 'storeDetails'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    // Recalculate expiry if warranty fields changed
    if (req.body.purchaseDate || req.body.warrantyValue || req.body.warrantyUnit) {
      const purchase = new Date(product.purchaseDate);
      const expiry = new Date(purchase);
      const val = parseInt(product.warrantyValue);
      if (product.warrantyUnit === 'Days') expiry.setDate(expiry.getDate() + val);
      else if (product.warrantyUnit === 'Months') expiry.setMonth(expiry.getMonth() + val);
      else if (product.warrantyUnit === 'Years') expiry.setFullYear(expiry.getFullYear() + val);
      product.warrantyExpiryDate = expiry;
    }

    await product.save();

    // ── In-app notification ──
    await createNotification({
      userId: req.user.id,
      type: 'product_updated',
      message: `✏️ "${product.productName}" details have been updated successfully.`,
      productId: product._id,
    });

    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ error: error.message || 'Failed to update product' });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user.id });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const productName = product.productName;

    for (const doc of product.documents) {
      if (doc.publicId) {
        try {
          await cloudinary.uploader.destroy(doc.publicId, { resource_type: 'auto' });
        } catch (e) {
          console.error('Cloudinary delete error:', e.message);
        }
      }
    }

    await product.deleteOne();

    // ── In-app notification ──
    await createNotification({
      userId: req.user.id,
      type: 'product_deleted',
      // No productId — product is gone
      message: `🗑️ "${productName}" has been removed from your vault.`,
    });

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

module.exports = { addProduct, getProducts, getProductById, updateProduct, deleteProduct, getProductStats };
