const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  // ✅ EXISTING: Your original fields
  id: { type: String, required: true, unique: true },
  name: String,
  capacity: Number,
  floor: String,
  wing: String,
  equipment: [String],
  description: String,
  
  // ✅ NEW: Enhanced fields for better room management
  roomName: {
    type: String,
    index: true
  },
  location: {
    floor: {
      type: String,
      index: true
    },
    wing: {
      type: String
    },
    description: {
      type: String,
      default: ''
    }
  },
  amenities: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active',
    index: true
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  imageUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
roomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // ✅ COMPATIBILITY: Sync fields between old and new schema
  if (this.name && !this.roomName) {
    this.roomName = this.name;
  }
  if (this.roomName && !this.name) {
    this.name = this.roomName;
  }
  
  // Sync location data
  if (this.floor && !this.location.floor) {
    this.location.floor = this.floor;
  }
  if (this.wing && !this.location.wing) {
    this.location.wing = this.wing;
  }
  
  next();
});

// Create indexes for better query performance
roomSchema.index({ name: 1 });
roomSchema.index({ roomName: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ 'location.floor': 1 });
roomSchema.index({ capacity: 1 });
roomSchema.index({ id: 1 });

module.exports = mongoose.model('Room', roomSchema);