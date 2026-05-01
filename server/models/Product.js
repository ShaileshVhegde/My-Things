const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  type: {
    type: String,
    enum: ['bill', 'warranty', 'manual'],
    required: true
  }
}, { _id: false });

const storeDetailsSchema = new mongoose.Schema({
  storeName: { type: String, trim: true, default: '' },
  phoneNumber: { type: String, trim: true, default: '' },
  location: { type: String, trim: true, default: '' },
}, { _id: false });

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productName: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  purchaseDate: { type: Date, required: true },
  warrantyMonths: { type: Number, min: 0 },
  warrantyValue: { type: Number, min: 1 },
  warrantyUnit: { type: String, enum: ['Days', 'Months', 'Years'] },
  warrantyExpiryDate: { type: Date, required: true },
  storeDetails: { type: storeDetailsSchema, default: () => ({}) },
  notes: { type: String, trim: true, default: '' },
  documents: [documentSchema],
  // AI OCR fields — extracted once when product is added/updated
  extractedText: { type: String, default: '' },
  extractedSummary: { type: mongoose.Schema.Types.Mixed, default: null },
  ocrStatus: { type: String, enum: ['pending', 'done', 'failed', 'none'], default: 'none' },
  chatHistory: [
    {
      question: { type: String },
      answer: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ],
}, {
  timestamps: true
});

// Virtual: warranty status
productSchema.virtual('warrantyStatus').get(function () {
  const now = new Date();
  const expiry = this.warrantyExpiryDate;
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'expiring_soon';
  return 'active';
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
