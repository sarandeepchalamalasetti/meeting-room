import React, { useState, useEffect, useCallback } from 'react';
import {
  MdBusiness,
  MdPeople,
  MdLocationOn,
  MdCalendarToday,
  MdAccessTime,
  MdPerson,
  MdEmail,
  MdPhone,
  MdDescription,
  MdSettings,
  MdLocalCafe,
  MdWarning,
  MdStar,
  MdContentCopy,
  MdOpenInNew,
  MdSearch,
  MdFilterList,
  MdVisibility,
  MdEdit,
  MdMessage,
  MdSave,
  MdClose,
  MdTrendingUp,
  MdTrendingDown,
  MdCheckCircle,
  MdCancel,
  MdDateRange
} from 'react-icons/md';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaClock
} from 'react-icons/fa';
import {
  FiRefreshCw
} from 'react-icons/fi';
import './BookingStatus.css';

const getStatusConfig = (status) => {
  switch (status) {
    case 'approved':
      return {
        className: 'bookingstatus-status-approved',
        icon: FaCheckCircle,
        gradient: 'bookingstatus-gradient-approved'
      };
    case 'rejected':
      return {
        className: 'bookingstatus-status-rejected',
        icon: FaTimesCircle,
        gradient: 'bookingstatus-gradient-rejected'
      };
    case 'pending':
      return {
        className: 'bookingstatus-status-pending',
        icon: FaExclamationCircle,
        gradient: 'bookingstatus-gradient-pending'
      };
    case 'cancelled':
      return {
        className: 'bookingstatus-status-rejected',
        icon: FaTimesCircle,
        gradient: 'bookingstatus-gradient-rejected'
      };
    default:
      return {
        className: 'bookingstatus-status-default',
        icon: FaClock,
        gradient: 'bookingstatus-gradient-default'
      };
  }
};

// Custom Components
const Card = ({ children, className = '', onClick }) => (
  <div className={`bookingstatus-card ${className}`} onClick={onClick}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`bookingstatus-card-content ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', className = '', onClick, disabled }) => (
  <button 
    className={`bookingstatus-btn bookingstatus-btn-${variant} bookingstatus-btn-${size} ${className}`} 
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const Badge = ({ children, variant = 'default', className = '' }) => (
  <span className={`bookingstatus-badge bookingstatus-badge-${variant} ${className}`}>
    {children}
  </span>
);

const Input = ({ placeholder, value, onChange, className = '', type = 'text', disabled, id, min, max }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`bookingstatus-input ${className}`}
    disabled={disabled}
    id={id}
    min={min}
    max={max}
  />
);

const Textarea = ({ placeholder, value, onChange, className = '', rows = 3, id }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={`bookingstatus-textarea ${className}`}
    id={id}
  />
);

const Select = ({ value, onChange, children, className = '' }) => (
  <select 
    value={value} 
    onChange={(e) => onChange(e.target.value)}
    className={`bookingstatus-select ${className}`}
  >
    {children}
  </select>
);

const Label = ({ children, htmlFor, className = '' }) => (
  <label htmlFor={htmlFor} className={`bookingstatus-label ${className}`}>
    {children}
  </label>
);

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="bookingstatus-modal-overlay" onClick={onClose}>
      <div className={`bookingstatus-modal-content ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="bookingstatus-modal-header">
          <h2 className="bookingstatus-modal-title">{title}</h2>
          <button className="bookingstatus-modal-close" onClick={onClose}>
            <MdClose />
          </button>
        </div>
        <div className="bookingstatus-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

const Avatar = ({ children, className = '' }) => (
  <div className={`bookingstatus-avatar ${className}`}>
    {children}
  </div>
);

const showToast = (message) => {
  // Simple toast implementation
  const toast = document.createElement('div');
  toast.className = 'bookingstatus-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('bookingstatus-toast-show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('bookingstatus-toast-show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};

const BookingStatus = () => {
  // Get user data from sessionStorage
  const getUserData = () => {
    try {
      const userData = sessionStorage.getItem('user');
      return userData ? JSON.parse(userData) : { 
        role: 'employee',
        name: 'Demo User',
        email: 'demo@example.com',
        id: 'demo-user-id',
        employeeId: 'EI-123'
      };
    } catch (error) {
      return { 
        role: 'employee', 
        name: 'Demo User',
        email: 'demo@example.com',
        id: 'demo-user-id',
        employeeId: 'EI-123'
      };
    }
  };

  const user = getUserData();
  const token = sessionStorage.getItem('token');

  // State management
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Fallback data for offline mode
  const fallbackBookings = [
    {
      id: 1,
      _id: 'mock-1',
      roomName: "Executive Conference Room",
      date: "2025-01-30",
      time: "10:00 AM - 12:00 PM",
      startTime: "10:00",
      endTime: "12:00",
      manager: "John Smith",
      managerEmail: "john.smith@company.com", 
      managerPhone: "+1 (555) 123-4567",
      status: "approved",
      requestDate: "2025-01-28",
      purpose: "Client Presentation Meeting",
      attendees: 8,
      location: "Floor 5, Building A",
      approvedDate: "2025-01-29",
      description: "Important client presentation for Q1 budget approval.",
      equipment: ["Projector", "Whiteboard", "Conference Phone"],
      refreshments: true
    }
  ];

  // Transform backend booking data to match UI format
  const transformBookingData = (backendBooking) => {
    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch (error) {
        return dateString;
      }
    };

    const formatTime = (timeString) => {
      if (!timeString) return '';
      try {
        // Convert 24-hour format to 12-hour format
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      } catch (error) {
        return timeString;
      }
    };

    const managerInfo = backendBooking.managerInfo || {};

    return {
      id: backendBooking._id,
      _id: backendBooking._id,
      roomName: backendBooking.roomName,
      date: backendBooking.date,
      time: `${formatTime(backendBooking.startTime)} - ${formatTime(backendBooking.endTime)}`,
      startTime: backendBooking.startTime,
      endTime: backendBooking.endTime,
      manager: managerInfo.name || 'Unknown Manager',
      managerEmail: managerInfo.email || 'unknown@example.com',
      managerPhone: managerInfo.phone || '+1 (555) 000-0000',
      status: backendBooking.status,
      requestDate: formatDate(backendBooking.createdAt || backendBooking.submittedAt),
      purpose: backendBooking.purpose,
      attendees: backendBooking.attendees,
      location: `Room ${backendBooking.roomName}`,
      approvedDate: backendBooking.approvedAt ? formatDate(backendBooking.approvedAt) : null,
      rejectedDate: backendBooking.rejectedAt ? formatDate(backendBooking.rejectedAt) : null,
      description: backendBooking.description || backendBooking.purpose,
      equipment: backendBooking.equipment || [],
      refreshments: backendBooking.refreshments || false,
      rejectionReason: backendBooking.notes || null
    };
  };

  // Fetch user's bookings from backend
  const fetchUserBookings = useCallback(async (showToastMessage = false) => {
    try {
      setLoading(true);
      
      if (!token || !isOnline) {
        setBookings(fallbackBookings);
        setIsOnline(false);
        if (showToastMessage) {
          showToast('Using offline data');
        }
        return;
      }

      console.log('📋 Fetching user bookings for:', user.email);
      
      const response = await fetch('http://localhost:5000/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const allBookings = await response.json();
        console.log('✅ Fetched all bookings:', allBookings);
        
        // Filter bookings for current user
        const userBookings = allBookings.filter(booking => 
          booking.bookedBy?.email === user.email || 
          booking.bookedBy?.id === user.id ||
          booking.bookedBy?.employeeId === user.employeeId
        );
        
        console.log('✅ User specific bookings:', userBookings);
        
        // Transform backend data to UI format
        const transformedBookings = userBookings.map(transformBookingData);
        setBookings(transformedBookings);
        setIsOnline(true);
        setLastFetchTime(new Date());
        
        if (showToastMessage) {
          showToast('Bookings refreshed successfully!');
        }
      } else {
        throw new Error('Failed to fetch bookings');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch user bookings:', error);
      setBookings(fallbackBookings);
      setIsOnline(false);
      
      if (showToastMessage) {
        showToast('Failed to refresh. Using offline data.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, user.email, user.id, user.employeeId, isOnline]);

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchUserBookings(true);
  };

  // Filter bookings based on status, search, and date
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    const matchesSearch = booking.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || booking.date === selectedDate;
    return matchesStatus && matchesSearch && matchesDate;
  });

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setEditForm({
      roomName: booking.roomName,
      date: booking.date,
      time: booking.startTime,
      endTime: booking.endTime,
      purpose: booking.purpose,
      attendees: booking.attendees,
      description: booking.description,
      refreshments: booking.refreshments
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      
      if (!token || !isOnline) {
        // Mock edit for offline mode
        const updatedBookings = bookings.map(booking => 
          booking.id === editingBooking.id 
            ? {
                ...booking,
                ...editForm,
                time: `${editForm.time} - ${editForm.endTime}`,
                status: 'pending' // Reset to pending when edited
              }
            : booking
        );
        setBookings(updatedBookings);
        setIsEditDialogOpen(false);
        setEditingBooking(null);
        showToast("Booking updated successfully! Resubmitted for approval.");
        return;
      }

      console.log('📝 Updating booking:', editingBooking.id);
      
      const updateData = {
        date: editForm.date,
        startTime: editForm.time,
        endTime: editForm.endTime,
        purpose: editForm.purpose,
        attendees: parseInt(editForm.attendees),
        description: editForm.description,
        refreshments: editForm.refreshments,
        status: 'pending' // Reset to pending when edited
      };
      
      const response = await fetch(`http://localhost:5000/api/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        const updatedBooking = await response.json();
        console.log('✅ Booking updated:', updatedBooking);
        
        // Refresh bookings
        await fetchUserBookings();
        showToast("Booking updated successfully! Resubmitted for approval.");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update booking');
      }
      
    } catch (error) {
      console.error('❌ Failed to update booking:', error);
      showToast(error.message || 'Failed to update booking. Please try again.');
    } finally {
      setLoading(false);
      setIsEditDialogOpen(false);
      setEditingBooking(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setLoading(true);
      
      if (!token || !isOnline) {
        // Mock cancel for offline mode
        const updatedBookings = bookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' }
            : booking
        );
        setBookings(updatedBookings);
        showToast("Booking cancelled successfully!");
        return;
      }

      console.log('❌ Cancelling booking:', bookingId);
      
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      
      if (response.ok) {
        console.log('✅ Booking cancelled');
        await fetchUserBookings();
        showToast("Booking cancelled successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel booking');
      }
      
    } catch (error) {
      console.error('❌ Failed to cancel booking:', error);
      showToast(error.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings on component mount
  useEffect(() => {
    fetchUserBookings();
  }, [fetchUserBookings]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUserBookings();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUserBookings]);

  return (
    <div className="bookingstatus-booking-status-container">
      <div className="bookingstatus-booking-status-wrapper">
        {/* Enhanced Header */}
        <div className="bookingstatus-header-section">
          <div className="bookingstatus-header-content">
            <h1 className="bookingstatus-main-title">My Booking Status</h1>
            <p className="bookingstatus-main-subtitle">
              Track and manage your room booking requests with ease
              {!isOnline && ' (Offline mode - data may not be current)'}
            </p>
          </div>
          
          {/* Single Line Search, Filter, Date and Refresh Section */}
          <div className="bookingstatus-controls-section">
            <div className="bookingstatus-search-container">
              <MdSearch className="bookingstatus-search-icon" />
              <Input
                placeholder="Search bookings, managers, rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bookingstatus-search-input"
              />
            </div>
            
            <div className="bookingstatus-filter-container">
              <MdFilterList className="bookingstatus-filter-icon" />
              <Select value={filterStatus} onChange={setFilterStatus} className="bookingstatus-filter-select">
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="bookingstatus-date-filter-container">
              <MdDateRange className="bookingstatus-date-filter-icon" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bookingstatus-date-filter-input"
                placeholder="Filter by date"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="bookingstatus-clear-date-btn"
                  title="Clear date filter"
                >
                  <MdClose />
                </button>
              )}
            </div>

            {/* Refresh with Timer */}
            <div className="bookingstatus-refresh-with-timer">
              {lastFetchTime && (
                <div className="bookingstatus-last-updated">
                  <span className="bookingstatus-last-updated-text">
                    Last updated: {lastFetchTime.toLocaleTimeString()}
                  </span>
                  <button 
                    onClick={handleManualRefresh}
                    className="bookingstatus-refresh-btn"
                    disabled={loading}
                  >
                    <FiRefreshCw className={`bookingstatus-refresh-icon ${loading ? 'bookingstatus-spinning' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Stats Grid */}
        <div className="bookingstatus-stats-grid">
          <div className="bookingstatus-stats-card">
            <div className="bookingstatus-stats-card-body">
              {/* Line 1: Label */}
              <p className="bookingstatus-stats-label">Total Bookings</p>

              {/* Line 2: Number and Calendar icon */}
              <div className="bookingstatus-stats-row-between">
                <h3 className="bookingstatus-stats-value" style={{ color: '#2563eb', margin: 0 }}>
                  {loading ? '...' : bookings.length}
                </h3>
                <div className="bookingstatus-stats-icon-container bookingstatus-stats-icon-primary">
                  <MdCalendarToday className="bookingstatus-stats-icon" />
                </div>
              </div>

              {/* Line 3: Trend info */}
              <div className="bookingstatus-stats-change">
                <MdTrendingUp className="bookingstatus-trend-icon bookingstatus-trend-up" />
                <span className="bookingstatus-trend-text bookingstatus-trend-positive">
                  {selectedDate ? `On ${selectedDate}` : 'All your requests'}
                </span>
              </div>
            </div>
          </div>

          {/* Approved Card */}
          <div className="bookingstatus-stats-card">
            <div className="bookingstatus-stats-card-body">
              <p className="bookingstatus-stats-label">Approved</p>
              <div className="bookingstatus-stats-row-between">
                <h3 className="bookingstatus-stats-value" style={{ color: '#16a34a', margin: 0 }}>
                  {loading ? '...' : filteredBookings.filter(b => b.status === 'approved').length}
                </h3>
                <div className="bookingstatus-stats-icon-container bookingstatus-stats-icon-success">
                  <MdCheckCircle className="bookingstatus-stats-icon" />
                </div>
              </div>
              <div className="bookingstatus-stats-change">
                <MdTrendingUp className="bookingstatus-trend-icon bookingstatus-trend-up" />
                <span className="bookingstatus-trend-text bookingstatus-trend-positive">Ready to use</span>
              </div>
            </div>
          </div>

          {/* Pending Card */}
          <div className="bookingstatus-stats-card">
            <div className="bookingstatus-stats-card-body">
              <p className="bookingstatus-stats-label">Pending</p>
              <div className="bookingstatus-stats-row-between">
                <h3 className="bookingstatus-stats-value" style={{ color: '#ca8a04', margin: 0 }}>
                  {loading ? '...' : filteredBookings.filter(b => b.status === 'pending').length}
                </h3>
                <div className="bookingstatus-stats-icon-container bookingstatus-stats-icon-warning">
                  <FaClock className="bookingstatus-stats-icon" />
                </div>
              </div>
              <div className="bookingstatus-stats-change">
                <MdTrendingDown className="bookingstatus-trend-icon bookingstatus-trend-down" />
                <span className="bookingstatus-trend-text bookingstatus-trend-negative">Awaiting approval</span>
              </div>
            </div>
          </div>

          {/* Rejected Card */}
          <div className="bookingstatus-stats-card">
            <div className="bookingstatus-stats-card-body">
              <p className="bookingstatus-stats-label">Rejected</p>
              <div className="bookingstatus-stats-row-between">
                <h3 className="bookingstatus-stats-value" style={{ color: '#dc2626', margin: 0 }}>
                  {loading ? '...' : filteredBookings.filter(b => b.status === 'rejected' || b.status === 'cancelled').length}
                </h3>
                <div className="bookingstatus-stats-icon-container bookingstatus-stats-icon-error">
                  <MdCancel className="bookingstatus-stats-icon" />
                </div>
              </div>
              <div className="bookingstatus-stats-change">
                <MdTrendingDown className="bookingstatus-trend-icon bookingstatus-trend-down" />
                <span className="bookingstatus-trend-text bookingstatus-trend-positive">Need revision</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Booking Cards */}
        <div className="bookingstatus-bookings-grid">
          {loading && filteredBookings.length === 0 ? (
            <Card className="bookingstatus-no-results-card">
              <CardContent>
                <div className="bookingstatus-no-results-icon">
                  <FaClock />
                </div>
                <h3 className="bookingstatus-no-results-title">Loading your bookings...</h3>
                <p className="bookingstatus-no-results-text">
                  Please wait while we fetch your booking requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={booking.id} className="bookingstatus-booking-card">
                  <div className={`bookingstatus-booking-card-border ${statusConfig.gradient}`} />
                  <CardContent>
                    <div className="bookingstatus-booking-content">
                      {/* Header */}
                      <div className="bookingstatus-booking-header">
                        <div className="bookingstatus-booking-main-info">
                          <div className="bookingstatus-booking-title-row">
                            <MdBusiness className="bookingstatus-booking-icon" />
                            <h3 className="bookingstatus-booking-title">{booking.roomName}</h3>
                          </div>
                          <p className="bookingstatus-booking-purpose">{booking.purpose}</p>
                        </div>
                        <div className="bookingstatus-booking-badges">
                          <Badge className={statusConfig.className}>
                            <StatusIcon className="bookingstatus-badge-icon" />
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="bookingstatus-booking-details">
                        <div className="bookingstatus-detail-item">
                          <MdCalendarToday className="bookingstatus-detail-icon" />
                          <div className="bookingstatus-detail-content">
                            <p className="bookingstatus-detail-label">Date & Time</p>
                            <p className="bookingstatus-detail-value">{booking.date} • {booking.time}</p>
                          </div>
                        </div>
                        
                        <div className="bookingstatus-detail-item">
                          <MdLocationOn className="bookingstatus-detail-icon" />
                          <div className="bookingstatus-detail-content">
                            <p className="bookingstatus-detail-label">Location</p>
                            <p className="bookingstatus-detail-value">{booking.location}</p>
                          </div>
                        </div>
                        
                        <div className="bookingstatus-detail-row">
                          <div className="bookingstatus-detail-item-small">
                            <MdPeople className="bookingstatus-detail-icon" />
                            <div className="bookingstatus-detail-content">
                              <p className="bookingstatus-detail-label">Attendees</p>
                              <p className="bookingstatus-detail-value">{booking.attendees}</p>
                            </div>
                          </div>
                          
                          <div className="bookingstatus-detail-item-small">
                            <MdPerson className="bookingstatus-detail-icon" />
                            <div className="bookingstatus-detail-content">
                              <p className="bookingstatus-detail-label">Manager</p>
                              <p className="bookingstatus-detail-value">{booking.manager.split(' ')[0]}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {(booking.status === 'rejected' || booking.status === 'cancelled') && booking.rejectionReason && (
                        <div className="bookingstatus-rejection-reason">
                          <div className="bookingstatus-rejection-content">
                            <MdWarning className="bookingstatus-rejection-icon" />
                            <div>
                              <p className="bookingstatus-rejection-title">
                                {booking.status === 'cancelled' ? 'Cancellation Reason' : 'Rejection Reason'}
                              </p>
                              <p className="bookingstatus-rejection-text">{booking.rejectionReason}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="bookingstatus-booking-actions">
                        <div className="bookingstatus-booking-timeline">
                          Requested {booking.requestDate}
                          {booking.approvedDate && ` • Approved ${booking.approvedDate}`}
                          {booking.rejectedDate && ` • Rejected ${booking.rejectedDate}`}
                        </div>
                        <div className="bookingstatus-action-buttons">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewBooking(booking)}
                            className="bookingstatus-view-btn"
                          >
                            <MdVisibility className="bookingstatus-btn-icon" />
                            View Details
                          </Button>
                          {booking.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditBooking(booking)}
                              className="bookingstatus-edit-btn"
                              disabled={loading}
                            >
                              <MdEdit className="bookingstatus-btn-icon" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Enhanced No Results */}
        {!loading && filteredBookings.length === 0 && (
          <Card className="bookingstatus-no-results-card">
            <CardContent>
              <div className="bookingstatus-no-results-icon">
                <MdBusiness />
              </div>
              <h3 className="bookingstatus-no-results-title">No bookings found</h3>
              <p className="bookingstatus-no-results-text">
                {searchTerm || filterStatus !== 'all' || selectedDate
                  ? 'Try adjusting your search, filter criteria, or date to find what you\'re looking for.'
                  : 'You haven\'t made any booking requests yet. Start by creating your first booking.'
                }
              </p>
              {(searchTerm || filterStatus !== 'all' || selectedDate) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setSelectedDate('');
                  }}
                  className="bookingstatus-clear-all-filters-btn"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* View Dialog */}
        <Modal 
          isOpen={isViewDialogOpen} 
          onClose={() => setIsViewDialogOpen(false)}
          title="Booking Details"
          className="bookingstatus-view-modal"
        >
          {selectedBooking && (
            <div className="bookingstatus-view-content">
              {/* Status and Basic Info */}
              <div className="bookingstatus-view-header">
                <div className="bookingstatus-view-status">
                  <Badge className={getStatusConfig(selectedBooking.status).className}>
                    {selectedBooking.status === 'approved' && <FaCheckCircle className="bookingstatus-badge-icon" />}
                    {selectedBooking.status === 'rejected' && <FaTimesCircle className="bookingstatus-badge-icon" />}
                    {selectedBooking.status === 'pending' && <FaExclamationCircle className="bookingstatus-badge-icon" />}
                    {selectedBooking.status === 'cancelled' && <FaTimesCircle className="bookingstatus-badge-icon" />}
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </Badge>
                  <span className="bookingstatus-request-id">Request #{selectedBooking.id?.slice(-6) || 'N/A'}</span>
                </div>
              </div>

              {/* Meeting Information */}
              <div className="bookingstatus-view-grid">
                <div className="bookingstatus-view-left">
                  <div className="bookingstatus-view-section">
                    <h4 className="bookingstatus-section-title">Meeting Details</h4>
                    <div className="bookingstatus-meeting-details">
                      <div className="bookingstatus-meeting-detail">
                        <MdBusiness className="bookingstatus-detail-icon" />
                        <span>{selectedBooking.roomName}</span>
                      </div>
                      <div className="bookingstatus-meeting-detail">
                        <MdCalendarToday className="bookingstatus-detail-icon" />
                        <span>{selectedBooking.date}</span>
                      </div>
                      <div className="bookingstatus-meeting-detail">
                        <MdAccessTime className="bookingstatus-detail-icon" />
                        <span>{selectedBooking.time}</span>
                      </div>
                      <div className="bookingstatus-meeting-detail">
                        <MdLocationOn className="bookingstatus-detail-icon" />
                        <span>{selectedBooking.location}</span>
                      </div>
                      <div className="bookingstatus-meeting-detail">
                        <MdPeople className="bookingstatus-detail-icon" />
                        <span>{selectedBooking.attendees} attendees</span>
                      </div>
                    </div>
                  </div>

                  <div className="bookingstatus-view-section">
                    <h4 className="bookingstatus-section-title">Purpose</h4>
                    <p className="bookingstatus-purpose-text">{selectedBooking.purpose}</p>
                  </div>

                  {selectedBooking.description && (
                    <div className="bookingstatus-view-section">
                      <h4 className="bookingstatus-section-title">Description</h4>
                      <p className="bookingstatus-description-text">{selectedBooking.description}</p>
                    </div>
                  )}
                </div>

                <div className="bookingstatus-view-right">
                  <div className="bookingstatus-view-section">
                    <h4 className="bookingstatus-section-title">Manager</h4>
                    <div className="bookingstatus-manager-info">
                      <div className="bookingstatus-manager-header">
                        <Avatar>
                          {selectedBooking.manager.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <span className="bookingstatus-manager-name">{selectedBooking.manager}</span>
                      </div>
                      <div className="bookingstatus-manager-contact">
                        <div className="bookingstatus-contact-item">
                          <MdEmail className="bookingstatus-contact-icon" />
                          <span className="bookingstatus-contact-text">{selectedBooking.managerEmail}</span>
                        </div>
                        <div className="bookingstatus-contact-item">
                          <MdPhone className="bookingstatus-contact-icon" />
                          <span className="bookingstatus-contact-text">{selectedBooking.managerPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bookingstatus-view-section">
                    <h4 className="bookingstatus-section-title">Timeline</h4>
                    <div className="bookingstatus-timeline">
                      <div className="bookingstatus-timeline-item">
                        <div className="bookingstatus-timeline-dot bookingstatus-blue"></div>
                        Submitted on {selectedBooking.requestDate}
                      </div>
                      {selectedBooking.approvedDate && (
                        <div className="bookingstatus-timeline-item bookingstatus-green">
                          <div className="bookingstatus-timeline-dot bookingstatus-green"></div>
                          Approved on {selectedBooking.approvedDate}
                        </div>
                      )}
                      {selectedBooking.rejectedDate && (
                        <div className="bookingstatus-timeline-item bookingstatus-red">
                          <div className="bookingstatus-timeline-dot bookingstatus-red"></div>
                          Rejected on {selectedBooking.rejectedDate}
                        </div>
                      )}
                    </div>
                  </div>

                  {(selectedBooking.equipment?.length > 0 || selectedBooking.refreshments) && (
                    <div className="bookingstatus-view-section">
                      <h4 className="bookingstatus-section-title">Requirements</h4>
                      <div className="bookingstatus-requirements">
                        {selectedBooking.equipment?.length > 0 && (
                          <div className="bookingstatus-equipment-section">
                            <p className="bookingstatus-requirements-label">Equipment:</p>
                            <div className="bookingstatus-equipment-list">
                              {selectedBooking.equipment.map((item, index) => (
                                <Badge key={index} variant="secondary" className="bookingstatus-equipment-badge">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedBooking.refreshments && (
                          <div className="bookingstatus-refreshments-item">
                            <MdLocalCafe className="bookingstatus-refreshments-icon" />
                            Refreshments included
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason */}
              {(selectedBooking.status === 'rejected' || selectedBooking.status === 'cancelled') && selectedBooking.rejectionReason && (
                <div className="bookingstatus-rejection-section">
                  <div className="bookingstatus-rejection-header">
                    <MdWarning className="bookingstatus-rejection-warning-icon" />
                    <h4 className="bookingstatus-rejection-section-title">
                      {selectedBooking.status === 'cancelled' ? 'Cancellation Reason' : 'Rejection Reason'}
                    </h4>
                  </div>
                  <p className="bookingstatus-rejection-reason-text">{selectedBooking.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="bookingstatus-view-actions">
                <div className="bookingstatus-primary-actions">
                  <Button className="bookingstatus-contact-btn">
                    <MdMessage className="bookingstatus-btn-icon" />
                    Contact Manager
                  </Button>
                  {selectedBooking.status === 'pending' && (
                    <>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          handleEditBooking(selectedBooking);
                        }}
                        className="bookingstatus-edit-request-btn"
                        disabled={loading}
                      >
                        <MdEdit className="bookingstatus-btn-icon" />
                        Edit Request
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleCancelBooking(selectedBooking.id)}
                        className="bookingstatus-cancel-btn"
                        disabled={loading}
                      >
                        <MdClose className="bookingstatus-btn-icon" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
                <div className="bookingstatus-secondary-actions">
                  <Button variant="ghost" size="sm" className="bookingstatus-copy-btn">
                    <MdContentCopy className="bookingstatus-btn-icon" />
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" className="bookingstatus-share-btn">
                    <MdOpenInNew className="bookingstatus-btn-icon" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Dialog */}
        <Modal 
          isOpen={isEditDialogOpen} 
          onClose={() => setIsEditDialogOpen(false)}
          title="Edit Booking Request"
          className="bookingstatus-edit-modal"
        >
          {editingBooking && (
            <div className="bookingstatus-edit-content">
              <p className="bookingstatus-edit-description">
                Modify your meeting room booking request details. Changes will be resubmitted for approval.
              </p>
              
              <div className="bookingstatus-edit-form">
                <div className="bookingstatus-form-row">
                  <div className="bookingstatus-form-group">
                    <Label htmlFor="roomName">Room Name</Label>
                    <Input
                      id="roomName"
                      value={editForm.roomName || ''}
                      onChange={(e) => setEditForm({...editForm, roomName: e.target.value})}
                      disabled
                      className="bookingstatus-disabled-input"
                    />
                  </div>
                  <div className="bookingstatus-form-group">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={editForm.date || ''}
                      onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="bookingstatus-form-row">
                  <div className="bookingstatus-form-group">
                    <Label htmlFor="time">Start Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={editForm.time || ''}
                      onChange={(e) => setEditForm({...editForm, time: e.target.value})}
                    />
                  </div>
                  <div className="bookingstatus-form-group">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={editForm.endTime || ''}
                      onChange={(e) => setEditForm({...editForm, endTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="bookingstatus-form-row">
                  <div className="bookingstatus-form-group">
                    <Label htmlFor="attendees">Number of Attendees</Label>
                    <Input
                      id="attendees"
                      type="number"
                      min="1"
                      max="50"
                      value={editForm.attendees || ''}
                      onChange={(e) => setEditForm({...editForm, attendees: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="bookingstatus-form-group">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    id="purpose"
                    value={editForm.purpose || ''}
                    onChange={(e) => setEditForm({...editForm, purpose: e.target.value})}
                    placeholder="Brief purpose of the meeting"
                  />
                </div>

                <div className="bookingstatus-form-group">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    placeholder="Detailed description of the meeting requirements"
                    rows={4}
                  />
                </div>

                <div className="bookingstatus-form-actions">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)} 
                    className="bookingstatus-cancel-edit-btn"
                    disabled={loading}
                  >
                    <MdClose className="bookingstatus-btn-icon" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveEdit} 
                    className="bookingstatus-save-btn"
                    disabled={loading}
                  >
                    <MdSave className="bookingstatus-btn-icon" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default BookingStatus;