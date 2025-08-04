const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    default: 'manager',
    immutable: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  team: {
    type: String,
    trim: true,
    default: null
  },
  department: {
    type: String,
    trim: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
managerSchema.index({ email: 1 });
managerSchema.index({ employeeId: 1 });
managerSchema.index({ isActive: 1 });
managerSchema.index({ team: 1 });
managerSchema.index({ department: 1 });

// Pre-save middleware to update the updatedAt field
managerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if manager is active
managerSchema.methods.isManagerActive = function() {
  return this.isActive;
};

// Method to update last login
managerSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Method to get manager info for display
managerSchema.methods.getManagerInfo = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    team: this.team,
    department: this.department,
    role: this.role,
    employeeId: this.employeeId
  };
};

// Static method to find manager by email
managerSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Static method to find manager by employee ID
managerSchema.statics.findByEmployeeId = function(employeeId) {
  return this.findOne({ employeeId: employeeId, isActive: true });
};

module.exports = mongoose.model('Manager', managerSchema);