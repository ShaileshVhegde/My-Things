const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  clearAll,
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/mark-all-read', markAllRead);          // must be before /:id routes
router.delete('/clear-all', clearAll);                // must be before /:id routes
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
