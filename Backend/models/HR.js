const mongoose = require('mongoose');

const hrSchema = new mongoose.Schema({
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
    default: 'hr',
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
    default: 'Human Resources'
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
hrSchema.index({ email: 1 });
hrSchema.index({ employeeId: 1 });
hrSchema.index({ isActive: 1 });
hrSchema.index({ department: 1 });

// Pre-save middleware to update the updatedAt field
hrSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if HR is active
hrSchema.methods.isHRActive = function() {
  return this.isActive;
};

// Method to update last login
hrSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Method to get HR info for display
hrSchema.methods.getHRInfo = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    department: this.department,
    role: this.role,
    employeeId: this.employeeId
  };
};

// Static method to find HR by email
hrSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Static method to find HR by employee ID
hrSchema.statics.findByEmployeeId = function(employeeId) {
  return this.findOne({ employeeId: employeeId, isActive: true });
};

module.exports = mongoose.model('HR', hrSchema);