const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { addBookingToHistory } = require('./historyController');

// Import notification helpers (will be created)
let notificationHelpers = null;
try {
  const notificationController = require('./notificationController');
  notificationHelpers = notificationController.notificationHelpers;
  console.log('✅ Notification system loaded successfully');
} catch (error) {
  console.log('❌ Notification controller not found, running without notifications:', error.message);
}

// ✅ HELPER FUNCTIONS - Extracted for better maintainability
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const isTimeOverlapping = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

// ✅ NEW: Helper function to build date filter for queries
const buildDateFilter = (startDate, endDate, filterType) => {
  if (!startDate || !endDate) return {};
  
  if (filterType === 'custom_date' || filterType === 'today') {
    return { date: startDate };
  } else {
    return {
      date: {
        $gte: startDate,
        $lt: endDate
      }
    };
  }
};

// ✅ NEW: Helper function to calculate time-based status for bookings
const calculateTimeStatus = (booking, currentDate, currentTimeMinutes) => {
  const bookingDate = new Date(`${booking.date}T${booking.startTime}:00`);
  const now = new Date();
  const originalStatus = booking.status;
  
  let enhancedStatus = originalStatus;
  let timeUntil = '';
  let statusType = 'future';
  
  if (booking.date < currentDate || 
      (booking.date === currentDate && timeToMinutes(booking.endTime) < currentTimeMinutes)) {
    if (originalStatus === 'approved') {
      enhancedStatus = 'completed';
      statusType = 'past';
    }
  } else if (booking.date === currentDate && 
             timeToMinutes(booking.startTime) <= currentTimeMinutes && 
             timeToMinutes(booking.endTime) > currentTimeMinutes) {
    if (originalStatus === 'approved') {
      enhancedStatus = 'in progress';
      statusType = 'current';
      const endMinutes = timeToMinutes(booking.endTime);
      const remainingMinutes = endMinutes - currentTimeMinutes;
      timeUntil = `${remainingMinutes}m left`;
    }
  } else {
    const timeDiff = bookingDate.getTime() - now.getTime();
    const minutesUntil = Math.floor(timeDiff / (1000 * 60));
    const hoursUntil = Math.floor(minutesUntil / 60);
    
    if (originalStatus === 'approved') {
      enhancedStatus = 'upcoming';
    }
    statusType = 'future';
    
    if (minutesUntil < 60) {
      timeUntil = `${minutesUntil}m`;
    } else if (hoursUntil < 24) {
      timeUntil = `${hoursUntil}h`;
    } else {
      const daysUntil = Math.floor(hoursUntil / 24);
      timeUntil = `${daysUntil}d`;
    }
  }
  
  return { enhancedStatus, statusType, timeUntil };
};

// Check for booking conflicts
const checkBookingConflict = async (roomName, date, startTime, endTime, excludeBookingId = null) => {
  try {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    const query = {
      roomName: roomName,
      date: date,
      status: { $in: ['approved', 'pending'] }
    };
    
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }
    
    const existingBookings = await Booking.find(query);
    
    for (let booking of existingBookings) {
      const bookingStartMinutes = timeToMinutes(booking.startTime);
      const bookingEndMinutes = timeToMinutes(booking.endTime);
      
      if (isTimeOverlapping(startMinutes, endMinutes, bookingStartMinutes, bookingEndMinutes)) {
        return {
          hasConflict: true,
          conflictingBooking: booking
        };
      }
    }
    
    return { hasConflict: false };
  } catch (error) {
    console.error('Error checking booking conflict:', error);
    throw error;
  }
};

// ✅ ENHANCED: Get statistics based on user role with filter support
const getBookingStatistics = async (req, res) => {
  try {
    const userEmail = req.user?.email || req.user?.userEmail;
    const userRole = req.user?.role || 'employee';
    const userId = req.user?.id || req.user?._id || req.user?.employeeId;
    
    // ✅ NEW: Extract filter parameters
    const { startDate, endDate, filterType } = req.query;
    
    console.log('📊 Fetching booking statistics for user:', { 
      userEmail, 
      userRole, 
      userId,
      startDate,
      endDate,
      filterType
    });
    
    if (!userEmail) {
      return res.status(400).json({ 
        message: 'User email not found. Please log in again.' 
      });
    }

    let statistics = {};

    // Get total available rooms (common for all roles)
    const totalRooms = await Room.countDocuments() || 25; // Default fallback

    // ✅ NEW: Build date filter for queries
    const dateFilter = buildDateFilter(startDate, endDate, filterType);
    console.log('📊 Using date filter:', dateFilter);

    if (userRole === 'manager') {
      // Manager statistics with filter support
      console.log('📊 Fetching manager statistics with filter...');
      
      const totalBookings = await Booking.countDocuments({
        'bookedBy.email': userEmail,
        ...dateFilter
      });

      const pendingApprovals = await Booking.countDocuments({
        'managerInfo.email': userEmail,
        status: 'pending',
        ...dateFilter
      });

      const approvedByManager = await Booking.countDocuments({
        'managerInfo.email': userEmail,
        status: 'approved',
        ...dateFilter
      });

      const rejectedByManager = await Booking.countDocuments({
        'managerInfo.email': userEmail,
        status: 'rejected',
        ...dateFilter
      });

      statistics = {
        total: totalBookings,
        available: totalRooms,
        approved: approvedByManager,
        pending: pendingApprovals,
        rejected: rejectedByManager
      };

      console.log('📊 Manager statistics with filter:', statistics);

    } else if (userRole === 'hr') {
      // HR statistics with filter support
      console.log('📊 Fetching HR statistics with filter...');
      
      const totalBookings = await Booking.countDocuments({
        'bookedBy.email': userEmail,
        ...dateFilter
      });

      const cancelledBookings = await Booking.countDocuments({
        'bookedBy.email': userEmail,
        status: 'cancelled',
        ...dateFilter
      });

      statistics = {
        total: totalBookings,
        available: totalRooms,
        cancelled: cancelledBookings
      };

      console.log('📊 HR statistics with filter:', statistics);

    } else {
      // Employee statistics with filter support
      console.log('📊 Fetching employee statistics with filter...');
      
      const totalBookings = await Booking.countDocuments({
        'bookedBy.email': userEmail,
        ...dateFilter
      });

      const approvedBookings = await Booking.countDocuments({
        'bookedBy.email': userEmail,
        status: 'approved',
        ...dateFilter
      });

      const pendingBookings = await Booking.countDocuments({
        'bookedBy.email': userEmail,
        status: 'pending',
        ...dateFilter
      });

      const rejectedBookings = await Booking.countDocuments({
        'bookedBy.email': userEmail,
        status: 'rejected',
        ...dateFilter
      });

      statistics = {
        total: totalBookings,
        available: totalRooms,
        approved: approvedBookings,
        pending: pendingBookings,
        rejected: rejectedBookings
      };

      console.log('📊 Employee statistics with filter:', statistics);
    }

    res.status(200).json({
      success: true,
      data: statistics,
      userRole: userRole,
      filter: { startDate, endDate, filterType },
      message: `Statistics fetched successfully for ${userRole} with filter support`
    });

  } catch (error) {
    console.error('❌ Error fetching booking statistics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch booking statistics',
      error: error.message 
    });
  }
};

// ✅ ENHANCED: Get upcoming bookings with filter support
const getUpcomingBookings = async (req, res) => {
  try {
    const userEmail = req.user?.email || req.user?.userEmail;
    const userRole = req.user?.role || 'employee';
    
    // ✅ NEW: Extract filter parameters
    const { startDate, endDate, filterType } = req.query;
    
    console.log('📅 Fetching upcoming bookings for user:', { 
      userEmail, 
      userRole,
      startDate,
      endDate,
      filterType
    });
    
    if (!userEmail) {
      return res.status(400).json({ 
        message: 'User email not found. Please log in again.' 
      });
    }
    
    // Get current date and time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    
    console.log('🕐 Current date and time:', { currentDate, currentTimeMinutes });
    
    // ✅ NEW: Build date filter for query
    let dateFilter = buildDateFilter(startDate, endDate, filterType);
    if (!dateFilter.date) {
      // Default to future bookings if no filter
      dateFilter = { date: { $gte: currentDate } };
    }
    console.log('📅 Using date filter:', dateFilter);

    // Build query for user's bookings
    const query = {
      'bookedBy.email': userEmail,
      ...dateFilter
    };
    
    // Include different database statuses based on user role
    if (userRole === 'employee') {
      // Employees can see rejected, pending, approved, cancelled bookings
      query.status = { $in: ['pending', 'approved', 'rejected', 'cancelled'] };
    } else {
      // Managers, HR, Admin can see all statuses for their own bookings
      query.status = { $in: ['pending', 'approved', 'rejected', 'cancelled'] };
    }
    
    console.log('🔍 Query:', JSON.stringify(query, null, 2));
    
    // Get bookings from database
    let bookings = await Booking.find(query)
      .sort({ date: 1, startTime: 1 })
      .limit(50);
    
    console.log('📋 Found bookings:', bookings.length);
    
    // ✅ Calculate enhanced status for each booking
    const enhancedBookings = bookings.map(booking => {
      const timeStatus = calculateTimeStatus(booking, currentDate, currentTimeMinutes);
      
      return {
        ...booking.toObject(),
        enhancedStatus: timeStatus.enhancedStatus,
        originalStatus: booking.status,
        statusType: timeStatus.statusType,
        timeUntil: timeStatus.timeUntil,
        isToday: booking.date === currentDate
      };
    });
    
    // ✅ Filter based on user role and status preferences
    let filteredBookings = enhancedBookings;
    
    if (userRole === 'employee') {
      // Employees see: rejected, pending, approved (as upcoming/in progress/completed), cancelled
      filteredBookings = enhancedBookings.filter(booking => 
        ['rejected', 'pending', 'upcoming', 'in progress', 'completed', 'cancelled'].includes(booking.enhancedStatus)
      );
    } else {
      // All other roles see: upcoming, in progress, completed, cancelled (no rejected/pending)
      filteredBookings = enhancedBookings.filter(booking => 
        ['upcoming', 'in progress', 'completed', 'cancelled'].includes(booking.enhancedStatus)
      );
    }
    
    // ✅ Sort by priority: in progress first, then upcoming, then completed
    filteredBookings.sort((a, b) => {
      const statusPriority = {
        'in progress': 1, 'upcoming': 2, 'pending': 3, 'approved': 4,
        'completed': 5, 'cancelled': 6, 'rejected': 7
      };
      
      const aPriority = statusPriority[a.enhancedStatus] || 99;
      const bPriority = statusPriority[b.enhancedStatus] || 99;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Within same priority, sort by date/time
      const aDate = new Date(`${a.date}T${a.startTime}:00`);
      const bDate = new Date(`${b.date}T${b.startTime}:00`);
      
      return aDate - bDate;
    });
    
    // Transform data for frontend
    const transformedBookings = filteredBookings.slice(0, 20).map(booking => ({
      id: booking._id.toString(),
      roomName: booking.roomName,
      purpose: booking.purpose,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      attendees: booking.attendees,
      status: booking.enhancedStatus, // Use enhanced status
      originalStatus: booking.originalStatus,
      statusType: booking.statusType,
      timeUntil: booking.timeUntil,
      isToday: booking.isToday,
      bookedBy: booking.bookedBy,
      priority: booking.priority || 'medium',
      urgency: booking.urgency || 'normal',
      description: booking.description || booking.purpose,
      equipment: booking.equipment || [],
      rejectionReason: booking.rejectionReason || null,
      submittedAt: booking.submittedAt,
      approvedAt: booking.approvedAt,
      approvedBy: booking.approvedBy
    }));
    
    console.log('✅ Enhanced bookings with filter support:', transformedBookings.length);
    
    res.status(200).json({
      success: true,
      data: transformedBookings,
      totalCount: transformedBookings.length,
      userRole: userRole,
      currentTime: now.toISOString(),
      filter: { startDate, endDate, filterType },
      statusBreakdown: {
        inProgress: transformedBookings.filter(b => b.status === 'in progress').length,
        upcoming: transformedBookings.filter(b => b.status === 'upcoming').length,
        completed: transformedBookings.filter(b => b.status === 'completed').length,
        pending: transformedBookings.filter(b => b.status === 'pending').length,
        rejected: transformedBookings.filter(b => b.status === 'rejected').length,
        cancelled: transformedBookings.filter(b => b.status === 'cancelled').length
      },
      message: `Enhanced status system with filter support: ${transformedBookings.length} bookings`
    });
    
  } catch (error) {
    console.error('❌ Error fetching upcoming bookings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch upcoming bookings',
      error: error.message 
    });
  }
};

// ✅ Handler to get bookings for logged-in user
const getMyBookings = async (req, res) => {
  try {
    // Try different ways to get user email
    const userEmail = req.user?.email || req.user?.userEmail || req.body?.userEmail;
    
    if (!userEmail) {
      return res.status(400).json({ message: 'User email not found. Please log in again.' });
    }
    
    const bookings = await Booking.find({ 'bookedBy.email': userEmail })
      .sort({ date: -1, startTime: -1 });
    res.status(200).json(bookings);
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
};

// ✅ ENHANCED: Get user's manage bookings (for ManageBookings component) with debugging
const getMyManageBookings = async (req, res) => {
  try {
    console.log('🔍 DEBUG: Full req.user object:', JSON.stringify(req.user, null, 2));
    console.log('🔍 DEBUG: req.user.email:', req.user?.email);
    console.log('🔍 DEBUG: req.user.userEmail:', req.user?.userEmail);
    
    const userEmail = req.user?.email || req.user?.userEmail;
    
    console.log('🔍 Fetching manage bookings for user:', userEmail);
    
    if (!userEmail) {
      console.log('❌ No user email found in request');
      return res.status(400).json({ 
        message: 'User email not found. Please log in again.',
        debug: {
          hasUser: !!req.user,
          userKeys: req.user ? Object.keys(req.user) : [],
          userObject: req.user
        }
      });
    }
    
    // Get all bookings for the user (including all statuses)
    const bookings = await Booking.find({ 'bookedBy.email': userEmail })
      .sort({ date: 1, startTime: 1 }); // Sort by date and time ascending
    
    console.log('📋 Found bookings:', bookings.length);
    
    // Transform data to match ManageBookings component format
    const transformedBookings = bookings.map(booking => ({
      id: booking._id.toString(),
      title: booking.purpose || 'Meeting',
      date: formatDateForDisplay(booking.date),
      startTime: booking.startTime,
      endTime: booking.endTime,
      room: booking.roomName,
      attendees: booking.attendees,
      status: booking.status,
      description: booking.purpose,
      organizer: booking.bookedBy.name,
      equipment: booking.equipment || [], // Add if you have equipment field
      rejectionReason: booking.rejectionReason || null
    }));
    
    console.log('✅ Sending transformed bookings:', transformedBookings.length);
    res.status(200).json(transformedBookings);
  } catch (error) {
    console.error('❌ Error fetching manage bookings:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bookings.',
      error: error.message 
    });
  }
};

// ✅ ENHANCED: Get user booking statistics for charts with filter support
const getUserBookingStats = async (req, res) => {
  try {
    const userEmail = req.user?.email || req.user?.userEmail;
    
    // ✅ NEW: Extract filter parameters
    const { startDate, endDate, filterType } = req.query;
    
    if (!userEmail) {
      return res.status(400).json({ 
        message: 'User email not found. Please log in again.' 
      });
    }
    
    console.log('📊 Fetching chart statistics for user:', { 
      userEmail, 
      startDate, 
      endDate, 
      filterType 
    });
    
    // ✅ NEW: Build date filter for query
    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      dateFilter = {
        createdAt: {
          $gte: start,
          $lte: end
        }
      };
    } else {
      // Default to last 30 days if no filter
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      
      dateFilter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }
    
    // Get all user bookings in the specified date range
    const userBookings = await Booking.find({
      'bookedBy.email': userEmail,
      ...dateFilter
    }).sort({ createdAt: -1 });
    
    console.log('📊 Found bookings for chart:', userBookings.length);
    
    // Calculate overall statistics
    const overallStats = {
      approved: userBookings.filter(booking => booking.status === 'approved').length,
      pending: userBookings.filter(booking => booking.status === 'pending').length,
      rejected: userBookings.filter(booking => booking.status === 'rejected').length
    };
    
    // Calculate weekly statistics (last 7 days)
    const weeklyStats = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayBookings = userBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= targetDate && bookingDate < nextDay;
      });
      
      weeklyStats.push({
        day: dayNames[targetDate.getDay()],
        approved: dayBookings.filter(booking => booking.status === 'approved').length,
        pending: dayBookings.filter(booking => booking.status === 'pending').length,
        rejected: dayBookings.filter(booking => booking.status === 'rejected').length,
        date: targetDate.toISOString().split('T')[0]
      });
    }
    
    const response = {
      overall: overallStats,
      weekly: weeklyStats,
      totalBookings: userBookings.length,
      filter: { startDate, endDate, filterType },
      dateRange: {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: endDate || new Date().toISOString().split('T')[0]
      }
    };
    
    console.log('📊 User booking statistics with filter:', response);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error fetching user booking statistics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch booking statistics',
      error: error.message 
    });
  }
};

// Helper function to format date for display
const formatDateForDisplay = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/,/g, '');
  } catch (error) {
    return dateStr;
  }
};

// ✅ NEW: Get approval requests for a specific manager (for Approval component)
const getApprovalRequests = async (req, res) => {
  try {
    const { managerId } = req.params;
    
    if (!managerId) {
      return res.status(400).json({ message: 'Manager ID is required' });
    }

    console.log('📋 Fetching approval requests for manager:', managerId);

    // Find all bookings assigned to this manager for approval
    const approvalRequests = await Booking.find({
      managerId: managerId,
      status: { $in: ['pending', 'approved', 'rejected'] } // Include all statuses for manager view
    }).sort({ submittedAt: -1, createdAt: -1 });

    console.log(`📋 Found ${approvalRequests.length} approval requests for manager ${managerId}`);
    
    res.status(200).json(approvalRequests);
  } catch (error) {
    console.error('❌ Error fetching approval requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch approval requests',
      error: error.message 
    });
  }
};

// ✅ NEW: Approve a booking (for Approval component)
const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, approverId, notes } = req.body;

    console.log('✅ Approving booking:', { id, approvedBy, approverId, notes });

    if (!approvedBy) {
      return res.status(400).json({ message: 'Approver information is required' });
    }

    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot approve booking with status: ${booking.status}` 
      });
    }

    // Check for conflicts again before approving
    const conflict = await checkBookingConflict(
      booking.roomName,
      booking.date,
      booking.startTime,
      booking.endTime,
      id
    );

    if (conflict.hasConflict) {
      return res.status(409).json({ 
        message: 'Cannot approve - time slot conflicts with another approved booking',
        conflictingBooking: conflict.conflictingBooking
      });
    }

    // Update booking status
    booking.status = 'approved';
    booking.approvedBy = approvedBy;
    booking.approverId = approverId;
    booking.approvedAt = new Date();
    booking.notes = notes || 'Approved by manager';

    const updatedBooking = await booking.save();
    
    console.log('✅ Booking approved:', {
      id: updatedBooking._id,
      room: updatedBooking.roomName,
      approvedBy: updatedBooking.approvedBy
    });

    // ✅ NOTIFICATION: Create approval notification
    if (notificationHelpers) {
      try {
        console.log('🔔 Creating approval notification...');
        
        const manager = {
          name: approvedBy,
          email: req.user?.email || req.user?.userEmail,
          employeeId: approverId || req.user?.employeeId || req.user?.id,
          role: req.user?.role || 'manager'
        };

        const employee = {
          name: booking.bookedBy.name,
          email: booking.bookedBy.email,
          employeeId: booking.bookedBy.employeeId,
          role: booking.bookedBy.role
        };

        console.log('🔔 Notification data:', {
          manager: { name: manager.name, email: manager.email },
          employee: { name: employee.name, email: employee.email },
          bookingId: updatedBooking._id
        });

        await notificationHelpers.createBookingApprovedNotification(
          updatedBooking,
          manager,
          employee
        );

        // ✅ FIXED: Only create HR self-notification if the approver is HR
        if (req.user?.role === 'hr') {
          await notificationHelpers.createHRSelfNotification(
            updatedBooking,
            manager,
            'approved'
          );
        }
        
        console.log('✅ Approval notifications created successfully');
      } catch (notificationError) {
        console.error('❌ Failed to create approval notifications:', notificationError);
      }
    } else {
      console.log('⚠️ No notification system available');
    }

    // Update history entry if exists
    try {
      const History = require('../models/History');
      await History.updateOne(
        { bookingId: booking._id },
        { status: 'approved' }
      );
      console.log('✅ History updated to approved status');
    } catch (historyError) {
      console.error('❌ Failed to update history:', historyError);
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error('❌ Error approving booking:', error);
    res.status(500).json({ 
      message: 'Failed to approve booking',
      error: error.message 
    });
  }
};

// ✅ NEW: Reject a booking (for Approval component)
const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy, rejecterId, notes } = req.body;

    console.log('❌ Rejecting booking:', { id, rejectedBy, rejecterId, notes });

    if (!rejectedBy) {
      return res.status(400).json({ message: 'Rejector information is required' });
    }

    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot reject booking with status: ${booking.status}` 
      });
    }

    // Update booking status
    booking.status = 'rejected';
    booking.approvedBy = rejectedBy;
    booking.approverId = rejecterId;
    booking.approvedAt = new Date();
    booking.notes = notes || 'Rejected by manager';
    booking.rejectionReason = notes || 'Rejected by manager';

    const updatedBooking = await booking.save();
    
    console.log('❌ Booking rejected:', {
      id: updatedBooking._id,
      room: updatedBooking.roomName,
      rejectedBy: updatedBooking.approvedBy,
      reason: updatedBooking.notes
    });

    // ✅ NOTIFICATION: Create rejection notification
    if (notificationHelpers) {
      try {
        console.log('🔔 Creating rejection notification...');
        
        const manager = {
          name: rejectedBy,
          email: req.user?.email || req.user?.userEmail,
          employeeId: rejecterId || req.user?.employeeId || req.user?.id,
          role: req.user?.role || 'manager'
        };

        const employee = {
          name: booking.bookedBy.name,
          email: booking.bookedBy.email,
          employeeId: booking.bookedBy.employeeId,
          role: booking.bookedBy.role
        };

        console.log('🔔 Rejection notification data:', {
          manager: { name: manager.name, email: manager.email },
          employee: { name: employee.name, email: employee.email },
          reason: notes
        });

        await notificationHelpers.createBookingRejectedNotification(
          updatedBooking,
          manager,
          employee,
          notes
        );

        // ✅ FIXED: Only create HR self-notification if the rejecter is HR
        if (req.user?.role === 'hr') {
          await notificationHelpers.createHRSelfNotification(
            updatedBooking,
            manager,
            'rejected',
            notes
          );
        }
        
        console.log('✅ Rejection notifications created successfully');
      } catch (notificationError) {
        console.error('❌ Failed to create rejection notifications:', notificationError);
      }
    } else {
      console.log('⚠️ No notification system available');
    }

    // Update history entry if exists
    try {
      const History = require('../models/History');
      await History.updateOne(
        { bookingId: booking._id },
        { status: 'rejected' }
      );
      console.log('✅ History updated to rejected status');
    } catch (historyError) {
      console.error('❌ Failed to update history:', historyError);
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error('❌ Error rejecting booking:', error);
    res.status(500).json({ 
      message: 'Failed to reject booking',
      error: error.message 
    });
  }
};

// ✅ NEW: Get bookings for a specific user (for user dashboard)
const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const userBookings = await Booking.find({
      $or: [
        { 'bookedBy.employeeId': userId },
        { 'bookedBy.id': userId },
        { 'bookedBy.email': userId }
      ]
    }).sort({ submittedAt: -1, createdAt: -1 });

    console.log(`📋 Found ${userBookings.length} bookings for user ${userId}`);
    
    res.status(200).json(userBookings);
  } catch (error) {
    console.error('❌ Error fetching user bookings:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user bookings',
      error: error.message 
    });
  }
};

// ✅ Handler to create a new booking with enhanced utilization refresh trigger
const createBooking = async (req, res) => {
  try {
    const { 
      room, 
      roomName,
      date, 
      time, 
      startTime,
      endTime,
      duration, 
      attendees, 
      purpose, 
      description,
      manager, 
      managerId,
      managerInfo,
      status, 
      role, 
      userInfo,
      priority,
      urgency,
      equipment,
      estimatedCost,
      attachments
    } = req.body;
    
    console.log('🏢 Creating booking...');
    console.log('Request body:', req.body);
    console.log('Request user:', req.user);
    
    // Handle both old and new API formats
    const finalRoomName = roomName || room;
    const finalStartTime = startTime || time;
    let finalEndTime = endTime;
    
    // Calculate end time if not provided but duration is
    if (!finalEndTime && duration && finalStartTime) {
      const startMinutes = timeToMinutes(finalStartTime);
      const endMinutes = startMinutes + parseInt(duration);
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      finalEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }
    
    // Validate required fields
    if (!finalRoomName || !date || !finalStartTime || !finalEndTime || !attendees || !purpose) {
      return res.status(400).json({
        message: 'All required fields must be provided: room, date, startTime, endTime, attendees, purpose'
      });
    }

    // Validate date is not in the past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return res.status(400).json({
        message: 'Cannot book rooms for past dates'
      });
    }

    // Check for booking conflicts
    const conflict = await checkBookingConflict(finalRoomName, date, finalStartTime, finalEndTime);
    if (conflict.hasConflict) {
      const conflictingBooking = conflict.conflictingBooking;
      return res.status(409).json({
        message: `Time slot conflicts with existing booking by ${conflictingBooking.bookedBy.name}`,
        conflictingBooking: conflictingBooking
      });
    }

    // Extract user information with fallbacks
    let userName, userEmail, employeeId, userRole, userId;
    
    // Try to get from req.user first
    if (req.user) {
      userId = req.user.id || req.user._id || req.user.userId;
      userName = req.user.name || req.user.username || req.user.fullName;
      userEmail = req.user.email || req.user.userEmail;
      employeeId = req.user.employeeId || req.user.id || req.user._id;
      userRole = req.user.role || role || 'employee';
    }
    
    // If not available in req.user, try from request body
    if (userInfo) {
      userName = userName || userInfo.name;
      userEmail = userEmail || userInfo.email;
      employeeId = employeeId || userInfo.employeeId || userInfo.id;
      userRole = userRole || userInfo.role || role || 'employee';
    }
    
    // Final fallbacks
    userName = userName || 'Unknown User';
    userEmail = userEmail || 'unknown@example.com';
    employeeId = employeeId || 'unknown';
    userRole = userRole || 'employee';

    console.log('👤 User data being saved:', {
      userId: userId,
      name: userName,
      email: userEmail,
      employeeId: employeeId,
      role: userRole
    });

    // ✅ ENHANCED: Determine booking status based on role and approval workflow
    let bookingStatus = 'pending';
    if (userRole === 'manager' || userRole === 'admin' || userRole === 'hr') {
      bookingStatus = 'approved';
    } else if (userRole === 'employee' && !managerId) {
      // Employee without manager selection - default to pending
      bookingStatus = 'pending';
    } else if (userRole === 'employee' && managerId) {
      // Employee with manager selection - pending approval
      bookingStatus = 'pending';
    }

    // Create new booking with enhanced schema
    const newBooking = new Booking({
      roomName: finalRoomName,
      date: date,
      startTime: finalStartTime,
      endTime: finalEndTime,
      purpose: purpose,
      description: description || purpose,
      attendees: parseInt(attendees),
      status: bookingStatus,
      bookedBy: {
        name: userName,
        email: userEmail,
        employeeId: employeeId,
        role: userRole,
        department: userInfo?.department || req.user?.department || 'General',
        phone: userInfo?.phone || ''
      },
      // Store user department for role-based filtering
      department: userInfo?.department || req.user?.department || 'General',
      userId: userId,
      // Approval workflow fields
      managerId: managerId || null,
      managerInfo: managerInfo || null,
      priority: priority || 'medium',
      urgency: urgency || 'normal',
      equipment: equipment || [],
      submittedAt: new Date(),
      estimatedCost: estimatedCost || `$${parseInt(attendees) * 5}`,
      attachments: attachments || [],
      notes: '',
      approvedBy: null,
      approvedAt: null
    });

    const savedBooking = await newBooking.save();
    console.log('✅ Booking saved successfully:', savedBooking._id);

    // ✅ NOTIFICATION: Create booking notifications
    if (notificationHelpers) {
      try {
        console.log('🔔 Creating booking notifications...');
        
        // Create notifications based on booking status and user role
        if (userRole === 'employee' && managerId && managerInfo) {
          console.log('🔔 Creating manager notification for employee booking request');
          
          // Employee booking - notify manager
          await notificationHelpers.createBookingRequestNotification(
            savedBooking,
            {
              name: userName,
              email: userEmail,
              employeeId: employeeId,
              role: userRole
            },
            managerInfo
          );
          
          console.log('✅ Manager notification created');
        }

        // ✅ FIXED: Only create HR self-notification if the user creating the booking is HR
        if (userRole === 'hr') {
          console.log('🔔 Creating HR self notification for HR booking');
          await notificationHelpers.createHRSelfNotification(
            savedBooking,
            {
              name: userName,
              email: userEmail,
              employeeId: employeeId,
              role: userRole
            },
            'created'
          );
          
          console.log('✅ HR self notification created');
        }
        
        console.log('✅ All booking notifications created successfully');
      } catch (notificationError) {
        console.error('❌ Failed to create booking notifications:', notificationError);
        // Continue without failing the booking creation
      }
    } else {
      console.log('⚠️ No notification system available for new booking');
    }

    // ✅ ENHANCED: Automatically add booking to history with better error handling
    if (userId) {
      console.log('📋 Adding booking to history...');
      try {
        const historyResult = await addBookingToHistory(userId, savedBooking);
        if (historyResult) {
          console.log('✅ Successfully added booking to history:', historyResult._id);
        } else {
          console.log('⚠️ History creation returned null - check logs above');
        }
      } catch (historyError) {
        console.error('❌ Failed to add to history:', historyError);
        // Don't fail the booking creation if history addition fails
      }
    } else {
      console.log('⚠️ No user ID available for history creation');
    }
    
    res.status(201).json({
      message: 'Booking created successfully!',
      booking: savedBooking
    });

  } catch (error) {
    console.error('❌ Booking error:', error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Get all bookings (for admins/managers)
const getAllBookings = async (req, res) => {
  try {
    const { date, room, status } = req.query;
    
    // Build filter object
    const filter = {};
    if (date) filter.date = date;
    if (room) filter.roomName = room;
    if (status) filter.status = status;
    
    const bookings = await Booking.find(filter)
      .sort({ date: 1, startTime: 1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get a specific booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found'
      });
    }
    
    res.status(200).json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ ENHANCED: Update a booking (for ManageBookings edit functionality) with detailed conflict messages
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { room, date, time, duration, attendees, purpose, status } = req.body;
    
    console.log('🔧 Updating booking:', id);
    console.log('Update data:', req.body);
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found'
      });
    }
    
    // Check if user has permission to update this booking
    const userRole = req.user?.role || 'employee';
    const userEmail = req.user?.email || req.user?.userEmail;
    
    // ✅ Include HR in permission check
    if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'hr' && booking.bookedBy.email !== userEmail) {
      return res.status(403).json({
        message: 'Unauthorized to update this booking'
      });
    }
    
    // If updating time/date/room/duration, check for conflicts
    if (room && date && time && duration) {
      const startMinutes = timeToMinutes(time);
      const endMinutes = startMinutes + parseInt(duration);
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      
      // ✅ ENHANCED: Check for conflicts with detailed error message like BookRoom
      const conflict = await checkBookingConflict(room, date, time, endTime, id);
      if (conflict.hasConflict) {
        const conflictingBooking = conflict.conflictingBooking;
        
        // Format the date for better display (like in BookRoom)
        const formatDate = (dateStr) => {
          try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
          } catch (error) {
            return dateStr;
          }
        };
        
        return res.status(409).json({
          message: `This time slot is already booked! The room "${room}" is reserved from ${conflictingBooking.startTime} to ${conflictingBooking.endTime} on ${formatDate(conflictingBooking.date)} by ${conflictingBooking.bookedBy.name}.`,
          conflictingBooking: {
            startTime: conflictingBooking.startTime,
            endTime: conflictingBooking.endTime,
            date: conflictingBooking.date,
            bookedBy: conflictingBooking.bookedBy.name,
            status: conflictingBooking.status,
            room: room
          },
          type: 'BOOKING_CONFLICT'
        });
      }
      
      // Update fields
      booking.roomName = room;
      booking.date = date;
      booking.startTime = time;
      booking.endTime = endTime;
    }
    
    if (attendees) booking.attendees = parseInt(attendees);
    if (purpose) booking.purpose = purpose;
    
    // ✅ Include HR in status update permission
    if (status && (userRole === 'admin' || userRole === 'manager' || userRole === 'hr')) {
      booking.status = status;
    }
    
    const updatedBooking = await booking.save();
    
    console.log('✅ Booking updated successfully');
    
    // Update history entry if it exists
    try {
      const History = require('../models/History');
      await History.updateOne(
        { bookingId: booking._id },
        { 
          title: booking.purpose,
          date: booking.date,
          time: `${booking.startTime} - ${booking.endTime}`,
          room: booking.roomName,
          attendees: booking.attendees,
          status: booking.status
        }
      );
      console.log('✅ History updated successfully');
    } catch (historyError) {
      console.error('❌ Failed to update history:', historyError);
    }
    
    res.status(200).json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
    
  } catch (error) {
    console.error('❌ Error updating booking:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ NEW: Cancel a booking (replaces delete functionality)
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log('❌ Cancelling booking:', id);
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found'
      });
    }
    
    // Check if user has permission to cancel this booking
    const userRole = req.user?.role || 'employee';
    const userEmail = req.user?.email || req.user?.userEmail;
    const userName = req.user?.name || req.user?.username || 'Unknown User';
    const userId = req.user?.id || req.user?._id || req.user?.employeeId;
    
    // ✅ Include HR in permission check
    if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'hr' && booking.bookedBy.email !== userEmail) {
      return res.status(403).json({
        message: 'Unauthorized to cancel this booking'
      });
    }
    
    // Update booking status to cancelled
    booking.status = 'cancelled';
    if (reason) {
      booking.rejectionReason = reason; // Using existing field
    }
    
    const cancelledBooking = await booking.save();
    
    console.log('✅ Booking cancelled successfully');

    // ✅ NOTIFICATION: Create cancellation notifications
    if (notificationHelpers) {
      try {
        console.log('🔔 Creating cancellation notifications...');
        
        const cancelledBy = {
          name: userName,
          email: userEmail,
          employeeId: userId,
          role: userRole
        };

        const recipients = [];
        
        // Add booking creator if different from canceller
        if (booking.bookedBy.email !== userEmail) {
          recipients.push(booking.bookedBy);
        }

        // Add manager if exists and different from canceller
        if (booking.managerInfo && booking.managerInfo.email !== userEmail) {
          recipients.push({
            email: booking.managerInfo.email,
            name: booking.managerInfo.name,
            role: 'manager'
          });
        }

        console.log('🔔 Cancellation notification recipients:', recipients.map(r => ({ name: r.name, email: r.email })));

        await notificationHelpers.createBookingCancelledNotification(
          cancelledBooking,
          cancelledBy,
          recipients
        );

        // ✅ FIXED: Only create HR self-notification if the canceller is HR
        if (userRole === 'hr') {
          await notificationHelpers.createHRSelfNotification(
            cancelledBooking,
            cancelledBy,
            'cancelled',
            reason
          );
        }
        
        console.log('✅ Cancellation notifications created successfully');
      } catch (notificationError) {
        console.error('❌ Failed to create cancellation notifications:', notificationError);
      }
    } else {
      console.log('⚠️ No notification system available for cancellation');
    }
    
    // Update history entry status if it exists
    try {
      const History = require('../models/History');
      await History.updateOne(
        { bookingId: booking._id },
        { status: 'cancelled' }
      );
      console.log('✅ History status updated to cancelled');
    } catch (historyError) {
      console.error('❌ Failed to update history status:', historyError);
    }
    
    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: cancelledBooking
    });
    
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete a booking (keep for admin use)
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found'
      });
    }
    
    // Check if user has permission to delete this booking
    const userRole = req.user?.role || 'employee';
    const userEmail = req.user?.email || req.user?.userEmail;
    
    // ✅ Include HR in permission check
    if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'hr' && booking.bookedBy.email !== userEmail) {
      return res.status(403).json({
        message: 'Unauthorized to delete this booking'
      });
    }
    
    await Booking.findByIdAndDelete(id);
    
    res.status(200).json({
      message: 'Booking deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Approve or reject a booking (for managers/admins/hr) with enhanced history update
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const userRole = req.user?.role || 'employee';
    const userEmail = req.user?.email || req.user?.userEmail;
    const userName = req.user?.name || req.user?.username || 'Unknown User';
    const userId = req.user?.id || req.user?._id || req.user?.employeeId;
    
    console.log('🔄 Updating booking status:', { id, status, userRole, userName });
    
    // ✅ Include HR in permission check
    if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'hr') {
      return res.status(403).json({
        message: 'Unauthorized to update booking status'
      });
    }
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found'
      });
    }
    
    // If approving a booking, check for conflicts one more time
    if (status === 'approved') {
      const conflict = await checkBookingConflict(
        booking.roomName, 
        booking.date, 
        booking.startTime, 
        booking.endTime, 
        id
      );
      if (conflict.hasConflict) {
        return res.status(409).json({
          message: 'Cannot approve booking due to time conflict',
          conflictingBooking: conflict.conflictingBooking
        });
      }
    }

    const oldStatus = booking.status;
    booking.status = status;
    if (reason) booking.rejectionReason = reason;
    
    const updatedBooking = await booking.save();
    console.log('✅ Booking status updated successfully');

    // ✅ NOTIFICATION: Create status change notifications
    if (notificationHelpers) {
      try {
        console.log('🔔 Creating status change notifications...');
        
        const manager = {
          name: userName,
          email: userEmail,
          employeeId: userId,
          role: userRole
        };

        const employee = {
          name: booking.bookedBy.name,
          email: booking.bookedBy.email,
          employeeId: booking.bookedBy.employeeId,
          role: booking.bookedBy.role
        };

        console.log('🔔 Status change notification data:', {
          oldStatus,
          newStatus: status,
          manager: { name: manager.name, email: manager.email },
          employee: { name: employee.name, email: employee.email }
        });

        if (status === 'approved' && oldStatus !== 'approved') {
          await notificationHelpers.createBookingApprovedNotification(
            updatedBooking,
            manager,
            employee
          );
          
          // ✅ FIXED: Only create HR self-notification if the approver is HR
          if (userRole === 'hr') {
            await notificationHelpers.createHRSelfNotification(
              updatedBooking,
              manager,
              'approved'
            );
          }
        } else if (status === 'rejected' && oldStatus !== 'rejected') {
          await notificationHelpers.createBookingRejectedNotification(
            updatedBooking,
            manager,
            employee,
            reason
          );
          
          // ✅ FIXED: Only create HR self-notification if the rejecter is HR
          if (userRole === 'hr') {
            await notificationHelpers.createHRSelfNotification(
              updatedBooking,
              manager,
              'rejected',
              reason
            );
          }
        }
        
        console.log('✅ Status change notifications created successfully');
      } catch (notificationError) {
        console.error('❌ Failed to create status change notifications:', notificationError);
      }
    } else {
      console.log('⚠️ No notification system available for status change');
    }

    // ✅ ENHANCED: Update history entry status if it exists
    try {
      const History = require('../models/History');
      const updateResult = await History.updateOne(
        { bookingId: booking._id },
        { status: status }
      );
      console.log('📋 History update result:', updateResult);
      
      if (updateResult.matchedCount > 0) {
        console.log('✅ Successfully updated history status');
      } else {
        console.log('⚠️ No history entry found to update');
      }
    } catch (historyError) {
      console.error('❌ Failed to update history status:', historyError);
      // Don't fail the status update if history update fails
    }
    
    res.status(200).json({
      message: `Booking ${status} successfully`,
      booking: updatedBooking
    });
    
  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get bookings for a specific date range
const getBookingsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, room } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Start date and end date are required'
      });
    }
    
    const filter = {
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    if (room) filter.roomName = room;
    
    const bookings = await Booking.find(filter)
      .sort({ date: 1, startTime: 1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings by date range:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get room availability for a specific date
const getRoomAvailability = async (req, res) => {
  try {
    const { date, room } = req.query;
    
    if (!date) {
      return res.status(400).json({
        message: 'Date is required'
      });
    }
    
    const filter = { 
      date: date,
      status: { $in: ['approved', 'pending'] }
    };
    
    if (room) filter.roomName = room;
    
    const bookings = await Booking.find(filter)
      .select('roomName startTime endTime status')
      .sort({ startTime: 1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching room availability:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getMyBookings,
  getMyManageBookings,
  getUserBookingStats,
  getUpcomingBookings,
  getBookingStatistics, // ✅ ENHANCED: Now supports filtering
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  deleteBooking,
  updateBookingStatus,
  getBookingsByDateRange,
  getRoomAvailability,
  // New approval workflow methods
  getApprovalRequests,
  approveBooking,
  rejectBooking,
  getUserBookings
};