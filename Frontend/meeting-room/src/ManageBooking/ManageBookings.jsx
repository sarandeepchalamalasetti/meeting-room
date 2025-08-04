import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageBookings.css';
import EditBookingModal from './EditBookingModal/EditBookingModal'; // Fixed: Removed .jsx extension
import { 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaSearch, 
  FaFilter, 
  FaEdit, 
  FaTimes,
  FaSyncAlt, 
  FaExclamationTriangle
} from 'react-icons/fa';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Edit booking modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Get user data and token
  const getUserData = () => {
    try {
      const userData = sessionStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const user = getUserData();
  const token = sessionStorage.getItem('token');



  // Fetch user's bookings from backend
  const fetchBookings = async (showRefreshMessage = false) => {
    try {
      if (showRefreshMessage) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      console.log('📋 Fetching manage bookings...');
      console.log('📋 Token:', token ? 'Present' : 'Missing');
      console.log('📋 User data:', user);
      
      if (!token) {
        setError('Please login to view your bookings');
        setBookings([]);
        setFilteredBookings([]);
        return;
      }

      // Try the manage endpoint first - your backend has this endpoint
      const response = await axios.get(`${API_BASE_URL}/bookings/manage`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('📋 Raw bookings response:', response.data);
      
      // The backend already transforms the data, so use it directly
      setBookings(response.data);
      setFilteredBookings(response.data);
      
      if (showRefreshMessage) {
        console.log('✅ Bookings refreshed successfully');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch bookings:', error);
      
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view this data.');
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to load bookings. Please try again.');
      }
      
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId, reason = '') => {
    try {
      if (!token) {
        alert('Authentication required');
        return;
      }

      const confirmCancel = window.confirm('Are you sure you want to cancel this booking?');
      if (!confirmCancel) return;

      console.log('❌ Cancelling booking:', bookingId);

      // Use the cancel endpoint that exists in your backend
      await axios.patch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        reason: reason
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Booking cancelled successfully');
      
      // Refresh bookings list
      fetchBookings();
      
      alert('Booking cancelled successfully!');
      
    } catch (error) {
      console.error('❌ Failed to cancel booking:', error);
      
      if (error.response?.status === 404) {
        alert('Booking not found');
      } else if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        alert('You do not have permission to cancel this booking');
      } else {
        alert('Failed to cancel booking. Please try again.');
      }
    }
  };

  // Handle edit booking
  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setIsEditModalOpen(true);
  };

  // Handle edit booking save
  const handleEditBookingSave = (updatedBooking) => {
    console.log('💾 Booking updated:', updatedBooking);
    fetchBookings(); // Refresh the list
    setIsEditModalOpen(false);
    setEditingBooking(null);
  };

  // Handle edit booking cancel
  const handleEditBookingCancel = () => {
    setIsEditModalOpen(false);
    setEditingBooking(null);
  };

  // Filter bookings based on search and filters
  useEffect(() => {
    let filtered = [...bookings];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(booking => 
        booking.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.room?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.organizer?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    if (selectedDate) {
      const selectedDateStr = selectedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(/,/g, '');
      
      filtered = filtered.filter(booking => booking.date === selectedDateStr);
    }

    // Status filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(booking => booking.status === activeTab);
    }

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, selectedDate, activeTab]);

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  // Group bookings by status for tab counts
  const groupedBookings = {
    all: filteredBookings,
    confirmed: filteredBookings.filter(b => b.status === 'confirmed'),
    pending: filteredBookings.filter(b => b.status === 'pending'),
    approved: filteredBookings.filter(b => b.status === 'approved'),
    rejected: filteredBookings.filter(b => b.status === 'rejected'),
    cancelled: filteredBookings.filter(b => b.status === 'cancelled')
  };

  const statusCounts = {
    all: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  // Simple calendar component
  const SimpleCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="managebookings-calendar-day managebookings-empty"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected = selectedDate && 
        date.toDateString() === selectedDate.toDateString();
      
      days.push(
        <div
          key={day}
          className={`managebookings-calendar-day ${isSelected ? 'managebookings-selected' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="managebookings-calendar">
        <div className="managebookings-calendar-header">
          {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <div className="managebookings-calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="managebookings-calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="managebookings-calendar-grid">
          {days}
        </div>
      </div>
    );
  };

  // Booking card component
  const BookingCard = ({ booking }) => (
    <div className="managebookings-booking-card">
      <div className="managebookings-booking-card-content">
        <div className="managebookings-booking-header">
          <div className="managebookings-booking-info">
            <div className="managebookings-booking-title-section">
              <div className="managebookings-booking-icon">
                <FaCalendarAlt className="managebookings-icon" />
              </div>
              <div className="managebookings-title-and-status">
                <h3 className="managebookings-booking-title">{booking.title}</h3>
                <span className={`managebookings-status-badge managebookings-${booking.status}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="managebookings-booking-details-grid">
              <div className="managebookings-detail-item">
                <FaCalendarAlt className="managebookings-detail-icon managebookings-blue" />
                <div className="managebookings-detail-content">
                  <div className="managebookings-detail-label">Date</div>
                  <div className="managebookings-detail-value">{booking.date}</div>
                </div>
              </div>
              
              <div className="managebookings-detail-item">
                <FaClock className="managebookings-detail-icon managebookings-green" />
                <div className="managebookings-detail-content">
                  <div className="managebookings-detail-label">Time</div>
                  <div className="managebookings-detail-value">{booking.startTime}-{booking.endTime}</div>
                </div>
              </div>
              
              <div className="managebookings-detail-item">
                <FaMapMarkerAlt className="managebookings-detail-icon managebookings-purple" />
                <div className="managebookings-detail-content">
                  <div className="managebookings-detail-label">Room</div>
                  <div className="managebookings-detail-value">{booking.room}</div>
                </div>
              </div>
              
              <div className="managebookings-detail-item">
                <FaUsers className="managebookings-detail-icon managebookings-orange" />
                <div className="managebookings-detail-content">
                  <div className="managebookings-detail-label">Attendees</div>
                  <div className="managebookings-detail-value">{booking.attendees}</div>
                </div>
              </div>
            </div>

            {booking.description && (
              <div className="managebookings-description-item">
                <div className="managebookings-description-icon">
                  <div className="managebookings-description-dot"></div>
                </div>
                <div className="managebookings-description-content">
                  <div className="managebookings-detail-label">Description</div>
                  <div className="managebookings-detail-value">{booking.description}</div>
                </div>
              </div>
            )}

            {booking.rejectionReason && (
              <div className="managebookings-rejection-reason">
                <FaExclamationTriangle className="managebookings-warning-icon" />
                <div className="managebookings-rejection-text">
                  <strong>Rejection Reason:</strong> {booking.rejectionReason}
                </div>
              </div>
            )}
          </div>

          <div className="managebookings-booking-actions">
            <button 
              className="managebookings-action-btn managebookings-edit-btn"
              onClick={() => handleEditBooking(booking)}
              disabled={booking.status === 'cancelled'}
            >
              <FaEdit className="managebookings-btn-icon" />
              Edit
            </button>
            <button 
              className="managebookings-action-btn managebookings-cancel-btn"
              onClick={() => handleCancelBooking(booking.id)}
              disabled={booking.status === 'cancelled'}
            >
              <FaTimes className="managebookings-btn-icon" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="managebookings-manage-bookings-container">
        <div className="managebookings-loading-state">
          <FaSyncAlt className="managebookings-loading-icon" />
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="managebookings-manage-bookings-container">
        <div className="managebookings-error-state">
          <FaExclamationTriangle className="managebookings-error-icon" />
          <h3>Error Loading Bookings</h3>
          <p>{error}</p>
          <button 
            className="managebookings-retry-btn"
            onClick={() => fetchBookings()}
          >
            <FaSyncAlt className="managebookings-btn-icon" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="managebookings-manage-bookings-container">
      <div className="managebookings-header-section">
        <div className="managebookings-header-content">
          <div className="managebookings-header-text">
            <h1 className="managebookings-main-title">Manage Bookings</h1>
            <p className="managebookings-subtitle">
              View and manage your meeting room bookings
              {user && ` - ${user.name || user.username || 'User'}`}
            </p>
          </div>
          <button 
            className="managebookings-refresh-btn"
            onClick={() => fetchBookings(true)}
            disabled={refreshing}
          >
            <FaSyncAlt className={`managebookings-btn-icon ${refreshing ? 'managebookings-spinning' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="managebookings-search-filter-section">
        <div className="managebookings-search-container">
          <FaSearch className="managebookings-search-icon" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="managebookings-search-input"
          />
        </div>
        
        <div className="managebookings-filter-container">
          <button 
            className="managebookings-filter-btn" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <FaFilter className="managebookings-btn-icon" />
            Filter
            {selectedDate && <span className="managebookings-filter-badge">1</span>}
          </button>
          
          {isFilterOpen && (
            <div className="managebookings-filter-dropdown">
              <div className="managebookings-filter-content">
                <div className="managebookings-filter-section">
                  <h4 className="managebookings-filter-title">Filter by Date</h4>
                  <SimpleCalendar />
                </div>
                <div className="managebookings-filter-actions">
                  <button 
                    className="managebookings-filter-action-btn managebookings-clear-btn"
                    onClick={() => {
                      setSelectedDate(null);
                      setIsFilterOpen(false);
                    }}
                  >
                    Clear
                  </button>
                  <button 
                    className="managebookings-filter-action-btn managebookings-apply-btn"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {selectedDate && (
        <div className="managebookings-active-filters">
          <span className="managebookings-active-filters-label">Active filters:</span>
          <div className="managebookings-active-filter-badge">
            <FaCalendarAlt className="managebookings-filter-badge-icon" />
            {selectedDate.toLocaleDateString()}
            <button 
              onClick={() => setSelectedDate(null)}
              className="managebookings-remove-filter-btn"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="managebookings-tabs-container">
        <div className="managebookings-tabs-list">
          {[
            { key: 'all', label: 'All' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`managebookings-tab-trigger ${activeTab === tab.key ? 'managebookings-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="managebookings-tab-label">{tab.label}</span>
              {statusCounts[tab.key] > 0 && (
                <span className="managebookings-tab-count">{statusCounts[tab.key]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="managebookings-tab-content">
          {groupedBookings[activeTab].length > 0 ? (
            <div className="managebookings-bookings-list">
              {groupedBookings[activeTab].map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="managebookings-empty-state">
              <p className="managebookings-empty-message">
                No {activeTab === 'all' ? '' : activeTab} bookings found
                {selectedDate && ' for the selected date'}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Booking Modal */}
      {isEditModalOpen && editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          isOpen={isEditModalOpen}
          onSave={handleEditBookingSave}
          onCancel={handleEditBookingCancel}
        />
      )}
    </div>
  );
};

export default ManageBookings;