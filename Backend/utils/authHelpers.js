const Manager = require('../models/Manager');
const Employee = require('../models/Employee');
const HR = require('../models/HR');
const Admin = require('../models/Admin');

// Helper function to get the appropriate model based on role
const getModelByRole = (role) => {
  switch (role) {
    case 'manager':
      return Manager;
    case 'hr':
      return HR;
    case 'admin':
      return Admin;
    case 'employee':
    default:
      return Employee;
  }
};

// Helper function to find user across all collections
const findUserByIdentifier = async (identifier) => {
  const collections = [
    { model: Manager, role: 'manager' },
    { model: HR, role: 'hr' },
    { model: Admin, role: 'admin' },
    { model: Employee, role: 'employee' }
  ];

  for (const { model, role } of collections) {
    try {
      const user = await model.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { employeeId: identifier }
        ],
        isActive: true
      });

      if (user) {
        return { user, role };
      }
    } catch (error) {
      console.error(`Error searching in ${role} collection:`, error);
    }
  }

  return null;
};

// Generate JWT token with complete user information
const generateToken = (user, jwt, secret) => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    name: user.name || user.fullName || user.username,
    role: user.role || 'employee',
    employeeId: user.employeeId || user._id || user.id
  };
  
  console.log('🔐 Generating token with payload:', JSON.stringify(payload, null, 2));
  
  return jwt.sign(
    payload,
    secret || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

module.exports = {
  getModelByRole,
  findUserByIdentifier,
  generateToken
};