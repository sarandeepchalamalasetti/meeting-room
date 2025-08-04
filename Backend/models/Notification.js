const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true // User ID or email of the recipient
  },
  recipientRole: {
    type: String,
    required: true,
    enum: ['manager', 'employee', 'hr', 'admin']
  },
  sender: {
    type: String,
    required: true // User ID or email of the sender
  },
  senderName: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    required: true,
    enum: ['manager', 'employee', 'hr', 'admin']
  },
  type: {
    type: String,
    required: true,
    enum: [
      'booking_request',      // Employee -> Manager
      'booking_approved',     // Manager -> Employee
      'booking_rejected',     // Manager -> Employee
      'booking_cancelled',    // Employee -> All relevant parties
      'booking_created',      // Any -> HR
      'booking_pending',      // Manager -> Employee (status update)
      'room_available',       // System -> Users
      'booking_reminder'      // System -> Users
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false
  },
  roomName: {
    type: String,
    required: false
  },
  bookingDate: {
    type: String,
    required: false
  },
  bookingTime: {
    type: String,
    required: false
  },
  read: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: {
    type: String,
    required: false // URL to navigate when notification is clicked
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, read: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);