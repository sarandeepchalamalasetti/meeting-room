const mongoose = require('mongoose');

// Helper function for time conversion
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

const bookingSchema = new mongoose.Schema({
  roomName: { 
    type: String, 
    required: true,
    trim: true
  },
  date: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: 'Date must be in YYYY-MM-DD format'
    }
  },
  startTime: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:MM format'
    }
  },
  endTime: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:MM format'
    }
  },
  purpose: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  attendees: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  bookedBy: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    employeeId: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['employee', 'manager', 'admin', 'hr'],
      default: 'employee'
    },
    department: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  // ✅ NEW: Approval workflow fields
  managerId: {
    type: String,
    trim: true,
    default: null
  },
  managerInfo: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    employeeId: {
      type: String,
      trim: true
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  urgency: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  equipment: [{
    type: String,
    trim: true
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: String,
    trim: true,
    default: null
  },
  approverId: {
    type: String,
    trim: true,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  estimatedCost: {
    type: String,
    trim: true
  },
  attachments: [{
    type: String,
    trim: true
  }],
  // ✅ Keep existing fields
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This will automatically manage createdAt and updatedAt
});

// Index for efficient queries (enhanced with approval workflow)
bookingSchema.index({ roomName: 1, date: 1, status: 1 });
bookingSchema.index({ 'bookedBy.email': 1, date: -1 });
bookingSchema.index({ date: 1, startTime: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ managerId: 1 }); // NEW: For approval queries
bookingSchema.index({ 'bookedBy.employeeId': 1 }); // NEW: For user queries
bookingSchema.index({ submittedAt: -1 }); // NEW: For chronological sorting

// Virtual for calculating duration in minutes
bookingSchema.virtual('duration').get(function() {
  const startMinutes = timeToMinutes(this.startTime);
  const endMinutes = timeToMinutes(this.endTime);
  return endMinutes - startMinutes;
});

// ✅ NEW: Virtual for booking duration in minutes (enhanced)
bookingSchema.virtual('durationMinutes').get(function() {
  if (!this.startTime || !this.endTime) return 0;
  
  const [startHour, startMin] = this.startTime.split(':').map(Number);
  const [endHour, endMin] = this.endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
});

// ✅ NEW: Virtual for formatted time range
bookingSchema.virtual('timeRange').get(function() {
  return `${this.startTime} - ${this.endTime}`;
});

// Method to check if booking is in the past
bookingSchema.methods.isPast = function() {
  const bookingDateTime = new Date(`${this.date}T${this.startTime}:00`);
  return bookingDateTime < new Date();
};

// Method to check if booking is currently active
bookingSchema.methods.isActive = function() {
  const now = new Date();
  const startDateTime = new Date(`${this.date}T${this.startTime}:00`);
  const endDateTime = new Date(`${this.date}T${this.endTime}:00`);
  
  return now >= startDateTime && now <= endDateTime;
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const bookingDateTime = new Date(`${this.date}T${this.startTime}:00`);
  const now = new Date();
  const timeDiff = bookingDateTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);
  
  // Can cancel if booking is more than 2 hours away
  return hoursDiff > 2 && this.status !== 'cancelled';
};

// ✅ NEW: Method to check if booking is editable
bookingSchema.methods.isEditable = function() {
  return this.status === 'pending';
};

// ✅ NEW: Method to get status display color
bookingSchema.methods.getStatusColor = function() {
  const colors = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    cancelled: '#6b7280'
  };
  return colors[this.status] || '#6b7280';
};

// Pre-save middleware to update the updatedAt field
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ✅ ENHANCED: Pre-save validation to ensure end time is after start time
bookingSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    const startMinutes = timeToMinutes(this.startTime);
    const endMinutes = timeToMinutes(this.endTime);
    
    if (endMinutes <= startMinutes) {
      return next(new Error('End time must be after start time'));
    }
    
    // Validate minimum and maximum duration
    const duration = endMinutes - startMinutes;
    if (duration < 15) {
      return next(new Error('Minimum booking duration is 15 minutes'));
    }
    if (duration > 480) {
      return next(new Error('Maximum booking duration is 8 hours'));
    }
  }
  
  // Auto-set description if not provided
  if (!this.description && this.purpose) {
    this.description = this.purpose;
  }
  
  next();
});

// ✅ ENHANCED: Static method to find conflicting bookings
bookingSchema.statics.findConflictingBookings = function(roomName, date, startTime, endTime, excludeId = null) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  const query = {
    roomName: roomName,
    date: date,
    status: { $in: ['approved', 'pending'] }
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query).then(bookings => {
    return bookings.filter(booking => {
      const bookingStartMinutes = timeToMinutes(booking.startTime);
      const bookingEndMinutes = timeToMinutes(booking.endTime);
      
      // Check if time ranges overlap
      return startMinutes < bookingEndMinutes && bookingStartMinutes < endMinutes;
    });
  });
};

// ✅ NEW: Static method to find conflicting bookings (enhanced for approval workflow)
bookingSchema.statics.findConflicting = function(roomName, date, startTime, endTime, excludeId = null) {
  const query = {
    roomName,
    date,
    status: { $in: ['pending', 'approved'] },
    $or: [
      {
        $and: [
          { startTime: { $lte: startTime } },
          { endTime: { $gt: startTime } }
        ]
      },
      {
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gte: endTime } }
        ]
      },
      {
        $and: [
          { startTime: { $gte: startTime } },
          { endTime: { $lte: endTime } }
        ]
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.findOne(query);
};

// Static method to get bookings for a specific date
bookingSchema.statics.getBookingsForDate = function(date, roomName = null) {
  const query = { 
    date: date,
    status: { $in: ['approved', 'pending'] }
  };
  
  if (roomName) {
    query.roomName = roomName;
  }
  
  return this.find(query).sort({ startTime: 1 });
};

// Static method to get user's upcoming bookings
bookingSchema.statics.getUpcomingBookings = function(userEmail, limit = 10) {
  const today = new Date().toISOString().split('T')[0];
  
  return this.find({
    'bookedBy.email': userEmail,
    date: { $gte: today },
    status: { $in: ['approved', 'pending'] }
  })
  .sort({ date: 1, startTime: 1 })
  .limit(limit);
};

module.exports = mongoose.model('Booking', bookingSchema);