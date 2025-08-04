const Notification = require('../models/Notification');
const Booking = require('../models/Booking');

// Get notifications for a user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId || req.user?.employeeId;
    const userEmail = req.user?.email || req.user?.userEmail;
    const userRole = req.user?.role;
    
    console.log('🔔 Fetching notifications for user:', {
      userId,
      userEmail,
      userRole,
      fullUser: req.user
    });

    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    // Build query based on user - try multiple recipient matching strategies
    const query = {
      $or: [
        { recipient: userId },
        { recipient: userEmail },
        { recipient: req.user?.employeeId },
        { recipient: req.user?.username }
      ].filter(condition => condition.recipient) // Remove undefined recipients
    };

    if (unreadOnly === 'true') {
      query.read = false;
    }

    console.log('🔔 Notification query:', JSON.stringify(query, null, 2));

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('bookingId', 'roomName date startTime endTime status purpose');

    const unreadCount = await Notification.countDocuments({
      $or: query.$or,
      read: false
    });

    console.log('🔔 Found notifications:', {
      count: notifications.length,
      unreadCount,
      notificationIds: notifications.map(n => n._id)
    });

    res.json({
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id || req.user?._id || req.user?.userId || req.user?.employeeId;
    const userEmail = req.user?.email || req.user?.userEmail;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        $or: [
          { recipient: userId },
          { recipient: userEmail },
          { recipient: req.user?.employeeId },
          { recipient: req.user?.username }
        ].filter(condition => condition.recipient)
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId || req.user?.employeeId;
    const userEmail = req.user?.email || req.user?.userEmail;

    await Notification.updateMany(
      {
        $or: [
          { recipient: userId },
          { recipient: userEmail },
          { recipient: req.user?.employeeId },
          { recipient: req.user?.username }
        ].filter(condition => condition.recipient),
        read: false
      },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};

// Create notification (internal function)
const createNotification = async (notificationData) => {
  try {
    console.log('🔔 Creating notification:', {
      recipient: notificationData.recipient,
      recipientRole: notificationData.recipientRole,
      type: notificationData.type,
      title: notificationData.title,
      senderName: notificationData.senderName
    });

    // Validate required fields
    if (!notificationData.recipient) {
      console.error('❌ Cannot create notification: missing recipient');
      throw new Error('Recipient is required for notification creation');
    }

    if (!notificationData.senderName) {
      console.error('❌ Cannot create notification: missing senderName');
      throw new Error('SenderName is required for notification creation');
    }

    const notification = new Notification(notificationData);
    const savedNotification = await notification.save();
    
    console.log('✅ Notification created successfully:', {
      id: savedNotification._id,
      recipient: savedNotification.recipient,
      type: savedNotification.type
    });
    
    return savedNotification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    console.error('❌ Notification data that failed:', notificationData);
    throw error;
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id || req.user?._id || req.user?.userId || req.user?.employeeId;
    const userEmail = req.user?.email || req.user?.userEmail;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      $or: [
        { recipient: userId },
        { recipient: userEmail },
        { recipient: req.user?.employeeId },
        { recipient: req.user?.username }
      ].filter(condition => condition.recipient)
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId || req.user?.employeeId;
    const userEmail = req.user?.email || req.user?.userEmail;

    const count = await Notification.countDocuments({
      $or: [
        { recipient: userId },
        { recipient: userEmail },
        { recipient: req.user?.employeeId },
        { recipient: req.user?.username }
      ].filter(condition => condition.recipient),
      read: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

// Notification helper functions for booking events
const notificationHelpers = {
  // When employee creates booking request
  async createBookingRequestNotification(booking, employee, manager) {
    if (!manager) {
      console.log('⚠️ No manager provided for booking request notification');
      return;
    }

    console.log('🔔 Creating booking request notification:', {
      bookingId: booking._id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      managerName: manager.name,
      managerEmail: manager.email,
      roomName: booking.roomName
    });

    try {
      const recipient = manager.email || manager.employeeId || manager._id;
      if (!recipient) {
        console.error('❌ Manager has no valid recipient identifier:', manager);
        return;
      }

      await createNotification({
        recipient: recipient,
        recipientRole: 'manager',
        sender: employee.email || employee.employeeId,
        senderName: employee.name,
        senderRole: 'employee',
        type: 'booking_request',
        title: 'New Booking Request',
        message: `${employee.name} has requested to book ${booking.roomName} on ${booking.date} at ${booking.startTime}`,
        bookingId: booking._id,
        roomName: booking.roomName,
        bookingDate: booking.date,
        bookingTime: booking.startTime,
        actionUrl: '/approval',
        priority: 'medium'
      });

      console.log('✅ Booking request notification created successfully');
    } catch (error) {
      console.error('❌ Failed to create booking request notification:', error);
    }
  },

  // When manager approves booking
  async createBookingApprovedNotification(booking, manager, employee) {
    console.log('🔔 Creating booking approved notification:', {
      bookingId: booking._id,
      managerName: manager.name,
      employeeName: employee.name,
      employeeEmail: employee.email,
      roomName: booking.roomName
    });

    try {
      const recipient = employee.email || employee.employeeId;
      if (!recipient) {
        console.error('❌ Employee has no valid recipient identifier:', employee);
        return;
      }

      await createNotification({
        recipient: recipient,
        recipientRole: 'employee',
        sender: manager.email || manager.employeeId,
        senderName: manager.name,
        senderRole: 'manager',
        type: 'booking_approved',
        title: 'Booking Approved',
        message: `Your booking for ${booking.roomName} on ${booking.date} at ${booking.startTime} has been approved`,
        bookingId: booking._id,
        roomName: booking.roomName,
        bookingDate: booking.date,
        bookingTime: booking.startTime,
        actionUrl: '/booking-status',
        priority: 'high'
      });

      console.log('✅ Booking approved notification created successfully');
    } catch (error) {
      console.error('❌ Failed to create booking approved notification:', error);
    }
  },

  // When manager rejects booking
  async createBookingRejectedNotification(booking, manager, employee, reason = '') {
    console.log('🔔 Creating booking rejected notification:', {
      bookingId: booking._id,
      managerName: manager.name,
      employeeName: employee.name,
      employeeEmail: employee.email,
      roomName: booking.roomName,
      reason: reason
    });

    try {
      const recipient = employee.email || employee.employeeId;
      if (!recipient) {
        console.error('❌ Employee has no valid recipient identifier:', employee);
        return;
      }

      await createNotification({
        recipient: recipient,
        recipientRole: 'employee',
        sender: manager.email || manager.employeeId,
        senderName: manager.name,
        senderRole: 'manager',
        type: 'booking_rejected',
        title: 'Booking Rejected',
        message: `Your booking for ${booking.roomName} on ${booking.date} at ${booking.startTime} has been rejected${reason ? '. Reason: ' + reason : ''}`,
        bookingId: booking._id,
        roomName: booking.roomName,
        bookingDate: booking.date,
        bookingTime: booking.startTime,
        actionUrl: '/booking-status',
        priority: 'high',
        metadata: { reason }
      });

      console.log('✅ Booking rejected notification created successfully');
    } catch (error) {
      console.error('❌ Failed to create booking rejected notification:', error);
    }
  },

  // When booking is cancelled
  async createBookingCancelledNotification(booking, cancelledBy, recipients = []) {
    console.log('🔔 Creating booking cancelled notifications:', {
      bookingId: booking._id,
      cancelledByName: cancelledBy.name,
      recipientCount: recipients.length,
      recipients: recipients.map(r => ({ name: r.name, email: r.email, role: r.role }))
    });

    for (const recipient of recipients) {
      if (recipient.email !== cancelledBy.email) {
        try {
          const recipientId = recipient.email || recipient.employeeId;
          if (!recipientId) {
            console.error('❌ Recipient has no valid identifier:', recipient);
            continue;
          }

          await createNotification({
            recipient: recipientId,
            recipientRole: recipient.role,
            sender: cancelledBy.email || cancelledBy.employeeId,
            senderName: cancelledBy.name,
            senderRole: cancelledBy.role,
            type: 'booking_cancelled',
            title: 'Booking Cancelled',
            message: `Booking for ${booking.roomName} on ${booking.date} at ${booking.startTime} has been cancelled by ${cancelledBy.name}`,
            bookingId: booking._id,
            roomName: booking.roomName,
            bookingDate: booking.date,
            bookingTime: booking.startTime,
            actionUrl: recipient.role === 'employee' ? '/booking-status' : '/approval',
            priority: 'medium'
          });

          console.log(`✅ Cancellation notification sent to ${recipient.name}`);
        } catch (error) {
          console.error(`❌ Failed to create cancellation notification for ${recipient.name}:`, error);
        }
      }
    }
  },

  // ✅ FIXED: HR Self-Notification Only - Only notify HR user about their own actions
  async createHRSelfNotification(booking, hrUser, eventType, details = '') {
    console.log('🔔 Creating HR self notification:', {
      bookingId: booking._id,
      hrUserName: hrUser.name,
      hrUserEmail: hrUser.email,
      eventType: eventType,
      roomName: booking.roomName
    });

    try {
      const recipient = hrUser.email || hrUser.employeeId;
      if (!recipient) {
        console.error('❌ HR user has no valid recipient identifier:', hrUser);
        return;
      }

      const messages = {
        'created': `You created a booking for ${booking.roomName}`,
        'approved': `You approved a booking for ${booking.roomName}`,
        'rejected': `You rejected a booking for ${booking.roomName}`,
        'cancelled': `You cancelled a booking for ${booking.roomName}`
      };

      await createNotification({
        recipient: recipient,
        recipientRole: 'hr',
        sender: hrUser.email || hrUser.employeeId,
        senderName: hrUser.name,
        senderRole: 'hr',
        type: 'booking_created',
        title: `Booking ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`,
        message: messages[eventType] + (details ? ` - ${details}` : ''),
        bookingId: booking._id,
        roomName: booking.roomName,
        bookingDate: booking.date,
        bookingTime: booking.startTime,
        actionUrl: '/approval',
        priority: 'low',
        metadata: { eventType, details }
      });

      console.log(`✅ HR self notification created for ${hrUser.name || hrUser.email}`);
    } catch (error) {
      console.error(`❌ Failed to create HR self notification:`, error);
    }
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification,
  notificationHelpers
};