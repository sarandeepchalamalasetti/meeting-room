import React, { useState, useEffect, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiFilter } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import Month from '../Month/Month.jsx';
import Week from '../Week/Week.jsx';
import Day from '../Day/Day.jsx';

import './Calendar.css';

const Calendar = () => {
  // Get user data from sessionStorage
  const getUserData = () => {
    try {
      const userData = sessionStorage.getItem('user');
      return userData ? JSON.parse(userData) : { 
        role: 'manager',
        name: 'Demo User',
        email: 'demo@example.com',
        id: 'demo-user-id'
      };
    } catch (error) {
      return { 
        role: 'manager', 
        name: 'Demo User',
        email: 'demo@example.com',
        id: 'demo-user-id'
      };
    }
  };

  const user = getUserData();
  const token = sessionStorage.getItem('token');

  const [currentView, setCurrentView] = useState('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isOnline, setIsOnline] = useState(true);

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // ✅ Fetch user's bookings from backend
  const fetchUserBookings = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!token) {
        // ✅ FIXED: Demo data with proper local date handling (no timezone conversion)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        // ✅ FIXED: Use local date string without timezone conversion
        const formatLocalDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const demoBookings = [
          {
            _id: 'demo-1',
            roomName: 'Conference Room A1',
            date: formatLocalDate(today), // ✅ Today's date (local)
            startTime: '10:00',
            endTime: '11:00',
            purpose: 'Team Meeting',
            status: 'approved',
            attendees: 8,
            bookedBy: {
              id: user.id,
              name: user.name,
              email: user.email
            },
            createdAt: today.toISOString()
          },
          {
            _id: 'demo-2',
            roomName: 'Meeting Room A3',
            date: formatLocalDate(tomorrow), // ✅ Tomorrow's date (local)
            startTime: '14:00',
            endTime: '15:30',
            purpose: 'Project Review',
            status: 'pending',
            attendees: 6,
            bookedBy: {
              id: user.id,
              name: user.name,
              email: user.email
            },
            createdAt: today.toISOString()
          },
          {
            _id: 'demo-3',
            roomName: 'Board Room A2',
            date: formatLocalDate(yesterday), // ✅ Yesterday's date (local)
            startTime: '09:00',
            endTime: '10:00',
            purpose: 'Board Meeting',
            status: 'approved',
            attendees: 12,
            bookedBy: {
              id: user.id,
              name: user.name,
              email: user.email
            },
            createdAt: yesterday.toISOString()
          }
        ];
        setBookings(demoBookings);
        setIsOnline(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // ✅ Filter bookings to only show current user's bookings
      const userBookings = (response.data || []).filter(booking => 
        booking.bookedBy?.id === user.id || 
        booking.bookedBy?.email === user.email ||
        booking.bookedBy?.employeeId === user.id
      );
      
      setBookings(userBookings);
      setIsOnline(true);
      
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
      setIsOnline(false);
      toast.error('Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, user.id, user.email]);

  // ✅ FIXED: Process bookings for calendar display with proper local date handling
  const processBookingsForCalendar = () => {
    const bookingsByDate = {};
    
    bookings.forEach(booking => {
      // ✅ FIXED: Use booking date as-is (no timezone conversion)
      const dateKey = booking.date; // Assuming booking.date is already in YYYY-MM-DD format
      
      if (!bookingsByDate[dateKey]) {
        bookingsByDate[dateKey] = [];
      }
      
      // ✅ Determine booking status for calendar display
      const bookingStatus = getBookingDisplayStatus(booking);
      
      bookingsByDate[dateKey].push({
        ...booking,
        displayStatus: bookingStatus,
        time: booking.startTime,
        duration: calculateDuration(booking.startTime, booking.endTime),
        isToday: dateKey === getCurrentDateKey(),
        isPast: new Date(dateKey) < new Date().setHours(0, 0, 0, 0),
        isFuture: new Date(dateKey) > new Date().setHours(23, 59, 59, 999)
      });
    });
    
    return bookingsByDate;
  };

  // ✅ FIXED: Helper function to get current date key in local timezone
  const getCurrentDateKey = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ✅ Helper function to get date key for any date object
  const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ✅ Determine display status based on booking status and timing
  const getBookingDisplayStatus = (booking) => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const bookingDateTime = new Date(`${booking.date}T${booking.endTime}`);
    const now = new Date();
    
    // If booking is in the past and was approved, mark as completed
    if (bookingDateTime < now && booking.status === 'approved') {
      return 'completed';
    }
    
    // If booking is in future and approved, mark as upcoming  
    if (bookingDateTime > now && booking.status === 'approved') {
      return 'upcoming';
    }
    
    // Return original status for pending, rejected, cancelled
    return booking.status;
  };

  // ✅ Calculate duration between start and end time
  const calculateDuration = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return diffMinutes > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffHours}h`;
    }
    return `${diffMinutes}m`;
  };

  // ✅ Filter bookings based on selected status
  const getFilteredBookings = () => {
    if (statusFilter === 'all') return bookings;
    
    return bookings.filter(booking => {
      const displayStatus = getBookingDisplayStatus(booking);
      return displayStatus === statusFilter;
    });
  };

  // Fetch bookings on component mount and set up auto-refresh
  useEffect(() => {
    fetchUserBookings();
    
    // Refresh every 2 minutes for real-time updates
    const interval = setInterval(fetchUserBookings, 120000);
    return () => clearInterval(interval);
  }, [fetchUserBookings]);

  // Get month name
  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Get week range
  const getWeekRange = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `Week of ${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}/${startOfWeek.getFullYear()}`;
  };

  // Get day string
  const getDayString = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'Month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === 'Week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (currentView === 'Day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'Month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === 'Week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (currentView === 'Day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setCurrentView('Today');
  };

  // ✅ FIXED: Get calendar data for month view with proper local date handling
  const getCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateObj = new Date(startDate);
    const bookingsByDate = processBookingsForCalendar();
    
    for (let i = 0; i < 42; i++) {
      // ✅ FIXED: Use proper local date key generation
      const dateKey = getDateKey(currentDateObj);
      const dayBookings = bookingsByDate[dateKey] || [];
      
      // Apply status filter
      const filteredBookings = statusFilter === 'all' ? dayBookings : 
        dayBookings.filter(booking => booking.displayStatus === statusFilter);
      
      days.push({
        date: new Date(currentDateObj),
        isCurrentMonth: currentDateObj.getMonth() === month,
        isToday: currentDateObj.toDateString() === new Date().toDateString(),
        isSelected: selectedDate && currentDateObj.toDateString() === selectedDate.toDateString(),
        bookings: filteredBookings,
        hasBookings: filteredBookings.length > 0
      });
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    return days;
  };

  // Get week data
  const getWeekData = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const weekDays = [];
    const bookingsByDate = processBookingsForCalendar();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateKey = getDateKey(date);
      const dayBookings = bookingsByDate[dateKey] || [];
      
      // Apply status filter
      const filteredBookings = statusFilter === 'all' ? dayBookings : 
        dayBookings.filter(booking => booking.displayStatus === statusFilter);
      
      weekDays.push({
        date: date,
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        bookings: filteredBookings,
        hasBookings: filteredBookings.length > 0
      });
    }
    
    return weekDays;
  };

  // Get day bookings
  const getDayBookings = () => {
    const dateKey = getDateKey(selectedDate || currentDate);
    const bookingsByDate = processBookingsForCalendar();
    const dayBookings = bookingsByDate[dateKey] || [];
    
    // Apply status filter
    return statusFilter === 'all' ? dayBookings : 
      dayBookings.filter(booking => booking.displayStatus === statusFilter);
  };

  // Get current display title
  const getCurrentTitle = () => {
    if (currentView === 'Today' || currentView === 'Day') {
      return getDayString(currentDate);
    } else if (currentView === 'Week') {
      return getWeekRange(currentDate);
    } else {
      return getMonthName(currentDate);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  // ✅ Get status counts for display
  const getStatusCounts = () => {
    const filteredBookings = getFilteredBookings();
    const total = filteredBookings.length;
    
    const counts = {
      upcoming: 0,
      completed: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0
    };
    
    filteredBookings.forEach(booking => {
      const status = getBookingDisplayStatus(booking);
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });
    
    return { ...counts, total };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="calendar-main-container">
      {/* ✅ SIMPLIFIED: Header without actions */}
      <div className="calendar-header-section">
        <div className="calendar-title-area">
          <h1 className="calendar-main-title">Calendar</h1>
          <p className="calendar-subtitle">
            Manage your room bookings and availability
            {!isOnline && <span className="offline-indicator"> (Offline Mode)</span>}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="calendar-controls-section">
        <div className="view-selector-buttons">
          <button 
            className={`view-btn ${currentView === 'Today' ? 'active' : ''}`}
            onClick={goToToday}
          >
            Today
          </button>
          <button 
            className={`view-btn ${currentView === 'Week' ? 'active' : ''}`}
            onClick={() => setCurrentView('Week')}
          >
            Week
          </button>
          <button 
            className={`view-btn ${currentView === 'Month' ? 'active' : ''}`}
            onClick={() => setCurrentView('Month')}
          >
            Month
          </button>
        </div>

        <div className="status-filter-area">
          <div className="filter-container">
            <FiFilter size={14} />
            <select 
              className="status-dropdown"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="navigation-controls">
          <button className="nav-arrow-btn" onClick={goToPrevious}>
            <FiChevronLeft size={20} />
          </button>
          <span className="current-period-title">{getCurrentTitle()}</span>
          <button className="nav-arrow-btn" onClick={goToNext}>
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="calendar-content-area">
        {loading && (
          <div className="calendar-loading">
            <div className="loading-spinner"></div>
            <p>Loading your bookings...</p>
          </div>
        )}
        
        {!loading && (
          <>
            {(currentView === 'Month') && (
              <Month 
                calendarData={getCalendarData()}
                onDateClick={handleDateClick}
              />
            )}
            
            {currentView === 'Week' && (
              <Week 
                weekData={getWeekData()}
                onDateClick={handleDateClick}
              />
            )}
            
            {(currentView === 'Today' || currentView === 'Day') && (
              <Day 
                selectedDate={selectedDate || currentDate}
                bookings={getDayBookings()}
              />
            )}
          </>
        )}
      </div>

      {/* Enhanced Status Legend */}
      <div className="status-legend-section">
        <span className="legend-label">Status Legend:</span>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color upcoming"></div>
            <span>Upcoming ({statusCounts.upcoming})</span>
          </div>
          <div className="legend-item">
            <div className="legend-color completed"></div>
            <span>Completed ({statusCounts.completed})</span>
          </div>
          <div className="legend-item">
            <div className="legend-color pending"></div>
            <span>Pending ({statusCounts.pending})</span>
          </div>
          <div className="legend-item">
            <div className="legend-color rejected"></div>
            <span>Rejected ({statusCounts.rejected})</span>
          </div>
          <div className="legend-item">
            <div className="legend-color cancelled"></div>
            <span>Cancelled ({statusCounts.cancelled})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;