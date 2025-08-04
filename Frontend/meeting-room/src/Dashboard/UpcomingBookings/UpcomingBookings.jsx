import React, { useState, useEffect } from 'react';
import { 
  FaEye, 
  FaClock, 
  FaUser, 
  FaMapMarkerAlt, 
  FaTimes, 
  FaPlay, 
  FaCheck, 
  FaBan,
  FaHourglassHalf,
  FaExclamationTriangle
} from 'react-icons/fa';
import './UpcomingBookings.css';

const UpcomingBookings = ({ selectedPeriod, selectedDate, filterDateRange, activeFilter }) => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [userRole, setUserRole] = useState('employee');

  const token = sessionStorage.getItem('token');

  // ✅ ENHANCED: Fetch upcoming bookings with filter parameters
  const fetchUpcomingBookings = async () => {
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('📅 UpcomingBookings: Fetching with filter:', {
        period: selectedPeriod,
        date: selectedDate,
        dateRange: filterDateRange,
        activeFilter
      });

      // ✅ NEW: Build query parameters based on active filter
      const queryParams = new URLSearchParams();
      
      if (activeFilter === 'date' && selectedDate) {
        queryParams.append('startDate', filterDateRange.startDate);
        queryParams.append('endDate', filterDateRange.endDate);
        queryParams.append('filterType', 'custom_date');
      } else if (activeFilter === 'period') {
        queryParams.append('startDate', filterDateRange.startDate);
        queryParams.append('endDate', filterDateRange.endDate);
        queryParams.append('filterType', filterDateRange.type);
      }

      const response = await fetch(`http://localhost:5000/api/bookings/upcoming?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📅 UpcomingBookings: Response:', data);

      if (data.success && data.data) {
        setUpcomingBookings(data.data);
        setUserRole(data.userRole || 'employee');
        console.log('✅ UpcomingBookings: Loaded:', data.data.length, 'bookings');
      } else {
        setError(data.message || 'Failed to load upcoming bookings');
      }
    } catch (error) {
      console.error('❌ UpcomingBookings: Error fetching:', error);
      setError('Failed to load upcoming bookings');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ENHANCED: Fetch data when filters change
  useEffect(() => {
    if (filterDateRange.startDate && filterDateRange.endDate) {
      console.log('📅 UpcomingBookings: Filter changed, fetching new data');
      fetchUpcomingBookings();
    }
  }, [filterDateRange, activeFilter, token]);

  // ✅ NEW: Reset bookings at midnight for current day view
  useEffect(() => {
    const checkForMidnightReset = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      // If it's exactly midnight (00:00) and we're showing "Today" or current date
      if (currentTime === 0) {
        const today = now.toISOString().split('T')[0];
        const isShowingToday = (
          (activeFilter === 'period' && selectedPeriod === 'Today') ||
          (activeFilter === 'date' && selectedDate === today)
        );
        
        if (isShowingToday) {
          console.log('🕛 UpcomingBookings: Midnight reset - clearing current day bookings');
          setUpcomingBookings([]);
          // Fetch fresh data for the new day
          setTimeout(() => fetchUpcomingBookings(), 1000);
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkForMidnightReset, 60000);
    return () => clearInterval(interval);
  }, [selectedPeriod, selectedDate, activeFilter]);

  // Auto-refresh every 1 minute
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      console.log('🔄 UpcomingBookings: Auto-refreshing...');
      fetchUpcomingBookings();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [token, filterDateRange, activeFilter]);

  // ✅ Enhanced status badge class with new statuses
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'confirmed':
      case 'upcoming':
        return 'upcomingbooking-status-upcoming';
      case 'in progress':
        return 'upcomingbooking-status-inprogress';
      case 'completed':
        return 'upcomingbooking-status-completed';
      case 'pending':
        return 'upcomingbooking-status-pending';
      case 'rejected':
        return 'upcomingbooking-status-rejected';
      case 'cancelled':
        return 'upcomingbooking-status-cancelled';
      default:
        return 'upcomingbooking-status-pending';
    }
  };

  // ✅ Get status icon using react-icons
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return <FaPlay className="upcomingbooking-status-icon" />;
      case 'completed':
        return <FaCheck className="upcomingbooking-status-icon" />;
      case 'cancelled':
        return <FaBan className="upcomingbooking-status-icon" />;
      case 'pending':
        return <FaHourglassHalf className="upcomingbooking-status-icon" />;
      case 'rejected':
        return <FaExclamationTriangle className="upcomingbooking-status-icon" />;
      default:
        return <FaClock className="upcomingbooking-status-icon" />;
    }
  };

  // Format time for display
  const formatTime = (timeStr) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return timeStr;
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short'
        });
      }
    } catch (error) {
      return dateStr;
    }
  };

  // ✅ Handle eye icon click with proper tooltip positioning
  const handleEyeClick = (booking, event) => {
    event.stopPropagation();
    
    const rect = event.target.getBoundingClientRect();
    const tooltipWidth = 300;
    const tooltipHeight = 280;
    
    const tooltipX = rect.left + window.scrollX - (tooltipWidth / 2) + (rect.width / 2);
    const tooltipY = rect.top + window.scrollY - tooltipHeight - 10;
    
    const maxX = window.innerWidth - tooltipWidth - 20;
    const minX = 20;
    const finalX = Math.max(minX, Math.min(maxX, tooltipX));
    
    const finalY = tooltipY < 20 ? rect.bottom + window.scrollY + 10 : tooltipY;

    console.log('👁️ Tooltip positioning:', {
      eyeIcon: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
      tooltip: { x: finalX, y: finalY },
      viewport: { width: window.innerWidth, height: window.innerHeight }
    });

    setTooltipPosition({ x: finalX, y: finalY });
    setSelectedBooking(booking);
  };

  // Close tooltip
  const closeTooltip = () => {
    setSelectedBooking(null);
  };

  // Handle click outside tooltip
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedBooking && !event.target.closest('.upcomingbooking-tooltip')) {
        closeTooltip();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedBooking]);

  // ✅ Check if we should show empty state or bookings list
  const isEmpty = !loading && !error && upcomingBookings.length === 0;
  const hasBookings = !loading && !error && upcomingBookings.length > 0;

  // ✅ Generate filter label for display
  const getFilterLabel = () => {
    if (activeFilter === 'date' && selectedDate) {
      return `for ${new Date(selectedDate).toLocaleDateString()}`;
    }
    return `for ${selectedPeriod}`;
  };

  return (
    <div className="upcomingbooking-card">
      <div className="upcomingbooking-header">
        <h3 className="upcomingbooking-title">
          <FaClock className="upcomingbooking-header-icon" />
          Upcoming Bookings {getFilterLabel()}
        </h3>
      </div>
      <div className={`upcomingbooking-body ${isEmpty ? 'upcomingbooking-body-centered' : 'upcomingbooking-body-top'}`}>
        {loading ? (
          // Loading skeleton
          <div className="upcomingbooking-list">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="upcomingbooking-item upcomingbooking-loading">
                <div className="upcomingbooking-content">
                  <div className="upcomingbooking-details">
                    <h4 className="upcomingbooking-room upcomingbooking-skeleton">Loading...</h4>
                    <p className="upcomingbooking-time upcomingbooking-skeleton">Loading...</p>
                  </div>
                </div>
                <div className="upcomingbooking-actions">
                  <div className="upcomingbooking-eye-placeholder upcomingbooking-skeleton"></div>
                </div>
                <div className="upcomingbooking-status-container">
                  <span className="upcomingbooking-status-badge upcomingbooking-skeleton">Loading</span>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="upcomingbooking-error">
            <p className="upcomingbooking-error-message">Error: {error}</p>
            <button onClick={fetchUpcomingBookings} className="upcomingbooking-retry-button">
              Retry
            </button>
          </div>
        ) : isEmpty ? (
          // Empty state - will be centered by upcomingbooking-body-centered
          <div className="upcomingbooking-empty">
            <div className="upcomingbooking-empty-icon">
              <FaClock />
            </div>
            <p className="upcomingbooking-empty-message">No bookings found {getFilterLabel()}</p>
            <p className="upcomingbooking-empty-submessage">Your bookings for this period will appear here</p>
          </div>
        ) : (
          // Bookings list - will start from top by upcomingbooking-body-top
          <div className="upcomingbooking-list">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className={`upcomingbooking-item ${booking.statusType || ''}`}>
                <div className="upcomingbooking-content">
                  <div className="upcomingbooking-details">
                    <h4 className="upcomingbooking-room">{booking.roomName}</h4>
                    <p className="upcomingbooking-time">
                      {formatDate(booking.date)} • {formatTime(booking.startTime)}
                      {booking.timeUntil && (
                        <span className={`upcomingbooking-time-until ${booking.status === 'in progress' ? 'upcomingbooking-in-progress' : ''}`}>
                          {booking.status === 'in progress' ? ` • ${booking.timeUntil}` : ` • in ${booking.timeUntil}`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="upcomingbooking-actions">
                  <button 
                    className="upcomingbooking-eye-button"
                    onClick={(e) => handleEyeClick(booking, e)}
                    title="View booking details"
                  >
                    <FaEye />
                  </button>
                </div>
                <div className="upcomingbooking-status-container">
                  <span className={`upcomingbooking-status-badge ${getStatusBadgeClass(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced dark tooltip positioned ABOVE the eye icon */}
      {selectedBooking && (
        <div 
          className="upcomingbooking-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            zIndex: 1000
          }}
        >
          <div className="upcomingbooking-tooltip-header">
            <h4 className="upcomingbooking-tooltip-title">Booking Details</h4>
            <button className="upcomingbooking-tooltip-close" onClick={closeTooltip}>
              <FaTimes />
            </button>
          </div>
          <div className="upcomingbooking-tooltip-content">
            <div className="upcomingbooking-tooltip-row">
              <span className="upcomingbooking-tooltip-label">Booked by:</span>
              <span className="upcomingbooking-tooltip-value">{selectedBooking.bookedBy?.name || 'Unknown'}</span>
            </div>
            <div className="upcomingbooking-tooltip-row">
              <span className="upcomingbooking-tooltip-label">Date:</span>
              <span className="upcomingbooking-tooltip-value">{formatDate(selectedBooking.date)}</span>
            </div>
            <div className="upcomingbooking-tooltip-row">
              <span className="upcomingbooking-tooltip-label">Duration:</span>
              <span className="upcomingbooking-tooltip-value">
                {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
              </span>
            </div>
            <div className="upcomingbooking-tooltip-row">
              <span className="upcomingbooking-tooltip-label">Attendees:</span>
              <span className="upcomingbooking-tooltip-value">{selectedBooking.attendees} people</span>
            </div>
            <div className="upcomingbooking-tooltip-row">
              <span className="upcomingbooking-tooltip-label">Purpose:</span>
              <span className="upcomingbooking-tooltip-value">{selectedBooking.purpose}</span>
            </div>
            <div className="upcomingbooking-tooltip-row">
              <span className="upcomingbooking-tooltip-label">Location:</span>
              <span className="upcomingbooking-tooltip-value">
                {selectedBooking.roomName} • Floor {selectedBooking.floor || '2'} • Wing {selectedBooking.wing || 'A'}
              </span>
            </div>
            {selectedBooking.rejectionReason && (
              <div className="upcomingbooking-tooltip-row upcomingbooking-rejection">
                <span className="upcomingbooking-tooltip-label">Reason:</span>
                <span className="upcomingbooking-tooltip-value">{selectedBooking.rejectionReason}</span>
              </div>
            )}
            {selectedBooking.timeUntil && selectedBooking.status !== 'completed' && (
              <div className={`upcomingbooking-tooltip-row upcomingbooking-time-info ${selectedBooking.status === 'in progress' ? 'upcomingbooking-in-progress' : ''}`}>
                <span className="upcomingbooking-tooltip-label">
                  {selectedBooking.status === 'in progress' ? 'Time left:' : 'Starts in:'}
                </span>
                <span className="upcomingbooking-tooltip-value upcomingbooking-highlight">{selectedBooking.timeUntil}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tooltip backdrop */}
      {selectedBooking && (
        <div className="upcomingbooking-tooltip-backdrop" onClick={closeTooltip}></div>
      )}
    </div>
  );
};

export default UpcomingBookings;