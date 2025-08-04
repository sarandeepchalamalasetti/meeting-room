const History = require('../models/History');
const mongoose = require('mongoose');

// Get user's booking history
const getUserHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    console.log('📋 Fetching history for user:', userId);
    
    if (!userId) {
      console.log('❌ No user ID found in request');
      return res.status(400).json({ message: 'User ID not found' });
    }

    const history = await History.find({ userId }).sort({ createdAt: -1 });
    console.log('✅ Found history entries:', history.length);
    
    res.json(history);
  } catch (error) {
    console.error('❌ Error fetching history:', error);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};

// Add booking to history manually
const addToHistory = async (req, res) => {
  try {
    const { bookingId, title, date, time, room, attendees, status, organizer } = req.body;
    const userId = req.user.id || req.user._id || req.user.userId;

    console.log('📝 Manual history addition for user:', userId);

    const historyEntry = new History({
      userId,
      bookingId,
      title,
      date,
      time,
      room,
      attendees,
      status,
      organizer
    });

    const savedEntry = await historyEntry.save();
    console.log('✅ History entry created manually:', savedEntry._id);
    
    res.status(201).json({ message: 'History entry created', history: savedEntry });
  } catch (error) {
    console.error('❌ Error adding to history:', error);
    res.status(500).json({ message: 'Failed to add to history' });
  }
};

// Add booking to history (internal function for auto-adding from booking creation)
const addBookingToHistory = async (userId, booking) => {
  try {
    console.log('🔄 Adding booking to history...');
    console.log('User ID:', userId);
    console.log('Booking ID:', booking._id);
    console.log('Booking details:', {
      roomName: booking.roomName,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status
    });
    
    if (!userId) {
      console.log('❌ No user ID provided for history');
      return null;
    }

    if (!booking._id) {
      console.log('❌ No booking ID provided for history');
      return null;
    }

    // Calculate end time
    const startTime = booking.startTime || booking.time;
    let endTime = booking.endTime;
    
    if (!endTime && booking.duration) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + parseInt(booking.duration);
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }

    const historyData = {
      userId: userId.toString(),
      bookingId: booking._id,
      title: booking.purpose || booking.title || 'Meeting',
      date: booking.date,
      time: endTime ? `${startTime} - ${endTime}` : startTime,
      room: booking.roomName || booking.room,
      attendees: parseInt(booking.attendees) || 1,
      status: booking.status || 'pending',
      organizer: booking.bookedBy?.name || booking.bookedBy?.username || 'Unknown'
    };

    console.log('📋 Creating history entry with data:', historyData);

    const historyEntry = new History(historyData);
    const savedHistory = await historyEntry.save();
    
    console.log('✅ Successfully added booking to history:', savedHistory._id);
    return savedHistory;
  } catch (error) {
    console.error('❌ Error adding booking to history:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    return null;
  }
};

// Delete history entry
const deleteHistoryEntry = async (req, res) => {
  try {
    const historyId = req.params.id;
    const userId = req.user.id || req.user._id || req.user.userId;

    console.log('🗑️ Deleting history entry:', historyId, 'for user:', userId);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(historyId)) {
      return res.status(400).json({ message: 'Invalid history ID' });
    }

    const historyEntry = await History.findOne({ _id: historyId, userId: userId.toString() });
    if (!historyEntry) {
      console.log('❌ History entry not found');
      return res.status(404).json({ message: 'History entry not found' });
    }

    await History.findByIdAndDelete(historyId);
    console.log('✅ History entry deleted successfully');
    
    res.json({ message: 'History entry deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting history:', error);
    res.status(500).json({ message: 'Failed to delete history entry' });
  }
};

// Get history statistics
const getHistoryStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    console.log('📊 Fetching history stats for user:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found' });
    }

    const userIdStr = userId.toString();
    
    const totalBookings = await History.countDocuments({ userId: userIdStr });
    const completedBookings = await History.countDocuments({ userId: userIdStr, status: 'completed' });
    const rejectedBookings = await History.countDocuments({ 
      userId: userIdStr, 
      $or: [{ status: 'rejected' }, { status: 'cancelled' }] 
    });
    
    // Calculate total hours from all bookings
    const allEntries = await History.find({ userId: userIdStr });
    let totalHours = 0;
    
    allEntries.forEach(entry => {
      if (entry.time && entry.time.includes(' - ')) {
        const [startTime, endTime] = entry.time.split(' - ');
        if (startTime && endTime) {
          try {
            const start = new Date(`2000-01-01 ${startTime}`);
            const end = new Date(`2000-01-01 ${endTime}`);
            const duration = (end - start) / (1000 * 60 * 60);
            if (duration > 0 && duration < 24) { // Sanity check
              totalHours += duration;
            }
          } catch (error) {
            console.error('Error calculating duration for entry:', entry._id);
          }
        }
      }
    });

    const stats = {
      totalBookings,
      completedBookings,
      rejectedBookings,
      totalHours: Math.round(totalHours * 10) / 10 // Round to 1 decimal place
    };

    console.log('📊 History stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching history stats:', error);
    res.status(500).json({ message: 'Failed to fetch history statistics' });
  }
};

module.exports = {
  getUserHistory,
  addToHistory,
  addBookingToHistory,
  deleteHistoryEntry,
  getHistoryStats
};