const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

const { 
  // ✅ EXISTING: Your original controller functions
  registerUser, 
  loginUser, 
  sendOTP, 
  VerifyOTP, 
  resetPassword,
  // ✅ NEW: Manager-related controller functions (using JSON data)
  getUserProfile,
  getManagers,
  searchManagers,
  getTeams,
  getDepartments,
  getManagerById
} = require('../controllers/authController');

// ✅ EXISTING: Your original routes - preserved exactly as they were
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', VerifyOTP);
router.post('/reset-password', resetPassword);

// ✅ NEW: User profile routes (requires authentication)
router.get('/profile', verifyToken, getUserProfile);

// ✅ NEW: Manager-related routes - now using JSON data instead of database
// These routes are specifically for the BookRoom functionality
router.get('/managers', verifyToken, getManagers);
router.get('/managers/search', verifyToken, searchManagers);
router.get('/managers/:managerId', verifyToken, getManagerById);

// ✅ NEW: Team and department routes for filtering managers
router.get('/teams', verifyToken, getTeams);
router.get('/departments', verifyToken, getDepartments);

module.exports = router;