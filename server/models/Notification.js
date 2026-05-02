const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // productId is optional — system/welcome notifications have no product
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  message: {
    type: String,
    required: true
  },
  /**
   * Type taxonomy:
   *  welcome          – sent on first successful signup
   *  product_added    – in-app only, when user adds a product
   *  product_updated  – in-app only, when user updates a product
   *  product_deleted  – in-app only, when user deletes a product
   *  expiry_warning   – in-app + email, warranty expiring soon (30d / 7d / 1d)
   *  expiry           – in-app + email, warranty expired today
   */
  type: {
    type: String,
    enum: [
      'welcome',
      'product_added',
      'product_updated',
      'product_deleted',
      'expiry_warning',
      'expiry',
      // legacy values kept for backward compat
      'reminder',
    ],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
