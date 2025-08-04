const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getModelByRole, findUserByIdentifier, generateToken } = require('../utils/authHelpers');
const {
  validateRoleAuthorization,
  getAllManagers,
  getAllHR,
  searchManagers
} = require('../utils/jsonDataLoader');

const otpStore = {};

// OTP sending logic
const sendOTP = async(req,res)=>{
  const {email} = req.body;
  
  const userResult = await findUserByIdentifier(email);
  if (!userResult) {
    return res.status(400).json({message:"Email not registered. Please register first"});
  }
  
  const otp = Math.floor(100000+Math.random()*900000).toString();
  const expiresAt = Date.now()+5*60*1000;
  otpStore[email]={otp,expiresAt};
  console.log(`Generated OTP for ${email}:${otp}`);
  
  return res.status(200).json({
    message: "OTP generated successfully (mocked for Thunder)",
    otp 
  });
}

// VerifyOTP
const VerifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) {
    return res.status(400).json({ message: "No OTP request found for this email" });
  }

  if (Date.now() > record.expiresAt) {
    return res.status(400).json({ message: "OTP has expired" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ message: "OTP is incorrect" });
  }

  return res.status(200).json({ message: "OTP Verified Successfully" });
};

// ResetPassword
const resetPassword = async(req,res)=>{
  const{email,newPassword,confirmPassword}=req.body;
  
  if(newPassword !== confirmPassword){
    return res.status(400).json({message:"Password did not match"});
  }
  
  const userResult = await findUserByIdentifier(email);
  if (!userResult) {
    return res.status(400).json({message:"User not found"});
  }
  
  const { user } = userResult;
  const hashedPassword = await bcrypt.hash(newPassword,10);
  user.password = hashedPassword;
  await user.save();
  delete otpStore[email];
  
  return res.status(200).json({message:"Password reset successful"});
}

// Register User with JSON validation
const registerUser = async (req, res) => {
  try {
    const { name, email, employeeId, role, password, confirmPassword, department, team } = req.body;

    console.log('📝 Registration attempt:', { name, email, employeeId, role, department, team });

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check for existing users across all collections
    const existingUser = await findUserByIdentifier(email);
    const existingEmployeeId = await findUserByIdentifier(employeeId);

    if (existingUser || existingEmployeeId) {
      let message = '';
      if (existingUser) message += 'Email';
      if (existingUser && existingEmployeeId) message += ' and ';
      if (existingEmployeeId) message += 'Employee ID';
      message += ' already exist';

      return res.status(400).json({ message });
    }

    let finalRole = role;
    let userData = { name, email, employeeId, department, team };

    // Role validation using JSON data
    if (role === 'manager' || role === 'hr') {
      const validation = validateRoleAuthorization(role, email, employeeId);
      
      if (!validation.authorized) {
        finalRole = 'employee';
        return res.status(400).json({
          message: `You're not authorized to register as ${role}. Please register as employee.`,
          forceEmployee: true
        });
      } else {
        userData = {
          ...userData,
          team: validation.userData.team || team,
          department: validation.userData.department || department
        };
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const UserModel = getModelByRole(finalRole);

    const user = new UserModel({
      name: userData.name,
      email: userData.email,
      employeeId: userData.employeeId,
      password: hashedPassword,
      department: userData.department,
      team: userData.team
    });

    const savedUser = await user.save();
    console.log(`✅ ${finalRole} registered successfully:`, savedUser.email);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        employeeId: savedUser.employeeId,
        role: finalRole,
        department: savedUser.department,
        team: savedUser.team
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login User - Works with multiple collections
const loginUser = async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.email;
    const password = req.body.password;
    
    console.log("🔑 Login Request Body:", req.body);
    console.log("🔑 Login attempt for:", identifier);

    if (!identifier || !password) {
      return res.status(400).json({ 
        message: 'Email/identifier and password are required',
        debug: {
          hasIdentifier: !!identifier,
          hasEmail: !!req.body.email,
          hasPassword: !!password,
          bodyKeys: Object.keys(req.body)
        }
      });
    }

    const userResult = await findUserByIdentifier(identifier);

    console.log("👤 User found:", userResult ? { 
      id: userResult.user._id, 
      email: userResult.user.email, 
      name: userResult.user.name,
      role: userResult.role 
    } : 'No user found');

    if (!userResult) {
      return res.status(400).json({ 
        message: 'User not found. Please check your email/employee ID.',
        debug: `Searched for: ${identifier}`
      });
    }

    const { user, role } = userResult;

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔐 Password Match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    await user.updateLastLogin();

    const token = generateToken({ ...user.toObject(), role }, jwt, process.env.JWT_SECRET);

    console.log('✅ Login successful for:', user.email);
    
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        employeeId: user.employeeId,
        department: user.department,
        team: user.team
      }
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    return res.status(500).json({ 
      message: "Login failed", 
      error: error.message,
      debug: 'Internal server error during login'
    });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;

    if (!userRole) {
      return res.status(400).json({ message: 'User role not found in token' });
    }

    const UserModel = getModelByRole(userRole);
    const user = await UserModel.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      ...user.toObject(),
      role: userRole
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Manager-related functions using JSON data
const getManagers = async (req, res) => {
  try {
    const managers = getAllManagers();
    console.log(`📋 Retrieved ${managers.length} managers from JSON data`);
    res.json(managers);
  } catch (error) {
    console.error('Managers fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching managers' });
  }
};

const searchManagersAPI = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    
    let managers = getAllManagers();
    
    if (search && search.trim()) {
      managers = searchManagers(search.trim());
    }
    
    managers = managers.slice(0, parseInt(limit));
    
    console.log(`🔍 Manager search: "${search}", Found: ${managers.length} managers`);
    res.json(managers);
  } catch (error) {
    console.error('Manager search error:', error);
    res.status(500).json({ message: 'Server error while searching managers' });
  }
};

const getTeams = async (req, res) => {
  try {
    const managers = getAllManagers();
    const teams = [...new Set(managers
      .map(manager => manager.team)
      .filter(team => team && team.trim())
    )];
    
    res.json(teams);
  } catch (error) {
    console.error('Teams fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching teams' });
  }
};

const getDepartments = async (req, res) => {
  try {
    const managers = getAllManagers();
    const hrPersonnel = getAllHR();
    
    const departments = [...new Set([
      ...managers.map(manager => manager.department),
      ...hrPersonnel.map(hr => hr.department)
    ].filter(dept => dept && dept.trim()))];
    
    res.json(departments);
  } catch (error) {
    console.error('Departments fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching departments' });
  }
};

const getManagerById = async (req, res) => {
  try {
    const { managerId } = req.params;
    const managers = getAllManagers();
    
    const manager = managers.find(mgr => 
      mgr._id === managerId || mgr.employeeId === managerId
    );
    
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }
    
    res.json(manager);
  } catch (error) {
    console.error('Manager fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching manager' });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  sendOTP, 
  VerifyOTP, 
  resetPassword,
  getUserProfile,
  getManagers,
  searchManagers: searchManagersAPI,
  getTeams,
  getDepartments,
  getManagerById
};