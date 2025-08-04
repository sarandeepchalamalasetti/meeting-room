const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true
  },
  attendees: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'upcoming', 'rejected', 'cancelled', 'approved'],
    required: true,
    default: 'pending'
  },
  organizer: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
historySchema.index({ userId: 1, createdAt: -1 });
historySchema.index({ bookingId: 1 });

module.exports = mongoose.model('History', historySchema);