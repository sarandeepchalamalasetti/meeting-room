const Room = require('../models/Room');
const Booking = require('../models/Booking');
const fs = require('fs');
const path = require('path');

// Helper function to load JSON data as fallback
const loadJSONData = (filename) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
};

// Helper function to convert time to minutes
const convertTimeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to format time for display
const formatTimeForDisplay = (timeString) => {
  const [hours] = timeString.split(':');
  const hour = parseInt(hours);
  
  if (hour === 0) return '12AM';
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return '12PM';
  return `${hour - 12}PM`;
};

// ✅ NEW: Helper function to build date filter for room queries
const buildDateFilter = (startDate, endDate, filterType) => {
  if (!startDate || !endDate) {
    return { date: new Date().toISOString().split('T')[0] };
  }
  
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

// Get all rooms (existing function - enhanced with fallback)
const getAllRooms = async (req, res) => {
  try {
    let rooms = await Room.find();
    
    // If no rooms in database, try to load from JSON as fallback
    if (rooms.length === 0) {
      console.log('No rooms in database, loading from JSON file as fallback');
      rooms = loadJSONData('rooms.json');
    }
    
    res.status(200).json(rooms);
  } catch (err) {
    console.error('Error fetching rooms from database:', err);
    
    // Fallback to JSON file if database fails
    try {
      const rooms = loadJSONData('rooms.json');
      res.status(200).json(rooms);
    } catch (jsonError) {
      res.status(500).json({ message: 'Failed to fetch rooms from both database and JSON file' });
    }
  }
};

// Seed rooms (existing function)
const seedRooms = async (req, res) => {
  try {
    const data = require('../data/rooms.json');
    await Room.insertMany(data);
    res.status(200).json({ message: 'Rooms seeded successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Seeding failed', error: err.message });
  }
};

// ✅ ENHANCED: Get room statistics with filter support
const getRoomStatistics = async (req, res) => {
  try {
    // ✅ NEW: Extract filter parameters
    const { date, startDate, endDate, filterType } = req.query;
    
    // Determine target date based on filter
    let targetDate = date;
    if (!targetDate && startDate) {
      targetDate = startDate;
    }
    if (!targetDate) {
      targetDate = new Date().toISOString().split('T')[0];
    }
    
    console.log('📊 Fetching room statistics with filter:', { 
      date, 
      startDate, 
      endDate, 
      filterType, 
      targetDate 
    });
    
    // Get total rooms from database first, then fallback to JSON
    let allRooms = [];
    try {
      allRooms = await Room.find();
      if (allRooms.length === 0) {
        allRooms = loadJSONData('rooms.json');
      }
    } catch (error) {
      console.log('Database error, using JSON fallback for room count');
      allRooms = loadJSONData('rooms.json');
    }
    
    const totalRooms = allRooms.length;
    
    // ✅ NEW: Build date filter based on filter type
    const dateFilter = buildDateFilter(startDate, endDate, filterType);
    
    // Get bookings for the specified date range
    const bookingsQuery = {
      ...dateFilter,
      status: { $in: ['approved', 'pending', 'rejected'] }
    };
    
    console.log('📊 Bookings query with filter:', JSON.stringify(bookingsQuery, null, 2));
    
    const bookings = await Booking.find(bookingsQuery);
    
    console.log('📊 Found bookings for filtered date range:', bookings.length);
    
    // Calculate statistics
    const approvedBookings = bookings.filter(booking => booking.status === 'approved');
    const pendingBookings = bookings.filter(booking => booking.status === 'pending');
    const rejectedBookings = bookings.filter(booking => booking.status === 'rejected');
    
    // Get unique booked room names for approved bookings
    const bookedRoomNames = [...new Set(approvedBookings.map(booking => booking.roomName))];
    const availableRooms = totalRooms - bookedRoomNames.length;
    
    const statistics = {
      totalRooms,
      available: Math.max(0, availableRooms),
      pending: pendingBookings.length,
      booked: approvedBookings.length,
      rejected: rejectedBookings.length,
      date: targetDate,
      filter: { startDate, endDate, filterType }
    };
    
    console.log('📊 Room statistics with filter:', statistics);
    
    res.status(200).json(statistics);
  } catch (error) {
    console.error('❌ Error fetching room statistics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch room statistics',
      error: error.message 
    });
  }
};

// ✅ ENHANCED: Get booking heatmap data with filter support
const getBookingHeatmap = async (req, res) => {
  try {
    // ✅ NEW: Extract filter parameters
    const { date, floor, wing, startDate, endDate, filterType } = req.query;
    
    // Determine target date for heatmap (heatmap shows single day)
    let targetDate = date;
    if (!targetDate && startDate) {
      targetDate = startDate;
    }
    if (!targetDate) {
      targetDate = new Date().toISOString().split('T')[0];
    }
    
    console.log('🗺️ Fetching heatmap data with filter:', { 
      targetDate, 
      floor, 
      wing, 
      filterType 
    });
    
    // Get rooms from database first, then fallback to JSON
    let rooms = [];
    try {
      rooms = await Room.find();
      if (rooms.length === 0) {
        rooms = loadJSONData('rooms.json');
      }
    } catch (error) {
      console.log('Database error, using JSON fallback for rooms');
      rooms = loadJSONData('rooms.json');
    }
    
    // Filter by floor and wing if specified
    if (floor && floor !== 'all') {
      rooms = rooms.filter(room => room.floor === floor);
    }
    if (wing && wing !== 'all') {
      rooms = rooms.filter(room => room.wing === wing);
    }
    
    console.log('🗺️ Filtered rooms:', rooms.length);
    
    // Get bookings for the specific date (heatmap always shows single day)
    const dayBookings = await Booking.find({ 
      date: targetDate,
      status: { $in: ['approved', 'pending', 'rejected'] }
    }).sort({ startTime: 1 });
    
    console.log('🗺️ Found bookings for', targetDate, ':', dayBookings.length);
    
    // Time slots (8 AM to 8 PM)
    const timeSlots = [
      "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
      "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
    ];
    
    // Build heatmap data
    const heatmapData = rooms.map(room => {
      const roomName = room.name || room.roomName; // Support both formats
      const roomBookings = dayBookings.filter(booking => booking.roomName === roomName);
      
      const timeSlotData = timeSlots.map(timeSlot => {
        // Find booking that covers this time slot
        const booking = roomBookings.find(booking => {
          const bookingStart = convertTimeToMinutes(booking.startTime);
          const bookingEnd = convertTimeToMinutes(booking.endTime);
          const slotTime = convertTimeToMinutes(timeSlot);
          
          return slotTime >= bookingStart && slotTime < bookingEnd;
        });
        
        if (booking) {
          return {
            status: booking.status,
            attendees: booking.attendees,
            purpose: booking.purpose,
            bookedBy: {
              name: booking.bookedBy.name,
              role: booking.bookedBy.role,
              email: booking.bookedBy.email
            },
            startTime: booking.startTime,
            endTime: booking.endTime,
            bookingId: booking._id
          };
        } else {
          // Check if this time has passed for today
          const currentTime = new Date();
          const isToday = targetDate === new Date().toISOString().split('T')[0];
          const isPastTime = isToday && convertTimeToMinutes(timeSlot) < (currentTime.getHours() * 60 + currentTime.getMinutes());
          
          return {
            status: 'available',
            isPastTime: isPastTime,
            capacity: room.capacity
          };
        }
      });
      
      return {
        roomId: room.id || room._id,
        roomName: roomName,
        floor: room.floor,
        wing: room.wing,
        capacity: room.capacity,
        timeSlots: timeSlotData
      };
    });
    
    const response = {
      date: targetDate,
      timeSlots: timeSlots.map(time => formatTimeForDisplay(time)),
      rooms: heatmapData,
      filters: {
        floor: floor || 'all',
        wing: wing || 'all'
      },
      filter: { startDate, endDate, filterType }
    };
    
    console.log('🗺️ Heatmap response prepared for', heatmapData.length, 'rooms with filter');
    
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error fetching heatmap data:', error);
    res.status(500).json({ 
      message: 'Failed to fetch heatmap data',
      error: error.message 
    });
  }
};

// Get available floors and wings (existing function)
const getFilters = async (req, res) => {
  try {
    // Get rooms from database first, then fallback to JSON
    let rooms = [];
    try {
      rooms = await Room.find();
      if (rooms.length === 0) {
        rooms = loadJSONData('rooms.json');
      }
    } catch (error) {
      console.log('Database error, using JSON fallback for filters');
      rooms = loadJSONData('rooms.json');
    }
    
    const floors = [...new Set(rooms.map(room => room.floor))].filter(Boolean).sort();
    const wings = [...new Set(rooms.map(room => room.wing))].filter(Boolean).sort();
    
    res.status(200).json({
      floors,
      wings
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ 
      message: 'Failed to fetch filters',
      error: error.message 
    });
  }
};

// ✅ ENHANCED: Room utilization with filter support
const getRoomUtilization = async (req, res) => {
  try {
    const { userId, role, department, email, name } = req.user;
    
    // ✅ NEW: Extract filter parameters
    const { startDate, endDate, filterType } = req.query;
    
    console.log('📊 Fetching room utilization with filter:', { 
      userId, 
      role, 
      department, 
      email, 
      name,
      startDate, 
      endDate, 
      filterType 
    });
    
    // Load rooms data from database first, then fallback to JSON
    let rooms = [];
    try {
      rooms = await Room.find();
      if (rooms.length === 0) {
        console.log('📄 No rooms in database, loading from JSON file');
        rooms = loadJSONData('rooms.json');
      }
    } catch (error) {
      console.log('📄 Database error, using JSON fallback for room utilization');
      rooms = loadJSONData('rooms.json');
    }
    
    if (!rooms || rooms.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No rooms found' 
      });
    }

    // ✅ NEW: Calculate date range based on filter or default to last 30 days
    let actualEndDate, actualStartDate;
    
    if (startDate && endDate) {
      actualStartDate = new Date(startDate);
      actualEndDate = new Date(endDate);
    } else {
      actualEndDate = new Date();
      actualStartDate = new Date();
      actualStartDate.setDate(actualStartDate.getDate() - 30);
    }

    console.log('📅 Date range for utilization with filter:', { 
      start: actualStartDate.toISOString().split('T')[0], 
      end: actualEndDate.toISOString().split('T')[0] 
    });

    // ✅ NEW: Build date filter for bookings query
    const dateFilter = {
      $or: [
        { date: { $gte: actualStartDate.toISOString().split('T')[0], $lte: actualEndDate.toISOString().split('T')[0] } },
        { bookingDate: { $gte: actualStartDate, $lte: actualEndDate } }
      ],
      status: { $in: ['approved', 'pending'] }
    };

    const allBookings = await Booking.find(dateFilter)
      .select('roomName userId bookedBy.email bookedBy.name bookedBy.employeeId status date bookingDate');

    console.log('📊 Found total bookings in filtered date range:', allBookings.length);

    const utilizationData = [];

    for (const room of rooms) {
      try {
        const roomName = room.name;
        
        // Get all bookings for this room
        const roomBookings = allBookings.filter(booking => 
          booking.roomName === roomName || booking.roomName === room.id
        );

        console.log(`🏢 Room ${roomName} has ${roomBookings.length} total bookings in filtered range`);

        // ✅ Calculate OUR bookings (NUMERATOR - only logged-in user)
        const ourBookings = roomBookings.filter(booking => {
          return (
            booking.userId === userId ||
            booking.bookedBy?.email === email ||
            booking.bookedBy?.employeeId === userId
          );
        }).length;

        // ✅ Calculate UNIQUE USERS properly (DENOMINATOR)
        // Use email as primary identifier, fall back to userId/employeeId only if no email
        const uniqueUsers = new Set();
        
        roomBookings.forEach(booking => {
          // Priority 1: Use email if available (most reliable identifier)
          if (booking.bookedBy?.email) {
            uniqueUsers.add(booking.bookedBy.email.toLowerCase());
          }
          // Priority 2: Use employeeId if no email
          else if (booking.bookedBy?.employeeId) {
            uniqueUsers.add(`emp_${booking.bookedBy.employeeId}`);
          }
          // Priority 3: Use userId if no email or employeeId
          else if (booking.userId) {
            uniqueUsers.add(`user_${booking.userId}`);
          }
          // Fallback: Use a combination if nothing else available
          else {
            uniqueUsers.add(`unknown_${booking._id}`);
          }
        });

        const totalUniqueUsers = uniqueUsers.size;

        // ✅ Debug logging to verify the fix
        console.log(`🔍 ${roomName} unique users breakdown:`, Array.from(uniqueUsers));

        // ✅ Calculate percentage EXACTLY as specified
        // (ourBookings / totalUniqueUsers) * 100
        let utilizationPercentage = 0;
        if (totalUniqueUsers > 0) {
          utilizationPercentage = Math.round((ourBookings / totalUniqueUsers) * 100);
        }

        // ✅ Determine if this room should get priority (user has bookings)
        const hasUserBookings = ourBookings > 0;

        console.log(`📊 ${roomName} with filter - Our: ${ourBookings}, Unique Users: ${totalUniqueUsers}, Percentage: ${utilizationPercentage}%, Priority: ${hasUserBookings}`);

        utilizationData.push({
          id: room.id || roomName,
          name: roomName,
          capacity: room.capacity || 0,
          floor: room.floor || '',
          wing: room.wing || '',
          ourBookings,                                           // ✅ NUMERATOR: User's bookings only
          totalUniqueUsers,                                      // ✅ FIXED DENOMINATOR: Actual unique users
          utilizationPercentage: Math.min(utilizationPercentage, 100), // ✅ Cap at 100%
          hasUserBookings,                                       // ✅ For priority sorting
          lastUpdated: new Date()
        });

      } catch (roomError) {
        console.error(`❌ Error processing room ${room.name}:`, roomError);
        
        // Add room with zero data to show in UI
        utilizationData.push({
          id: room.id || room.name,
          name: room.name,
          capacity: room.capacity || 0,
          floor: room.floor || '',
          wing: room.wing || '',
          ourBookings: 0,
          totalUniqueUsers: 0,
          utilizationPercentage: 0,
          hasUserBookings: false,
          lastUpdated: new Date()
        });
      }
    }

    // ✅ Sort EXACTLY as specified
    // 1. User's rooms first (hasUserBookings = true)
    // 2. Then by percentage (high to low)
    utilizationData.sort((a, b) => {
      // First priority: rooms where user has bookings
      if (a.hasUserBookings && !b.hasUserBookings) return -1;
      if (!a.hasUserBookings && b.hasUserBookings) return 1;
      
      // Second priority: by utilization percentage (high to low)
      return b.utilizationPercentage - a.utilizationPercentage;
    });

    console.log('✅ Room utilization data prepared with filter:', utilizationData.length, 'rooms');
    console.log('🔝 Top 3 rooms:', utilizationData.slice(0, 3).map(r => ({
      name: r.name,
      our: r.ourBookings,
      users: r.totalUniqueUsers,
      percentage: r.utilizationPercentage,
      priority: r.hasUserBookings
    })));

    res.status(200).json({
      success: true,
      data: utilizationData,
      totalRooms: utilizationData.length,
      dateRange: {
        start: actualStartDate.toISOString().split('T')[0],
        end: actualEndDate.toISOString().split('T')[0]
      },
      userInfo: {
        userId,
        email,
        role
      },
      filter: { startDate, endDate, filterType },
      message: `Room utilization with filter support - unique users properly counted`
    });

  } catch (error) {
    console.error('❌ Error fetching room utilization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room utilization data',
      error: error.message
    });
  }
};

// Export using the same pattern as existing code
module.exports = {
  getAllRooms,
  seedRooms,
  getRoomStatistics, // ✅ ENHANCED: Now supports filtering
  getBookingHeatmap, // ✅ ENHANCED: Now supports filtering
  getFilters,
  getRoomUtilization // ✅ ENHANCED: Now supports filtering
};

// Also export using exports pattern for compatibility
exports.getAllRooms = getAllRooms;
exports.seedRooms = seedRooms;
exports.getRoomStatistics = getRoomStatistics;
exports.getBookingHeatmap = getBookingHeatmap;
exports.getFilters = getFilters;
exports.getRoomUtilization = getRoomUtilization;