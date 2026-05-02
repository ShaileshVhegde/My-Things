/**
 * notificationHelper.js
 *
 * Lightweight helper to create an in-app notification in the DB.
 * Import this wherever you need to create a notification without email.
 *
 * Usage:
 *   const { createNotification } = require('../utils/notificationHelper');
 *   await createNotification({ userId, type: 'product_added', message: '...', productId });
 */

const Notification = require('../models/Notification');

/**
 * Create an in-app notification.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.userId  - required
 * @param {string}          params.type    - required, one of the type enum values
 * @param {string}          params.message - required
 * @param {string|ObjectId} [params.productId] - optional
 */
const createNotification = async ({ userId, type, message, productId = null }) => {
  try {
    await Notification.create({ userId, type, message, productId });
  } catch (err) {
    // Never crash the calling operation because of a notification failure
    console.error('[notificationHelper] Failed to create notification:', err.message);
  }
};

module.exports = { createNotification };
