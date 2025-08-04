const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} = require('../controllers/notificationController');

// Get notifications for current user
router.get('/', verifyToken, getNotifications);

// Get unread count
router.get('/unread-count', verifyToken, getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', verifyToken, markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', verifyToken, markAllAsRead);

// Delete notification
router.delete('/:notificationId', verifyToken, deleteNotification);

module.exports = router;