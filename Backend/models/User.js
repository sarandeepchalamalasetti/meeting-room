const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    enum: ['employee', 'manager', 'admin', 'hr'], // ✅ EXISTING: Your enum values
    default: 'employee'
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  // ✅ NEW: Added team field for manager organization
  team: {
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

// ✅ EXISTING: Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1 });

// ✅ NEW: Additional indexes for manager functionality
userSchema.index({ team: 1 });
userSchema.index({ department: 1 });
userSchema.index({ role: 1, isActive: 1 }); // Compound index for active managers
userSchema.index({ role: 1, team: 1 }); // Compound index for team-based queries
userSchema.index({ role: 1, department: 1 }); // Compound index for department-based queries

// ✅ EXISTING: Pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ✅ EXISTING: Method to check if user is active
userSchema.methods.isUserActive = function() {
  return this.isActive;
};

// ✅ EXISTING: Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// ✅ NEW: Method to get manager info for display (BookRoom functionality)
userSchema.methods.getManagerInfo = function() {
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

// ✅ NEW: Method to check if user is a manager
userSchema.methods.isManager = function() {
  return this.role === 'manager' && this.isActive;
};

// ✅ NEW: Method to get user's full profile
userSchema.methods.getProfile = function() {
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

// ✅ EXISTING: Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// ✅ EXISTING: Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role: role, isActive: true });
};

// ✅ NEW: Static method to find managers (enhanced version of findByRole)
userSchema.statics.findManagers = function(query = {}) {
  return this.find({ 
    role: 'manager', 
    isActive: true,
    ...query 
  }).select('name email team department role employeeId createdAt').sort({ name: 1 });
};

// ✅ NEW: Static method to search managers with advanced filtering
userSchema.statics.searchManagers = function(searchOptions = {}) {
  const { search, team, department, limit = 50 } = searchOptions;
  
  let query = { 
    role: 'manager',
    isActive: true
  };
  
  // Add search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { team: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Add filters
  if (team && team !== 'all') query.team = team;
  if (department && department !== 'all') query.department = department;
  
  return this.find(query)
    .select('name email team department role employeeId createdAt')
    .sort({ name: 1 })
    .limit(parseInt(limit));
};

// ✅ NEW: Static method to get unique teams
userSchema.statics.getTeams = function() {
  return this.distinct('team', { 
    role: 'manager',
    isActive: true,
    team: { $ne: null, $ne: '' }
  });
};

// ✅ NEW: Static method to get unique departments
userSchema.statics.getDepartments = function() {
  return this.distinct('department', { 
    role: 'manager',
    isActive: true,
    department: { $ne: null, $ne: '' }
  });
};

// ✅ NEW: Static method to find manager by employee ID
userSchema.statics.findManagerByEmployeeId = function(employeeId) {
  return this.findOne({ 
    employeeId: employeeId,
    role: 'manager',
    isActive: true
  }).select('name email team department role employeeId');
};

// ✅ NEW: Static method to get managers by team
userSchema.statics.getManagersByTeam = function(teamName) {
  return this.find({
    role: 'manager',
    isActive: true,
    team: teamName
  }).select('name email team department role employeeId').sort({ name: 1 });
};

// ✅ NEW: Static method to get managers by department
userSchema.statics.getManagersByDepartment = function(departmentName) {
  return this.find({
    role: 'manager',
    isActive: true,
    department: departmentName
  }).select('name email team department role employeeId').sort({ name: 1 });
};

// ✅ NEW: Virtual field to get display name for manager selection
userSchema.virtual('displayName').get(function() {
  if (this.team) {
    return `${this.name} (${this.team})`;
  }
  return this.name;
});

// ✅ NEW: Virtual field to get manager contact info
userSchema.virtual('contactInfo').get(function() {
  const info = [this.email];
  if (this.team) info.push(this.team);
  if (this.department && this.department !== this.team) info.push(this.department);
  return info.join(' • ');
});

// ✅ Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);