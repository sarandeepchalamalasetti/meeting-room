import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaClock, 
  FaMapMarkerAlt, 
  FaUser, 
  FaCalendarAlt,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaSearch,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaDownload,
  FaTh,
  FaChartLine,
  FaHourglassHalf,
  FaCheck,
  FaTimes,
  FaStar,
  FaListUl,
  FaFileAlt,
  FaEye,
  FaCog,
  FaExclamationCircle,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import './Approval.css'

// Custom Card Components
const Card = ({ children, className = "", onClick, ...props }) => (
  <div 
    className={`approve-card ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
);

const CardContent = ({ children, className = "", ...props }) => (
  <div className={`approve-card-content ${className}`} {...props}>
    {children}
  </div>
);

// Custom Button Component
const Button = ({ 
  children, 
  className = "", 
  variant = "default", 
  size = "default", 
  onClick,
  disabled = false,
  ...props 
}) => {
  return (
    <button
      className={`approve-button approve-button-${variant} approve-button-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Custom Badge Component
const Badge = ({ children, className = "", variant = "default", ...props }) => {
  return (
    <div className={`approve-badge approve-badge-${variant} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Custom Avatar Components
const Avatar = ({ children, className = "", ...props }) => (
  <div className={`approve-avatar ${className}`} {...props}>
    {children}
  </div>
);

const AvatarFallback = ({ children, className = "", ...props }) => (
  <div className={`approve-avatar-fallback ${className}`} {...props}>
    {children}
  </div>
);

// Custom Input Component
const Input = ({ className = "", type = "text", ...props }) => (
  <input
    type={type}
    className={`approve-input ${className}`}
    {...props}
  />
);

// Custom Separator Component
const Separator = ({ className = "", ...props }) => (
  <div className={`approve-separator ${className}`} {...props} />
);

export default function Approval() {
  // Get user data from sessionStorage
  const getUserData = () => {
    try {
      const userData = sessionStorage.getItem('user');
      return userData ? JSON.parse(userData) : { 
        role: 'manager',
        name: 'Demo Manager',
        email: 'manager@example.com',
        id: 'demo-manager-id',
        employeeId: 'EI-850'
      };
    } catch (error) {
      return { 
        role: 'manager', 
        name: 'Demo Manager',
        email: 'manager@example.com',
        id: 'demo-manager-id',
        employeeId: 'EI-850'
      };
    }
  };

  const user = getUserData();
  const token = sessionStorage.getItem('token');

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // State management
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [showAllDates, setShowAllDates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastClearDate, setLastClearDate] = useState(getTodayDate());

  // Transform backend booking data to match UI format
  const transformBookingData = (backendBooking) => {
    return {
      id: backendBooking._id,
      _id: backendBooking._id,
      requester: {
        name: backendBooking.bookedBy?.name || 'Unknown User',
        email: backendBooking.bookedBy?.email || 'unknown@example.com',
        avatar: "/api/placeholder/32/32",
        department: backendBooking.bookedBy?.department || 'Unknown',
        role: backendBooking.bookedBy?.role || 'Employee',
        phone: backendBooking.bookedBy?.phone || '+1 (555) 0000'
      },
      room: backendBooking.roomName,
      roomName: backendBooking.roomName,
      date: backendBooking.date,
      time: `${backendBooking.startTime} - ${backendBooking.endTime}`,
      startTime: backendBooking.startTime,
      endTime: backendBooking.endTime,
      purpose: backendBooking.purpose,
      description: backendBooking.description || backendBooking.purpose,
      attendees: backendBooking.attendees,
      priority: backendBooking.priority || 'medium',
      status: backendBooking.status,
      equipment: backendBooking.equipment || [],
      submittedAt: formatDateTime(backendBooking.submittedAt || backendBooking.createdAt),
      urgency: backendBooking.urgency || 'normal',
      score: backendBooking.score || 75,
      estimatedCost: backendBooking.estimatedCost || '$50',
      approvedBy: backendBooking.approvedBy,
      approvedAt: formatDateTime(backendBooking.approvedAt),
      notes: backendBooking.notes || '',
      attachments: backendBooking.attachments || [],
      createdAt: backendBooking.createdAt || backendBooking.submittedAt
    };
  };

  // Format date and time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '');
    } catch (error) {
      return dateString;
    }
  };

  // Sort bookings with latest on top
  const sortBookingsByLatest = (bookingsArray) => {
    return bookingsArray.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.submittedAt);
      const dateB = new Date(b.createdAt || b.submittedAt);
      return dateB - dateA; // Latest first
    });
  };

  // Check if it's past midnight and clear data if needed
  const checkAndClearMidnightData = () => {
    const currentDate = getTodayDate();
    const storedClearDate = localStorage.getItem('lastClearDate');
    
    if (!storedClearDate || storedClearDate !== currentDate) {
      // It's a new day, clear the bookings data
      setBookings([]);
      localStorage.setItem('lastClearDate', currentDate);
      setLastClearDate(currentDate);
      console.log('🌙 Midnight data clear - New day started');
    }
  };

  // Fetch bookings that need approval for current manager
  const fetchBookings = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      
      // Check for midnight data clearing first
      checkAndClearMidnightData();
      
      if (!token || !isOnline) {
        setIsOnline(false);
        return;
      }

      console.log('📋 Fetching approval requests for manager:', user.employeeId || user.id);
      
      const response = await fetch(`http://localhost:5000/api/bookings/approvals/${user.employeeId || user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const bookingsData = await response.json();
        console.log('✅ Fetched approval requests:', bookingsData);
        
        // Transform backend data to UI format and sort by latest
        const transformedBookings = sortBookingsByLatest(bookingsData.map(transformBookingData));
        setBookings(transformedBookings);
        setIsOnline(true);
      } else {
        throw new Error('Failed to fetch approval requests');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch approval requests:', error);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, [token, isOnline, user.employeeId, user.id]);

  // Handle approval action
  const handleApprove = async (bookingId) => {
    try {
      setLoading(true);
      
      if (!token || !isOnline) {
        // Mock approval for offline mode
        setBookings(prev => {
          const updated = prev.map(booking => 
            booking.id === bookingId 
              ? { 
                  ...booking, 
                  status: 'approved', 
                  approvedBy: user.name,
                  approvedAt: formatDateTime(new Date().toISOString())
                }
              : booking
          );
          return sortBookingsByLatest(updated);
        });
        
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(prev => ({
            ...prev,
            status: 'approved',
            approvedBy: user.name,
            approvedAt: formatDateTime(new Date().toISOString())
          }));
        }
        
        console.log('Booking approved successfully! (Offline mode)');
        return;
      }

      console.log('✅ Approving booking:', bookingId);
      
      const response = await fetch(`http://localhost:5000/api/bookings/approve/${bookingId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvedBy: user.name,
          approverId: user.employeeId || user.id,
          notes: 'Approved by manager'
        })
      });
      
      if (response.ok) {
        const updatedBooking = await response.json();
        console.log('✅ Booking approved:', updatedBooking);
        
        // Transform and update local state with sorting
        const transformedBooking = transformBookingData(updatedBooking);
        setBookings(prev => {
          const updated = prev.map(booking => 
            booking.id === bookingId ? transformedBooking : booking
          );
          return sortBookingsByLatest(updated);
        });
        
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(transformedBooking);
        }
        
        console.log('Booking approved successfully!');
        
        // Refresh bookings after a short delay
        setTimeout(() => {
          fetchBookings();
        }, 1000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve booking');
      }
      
    } catch (error) {
      console.error('❌ Failed to approve booking:', error);
      console.error(error.message || 'Failed to approve booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle rejection action
  const handleReject = async (bookingId, reason = "No reason provided") => {
    try {
      setLoading(true);
      
      if (!token || !isOnline) {
        // Mock rejection for offline mode
        setBookings(prev => {
          const updated = prev.map(booking => 
            booking.id === bookingId 
              ? { 
                  ...booking, 
                  status: 'rejected', 
                  approvedBy: user.name,
                  approvedAt: formatDateTime(new Date().toISOString()),
                  notes: reason
                }
              : booking
          );
          return sortBookingsByLatest(updated);
        });
        
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(prev => ({
            ...prev,
            status: 'rejected',
            approvedBy: user.name,
            approvedAt: formatDateTime(new Date().toISOString()),
            notes: reason
          }));
        }
        
        console.log('Booking rejected successfully! (Offline mode)');
        return;
      }

      console.log('❌ Rejecting booking:', bookingId, 'Reason:', reason);
      
      const response = await fetch(`http://localhost:5000/api/bookings/reject/${bookingId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejectedBy: user.name,
          rejecterId: user.employeeId || user.id,
          notes: reason
        })
      });
      
      if (response.ok) {
        const updatedBooking = await response.json();
        console.log('❌ Booking rejected:', updatedBooking);
        
        // Transform and update local state with sorting
        const transformedBooking = transformBookingData(updatedBooking);
        setBookings(prev => {
          const updated = prev.map(booking => 
            booking.id === bookingId ? transformedBooking : booking
          );
          return sortBookingsByLatest(updated);
        });
        
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(transformedBooking);
        }
        
        console.log('Booking rejected successfully!');
        
        // Refresh bookings after a short delay
        setTimeout(() => {
          fetchBookings();
        }, 1000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject booking');
      }
      
    } catch (error) {
      console.error('❌ Failed to reject booking:', error);
      console.error(error.message || 'Failed to reject booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get bookings by status and date filter
  const getBookingsByStatus = (status) => {
    let filteredBookings = bookings;
    
    // Filter by date if not showing all dates
    if (!showAllDates && selectedDate) {
      filteredBookings = bookings.filter(b => b.date === selectedDate);
    }
    
    // Filter by status
    if (status === 'all') return filteredBookings;
    if (status === 'completed') return filteredBookings.filter(b => b.status === 'approved');
    return filteredBookings.filter(b => b.status === status);
  };

  // Get tab counts with date filtering
  const getTabCounts = () => {
    const dateFilteredBookings = !showAllDates && selectedDate 
      ? bookings.filter(b => b.date === selectedDate) 
      : bookings;
      
    return {
      pending: dateFilteredBookings.filter(b => b.status === 'pending').length,
      approved: dateFilteredBookings.filter(b => b.status === 'approved').length,
      rejected: dateFilteredBookings.filter(b => b.status === 'rejected').length,
      completed: dateFilteredBookings.filter(b => b.status === 'approved').length,
      all: dateFilteredBookings.length
    };
  };

  const tabCounts = getTabCounts();

  // Filter bookings based on search
  const filteredBookings = getBookingsByStatus(activeTab).filter(booking => {
    const matchesSearch = booking.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Enhanced Tab Configuration with Icons and Gradients
  const tabConfig = [
    { 
      key: 'pending', 
      label: 'Pending', 
      count: tabCounts.pending,
      icon: FaHourglassHalf
    },
    { 
      key: 'approved', 
      label: 'Approved', 
      count: tabCounts.approved,
      icon: FaCheckCircle
    },
    { 
      key: 'rejected', 
      label: 'Rejected', 
      count: tabCounts.rejected,
      icon: FaTimesCircle
    },
    { 
      key: 'completed', 
      label: 'Completed', 
      count: tabCounts.completed,
      icon: FaStar
    },
    { 
      key: 'all', 
      label: 'All', 
      count: tabCounts.all,
      icon: FaListUl
    }
  ];

  // Handle date change
  const handleDateChange = (event) => {
    const newDate = event.target.value;
    setSelectedDate(newDate);
    setShowAllDates(false);
  };

  // Handle show all dates
  const handleShowAllDates = () => {
    setShowAllDates(true);
    setSelectedDate('');
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Auto-refresh every 30 seconds and check for midnight
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndClearMidnightData();
      fetchBookings();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBookings]);

  // Check for midnight every minute
  useEffect(() => {
    const midnightInterval = setInterval(() => {
      checkAndClearMidnightData();
    }, 60000); // Check every minute

    return () => clearInterval(midnightInterval);
  }, []);

  return (
    <div className="approve-container">
      {/* Header Section */}
      <div className="approve-header">
        <h1 className="approve-title">Room Booking Approval System</h1>
        
        {/* Enhanced Impressive Tabs */}
        <div className="approve-tabs-container">
          {tabConfig.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`approve-tab ${activeTab === tab.key ? `approve-tab-active approve-tab-${tab.key}` : ''}`}
              >
                {/* Tab Icon */}
                <IconComponent className={`approve-tab-icon ${activeTab === tab.key ? 'approve-tab-icon-active' : ''}`} />
                
                {/* Tab Label */}
                <span className="approve-tab-label">{tab.label}</span>
                
                {/* Enhanced Count Badge */}
                {tab.count > 0 && (
                  <div className={`approve-count-badge ${activeTab === tab.key ? 'approve-count-badge-active' : ''} ${tab.key === 'pending' && tab.count > 0 ? 'approve-count-badge-pulse' : ''}`}>
                    {tab.count}
                    {/* Pulse animation for pending items */}
                    {tab.key === 'pending' && tab.count > 0 && (
                      <div className="approve-count-pulse"></div>
                    )}
                  </div>
                )}
                
                {/* Active Tab Glow Effect */}
                {activeTab === tab.key && (
                  <div className="approve-tab-glow"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Search and Date Filter */}
        <div className="approve-search-filters">
          <div className="approve-search-container">
            <FaSearch className="approve-search-icon" />
            <Input 
              placeholder="Search by room, requester, or purpose..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="approve-search-input"
            />
          </div>
          
          {/* Date Filter */}
          <div className="approve-date-filter">
            <Input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="approve-date-input"
              max="2099-12-31"
            />
            <Button 
              variant={showAllDates ? "default" : "outline"} 
              size="sm"
              onClick={handleShowAllDates}
              className="approve-all-dates-btn"
            >
              <FaCalendarAlt className="approve-calendar-icon" />
              All Dates
            </Button>
          </div>
          
          {/* Current Filter Display */}
          <div className="approve-filter-display">
            <span className="approve-filter-text">
              {showAllDates ? 'Showing: All Dates' : `Showing: ${formatDateForDisplay(selectedDate) || 'Today'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="approve-main-content">
        {/* Left Side - Booking List */}
        <div className="approve-booking-list">
          <div className="approve-booking-list-content">
            {/* Left Side Header */}
            <div className="approve-list-header">
              <div className="approve-list-title">
                <FaTh className="approve-list-icon" />
                <h2>Booking List</h2>
              </div>
              <div className="approve-list-meta">
                <span className="approve-results-count">
                  {loading ? 'Loading...' : `${filteredBookings.length} result${filteredBookings.length !== 1 ? 's' : ''} found`}
                </span>
                <Button variant="outline" size="sm">
                  <FaFilter className="approve-view-options-icon" />
                  View Options
                </Button>
              </div>
            </div>

            <div className="approve-bookings-container">
              {loading && filteredBookings.length === 0 ? (
                <div className="approve-no-results">
                  <FaHourglassHalf className="approve-no-results-icon" />
                  <p className="approve-no-results-text">Loading approval requests...</p>
                </div>
              ) : (
                filteredBookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className={`approve-booking-card ${selectedBooking?.id === booking.id ? 'approve-booking-card-selected' : ''}`}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <CardContent className="approve-booking-card-content">
                      <div className="approve-booking-header">
                        <h3 className="approve-booking-room">{booking.room}</h3>
                        <div className="approve-booking-badges">
                          <Badge variant={
                            booking.urgency === 'urgent' ? 'destructive' : 
                            booking.urgency === 'high' ? 'default' : 'secondary'
                          } className="approve-urgency-badge">
                            {booking.urgency}
                          </Badge>
                          <Badge variant="outline" className="approve-department-badge">
                            {booking.requester.department}
                          </Badge>
                        </div>
                      </div>

                      <p className="approve-booking-requester">{booking.requester.name}</p>
                      <p className="approve-booking-purpose">{booking.purpose}</p>

                      <div className="approve-booking-details-left">
                        <span className="approve-detail-item">
                          <FaCalendarAlt className="approve-detail-icon" />
                          {booking.date}
                        </span>
                        <span className="approve-detail-item">
                          <FaClock className="approve-detail-icon" />
                          {booking.time}
                        </span>
                        <span className="approve-detail-item">
                          <FaUsers className="approve-detail-icon" />
                          {booking.attendees}
                        </span>
                      </div>

                      {booking.status === 'pending' && (
                        <div className="approve-booking-actions">
                          <Button 
                            size="sm" 
                            className="approve-action-approve"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(booking.id);
                            }}
                            disabled={loading}
                          >
                            <FaCheckCircle className="approve-action-icon" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="approve-action-reject"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(booking.id, 'Rejected by manager');
                            }}
                            disabled={loading}
                          >
                            <FaTimesCircle className="approve-action-icon" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}

              {!loading && filteredBookings.length === 0 && (
                <div className="approve-no-results">
                  <FaSearch className="approve-no-results-icon" />
                  <p className="approve-no-results-text">
                    {bookings.length === 0 ? 
                      'No approval requests found. New requests will appear here when employees submit bookings.' :
                      'No bookings match your search criteria'
                    }
                  </p>
                  <Button variant="outline" className="approve-clear-filters" onClick={() => {
                    setSearchTerm("");
                    setSelectedDate(getTodayDate());
                    setShowAllDates(false);
                  }}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Booking Details */}
        <div className="approve-booking-details">
          <div className="approve-details-content">
            {/* Right Side Header */}
            <div className="approve-details-header">
              <FaChartLine className="approve-details-icon" />
              <h2>Booking Details</h2>
            </div>

            {selectedBooking ? (
              <Card>
                <CardContent className="approve-details-card-content">
                  {/* Header Section */}
                  <div className="approve-details-main-header">
                    <div className={`approve-details-status-icon ${
                      selectedBooking.urgency === 'urgent' ? 'approve-urgent' :
                      selectedBooking.urgency === 'high' ? 'approve-high' : 'approve-normal'
                    }`}>
                      <FaClock className="approve-status-clock" />
                    </div>
                    <h2 className="approve-details-room-title">{selectedBooking.room}</h2>
                    <p className="approve-details-purpose">{selectedBooking.purpose}</p>
                  </div>

                  {/* Status Card */}
                  <div className="approve-status-card">
                    <div className="approve-status-label">Current Status</div>
                    <Badge variant={
                      selectedBooking.status === 'approved' ? 'default' :
                      selectedBooking.status === 'rejected' ? 'destructive' : 'secondary'
                    } className="approve-status-badge">
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </Badge>
                  </div>

                  {/* Booking Information Grid */}
                  <div className="approve-info-grid">
                    <div className="approve-info-item">
                      <FaCalendarAlt className="approve-info-icon" />
                      <div className="approve-info-value">{selectedBooking.date}</div>
                      <div className="approve-info-label">Date</div>
                    </div>
                    <div className="approve-info-item">
                      <FaClock className="approve-info-icon" />
                      <div className="approve-info-value">{selectedBooking.time}</div>
                      <div className="approve-info-label">Time</div>
                    </div>
                    <div className="approve-info-item">
                      <FaUsers className="approve-info-icon" />
                      <div className="approve-info-value">{selectedBooking.attendees} people</div>
                      <div className="approve-info-label">Attendees</div>
                    </div>
                    <div className="approve-info-item">
                      <FaBuilding className="approve-info-icon" />
                      <div className="approve-info-value">{selectedBooking.requester.department}</div>
                      <div className="approve-info-label">Department</div>
                    </div>
                  </div>

                  {/* Requester Information */}
                  <div className="approve-requester-info">
                    <div className="approve-requester-header">
                      <FaUser className="approve-requester-icon" />
                      <h3>Requester Information</h3>
                    </div>
                    
                    <div className="approve-requester-details">
                      <Avatar className="approve-requester-avatar">
                        <AvatarFallback className="approve-avatar-initials">
                          {selectedBooking.requester.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="approve-requester-info-content">
                        <div className="approve-requester-name-role">
                          <h4 className="approve-requester-name">{selectedBooking.requester.name}</h4>
                          <p className="approve-requester-role">{selectedBooking.requester.role}</p>
                        </div>
                        
                        <div className="approve-contact-info">
                          <div className="approve-contact-item">
                            <FaEnvelope className="approve-contact-icon" />
                            <span className="approve-contact-text">{selectedBooking.requester.email}</span>
                          </div>
                          
                          <div className="approve-contact-item">
                            <FaPhone className="approve-contact-icon" />
                            <span className="approve-contact-text">{selectedBooking.requester.phone}</span>
                          </div>
                          
                          <div className="approve-contact-item">
                            <FaBuilding className="approve-contact-icon" />
                            <span className="approve-contact-text">{selectedBooking.requester.department}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {selectedBooking.status === 'pending' && (
                    <>
                      <Separator />
                      <div className="approve-action-buttons">
                        <Button 
                          onClick={() => handleApprove(selectedBooking.id)}
                          className="approve-main-approve-btn"
                          disabled={loading}
                        >
                          <FaCheckCircle className="approve-main-action-icon" />
                          {loading ? 'Processing...' : 'Approve Request'}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleReject(selectedBooking.id, 'Rejected by manager')}
                          className="approve-main-reject-btn"
                          disabled={loading}
                        >
                          <FaTimesCircle className="approve-main-action-icon" />
                          {loading ? 'Processing...' : 'Reject Request'}
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Decision History */}
                  {(selectedBooking.status === 'approved' || selectedBooking.status === 'rejected') && (
                    <>
                      <Separator />
                      <div className="approve-decision-history">
                        <h4 className="approve-history-title">
                          <FaChartLine className="approve-history-icon" />
                          Decision History
                        </h4>
                        <div className="approve-history-content">
                          <div className="approve-history-item">
                            <span className="approve-history-label">Decision:</span>
                            <Badge variant={selectedBooking.status === 'approved' ? 'default' : 'destructive'}>
                              {selectedBooking.status}
                            </Badge>
                          </div>
                          <div className="approve-history-item">
                            <span className="approve-history-label">Decided by:</span>
                            <span className="approve-history-value">{selectedBooking.approvedBy || 'N/A'}</span>
                          </div>
                          <div className="approve-history-item">
                            <span className="approve-history-label">Date:</span>
                            <span className="approve-history-value">{selectedBooking.approvedAt || 'N/A'}</span>
                          </div>
                          {selectedBooking.notes && (
                            <div className="approve-history-notes">
                              <span className="approve-history-label">Notes:</span>
                              <p className="approve-notes-text">{selectedBooking.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="approve-no-selection">
                <div className="approve-no-selection-content">
                  <FaChartLine className="approve-no-selection-icon" />
                  <h3 className="approve-no-selection-title">Select a booking to view details</h3>
                  <p className="approve-no-selection-text">Click on any booking request from the list to see detailed information</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}