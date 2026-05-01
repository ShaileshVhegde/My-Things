const Notification = require('../models/Notification');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50 notifications
    res.json({ notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ notification });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};
