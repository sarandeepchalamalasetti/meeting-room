const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/verifyToken');
const bookingController = require('../controllers/bookingController');

// Test endpoint to check authentication (for debugging)
router.get('/test-auth', verifyToken, (req, res) => {
  res.json({
    message: 'Authentication successful',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// ✅ ENHANCED: Statistics endpoint with filter support for Status component
router.get('/statistics', verifyToken, bookingController.getBookingStatistics);

// ✅ Use controller functions correctly
// Get bookings for the current user
router.get('/my', verifyToken, bookingController.getMyBookings);

// NEW: Get manage bookings for the current user (for ManageBookings component)
router.get('/manage', verifyToken, bookingController.getMyManageBookings);

// ✅ ENHANCED: Get user booking statistics for charts with filter support
router.get('/my-stats', verifyToken, bookingController.getUserBookingStats);

// ✅ ENHANCED: Get upcoming bookings for current user with filter support
router.get('/upcoming', verifyToken, bookingController.getUpcomingBookings);

// Create a new booking (supports both old and new API formats)
router.post('/create', verifyToken, bookingController.createBooking);

// Get all bookings (with optional filters) - for admins/managers
router.get('/', verifyToken, bookingController.getAllBookings);

// ✅ NEW: Get approval requests for a specific manager (for Approval component)
router.get('/approvals/:managerId', verifyToken, bookingController.getApprovalRequests);

// ✅ NEW: Get bookings for a specific user (for user dashboard)
router.get('/user/:userId', verifyToken, bookingController.getUserBookings);

// Get bookings by date range
router.get('/date-range', verifyToken, bookingController.getBookingsByDateRange);

// Get room availability for a specific date
router.get('/availability', verifyToken, bookingController.getRoomAvailability);

// Get a specific booking by ID
router.get('/:id', verifyToken, bookingController.getBookingById);

// Update a booking (for edit functionality)
router.put('/:id', verifyToken, bookingController.updateBooking);

// ✅ NEW: Approve a booking (for Approval component)
router.put('/approve/:id', verifyToken, bookingController.approveBooking);

// ✅ NEW: Reject a booking (for Approval component)
router.put('/reject/:id', verifyToken, bookingController.rejectBooking);

// NEW: Cancel a booking (replaces delete for users)
router.patch('/:id/cancel', verifyToken, bookingController.cancelBooking);

// Update booking status (approve/reject) - for managers/admins (existing functionality)
router.patch('/:id/status', verifyToken, bookingController.updateBookingStatus);

// Delete a booking (keep for admin use)
router.delete('/:id', verifyToken, bookingController.deleteBooking);

module.exports = router;