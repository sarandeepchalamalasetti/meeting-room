const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
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
    default: 'admin',
    immutable: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  department: {
    type: String,
    trim: true,
    default: 'Administration'
  },
  permissions: {
    type: [String],
    default: ['all']
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
adminSchema.index({ email: 1 });
adminSchema.index({ employeeId: 1 });
adminSchema.index({ isActive: 1 });

// Pre-save middleware to update the updatedAt field
adminSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if admin is active
adminSchema.methods.isAdminActive = function() {
  return this.isActive;
};

// Method to update last login
adminSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Method to get admin info for display
adminSchema.methods.getAdminInfo = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    department: this.department,
    role: this.role,
    employeeId: this.employeeId,
    permissions: this.permissions
  };
};

// Static method to find admin by email
adminSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Static method to find admin by employee ID
adminSchema.statics.findByEmployeeId = function(employeeId) {
  return this.findOne({ employeeId: employeeId, isActive: true });
};

module.exports = mongoose.model('Admin', adminSchema);