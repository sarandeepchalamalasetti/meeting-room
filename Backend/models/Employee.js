const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
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
    default: 'employee',
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
employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ isActive: 1 });
employeeSchema.index({ team: 1 });
employeeSchema.index({ department: 1 });

// Pre-save middleware to update the updatedAt field
employeeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if employee is active
employeeSchema.methods.isEmployeeActive = function() {
  return this.isActive;
};

// Method to update last login
employeeSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Method to get employee profile
employeeSchema.methods.getProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    employeeId: this.employeeId,
    department: this.department,
    team: this.team,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

// Static method to find employee by email
employeeSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Static method to find employee by employee ID
employeeSchema.statics.findByEmployeeId = function(employeeId) {
  return this.findOne({ employeeId: employeeId, isActive: true });
};

module.exports = mongoose.model('Employee', employeeSchema);