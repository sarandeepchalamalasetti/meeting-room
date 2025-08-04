import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Status from './Status/Status';
import RoomUtilization from './RoomUtilization/RoomUtilization';
import UpcomingBookings from './UpcomingBookings/UpcomingBookings';
import BookingSummary from './BookingSummary/BookingSummary';
import ChartSwitcher from './ChartSwitcher/ChartSwitcher';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  MdKeyboardArrowDown, 
  MdCalendarToday, 
  MdClose,
  MdNotifications,
  MdNotificationsActive,
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdEvent,
  MdClear,
  MdMarkEmailRead,
  MdDelete,
  MdAccessTime,
  MdPerson,
  MdRoom,
  MdArrowForward
} from 'react-icons/md';

const Dashboard = () => {
  const user = JSON.parse(sessionStorage.getItem('user')) || {};
  const token = sessionStorage.getItem('token');
  const navigate = useNavigate();
  
  console.log('🔔 Dashboard - User data:', {
    role: user.role,
    email: user.email,
    name: user.name,
    hasToken: !!token
  });
  
  // State for dropdown controls
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [selectedDate, setSelectedDate] = useState('');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  // ✅ NEW: Active filter state management
  const [activeFilter, setActiveFilter] = useState('period'); // 'period' or 'date'
  const [filterDateRange, setFilterDateRange] = useState({
    startDate: '',
    endDate: '',
    type: 'today'
  });

  // Notification states (existing)
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // Period options
  const periodOptions = [
    'Today',
    'This Week', 
    'This Month',
    '3 Months',
    '6 Months',
    '1 Year'
  ];

  // ✅ NEW: Calculate date range based on selected period
  const calculateDateRange = (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate, endDate;

    switch (period) {
      case 'Today':
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1); // Include full day
        break;
      case 'This Week':
        const dayOfWeek = today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek); // Start of week (Sunday)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'This Month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        break;
      case '3 Months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case '6 Months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 6);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case '1 Year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        break;
      default:
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      type: period.toLowerCase().replace(' ', '_')
    };
  };

  // ✅ NEW: Midnight reset functionality
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // Next midnight
      
      const timeUntilMidnight = midnight.getTime() - now.getTime();
      
      const timeout = setTimeout(() => {
        console.log('🕛 Midnight reset triggered');
        // Force refresh all components by updating filter
        setFilterDateRange(prevRange => ({
          ...prevRange,
          lastReset: new Date().toISOString()
        }));
        
        // Set up next midnight check
        checkMidnight();
      }, timeUntilMidnight);

      return () => clearTimeout(timeout);
    };

    const cleanup = checkMidnight();
    return cleanup;
  }, []);

  // ✅ NEW: Update filter when period changes
  useEffect(() => {
    if (activeFilter === 'period') {
      const newRange = calculateDateRange(selectedPeriod);
      setFilterDateRange(newRange);
      console.log('📅 Period filter updated:', selectedPeriod, newRange);
    }
  }, [selectedPeriod, activeFilter]);

  // ✅ NEW: Update filter when specific date changes
  useEffect(() => {
    if (activeFilter === 'date' && selectedDate) {
      const dateObj = new Date(selectedDate);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const newRange = {
        startDate: selectedDate,
        endDate: nextDay.toISOString().split('T')[0],
        type: 'custom_date'
      };
      setFilterDateRange(newRange);
      console.log('📅 Date filter updated:', selectedDate, newRange);
    }
  }, [selectedDate, activeFilter]);

  // Existing notification functions (unchanged)
  const fetchNotifications = async () => {
    if (!token) {
      console.log('🔔 No token available, skipping notification fetch');
      return;
    }
    
    try {
      setNotificationLoading(true);
      console.log('🔔 Fetching notifications...');
      
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          limit: 10
        }
      });
      
      console.log('🔔 Notification response:', response.data);
      
      setNotifications(response.data.notifications || []);
      setNotificationCount(response.data.unreadCount || 0);
      
      console.log('🔔 Updated notification state:', {
        count: response.data.notifications?.length || 0,
        unreadCount: response.data.unreadCount || 0
      });
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      if (error.response) {
        console.error('❌ Response data:', error.response.data);
        console.error('❌ Response status:', error.response.status);
      }
      setNotifications([]);
      setNotificationCount(0);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      console.log('🔔 Notification clicked:', notification);
      
      if (!notification.read && token) {
        console.log('🔔 Marking notification as read...');
        await axios.patch(
          `http://localhost:5000/api/notifications/${notification._id}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }
      
      setNotifications(prev => 
        prev.map(n => 
          n._id === notification._id ? { ...n, read: true } : n
        )
      );
      
      setNotificationCount(prev => Math.max(0, prev - 1));
      setShowNotificationDropdown(false);
      
      console.log('🔔 Navigating based on notification:', {
        actionUrl: notification.actionUrl,
        type: notification.type,
        userRole: user.role
      });
      
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      } else {
        if (user.role === 'manager' && notification.type === 'booking_request') {
          navigate('/approval');
        } else if (user.role === 'employee' && ['booking_approved', 'booking_rejected', 'booking_pending'].includes(notification.type)) {
          navigate('/booking-status');
        } else if (user.role === 'hr') {
          navigate('/approval');
        }
      }
    } catch (error) {
      console.error('❌ Error handling notification click:', error);
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (token) {
        console.log('🔔 Marking all notifications as read...');
        await axios.patch(
          'http://localhost:5000/api/notifications/mark-all-read',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setNotificationCount(0);
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    
    try {
      if (token) {
        console.log('🔔 Deleting notification:', notificationId);
        await axios.delete(
          `http://localhost:5000/api/notifications/${notificationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }
      
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      if (notification && !notification.read) {
        setNotificationCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_request':
        return <MdEvent className="dashboard-notification-type-icon" />;
      case 'booking_approved':
        return <MdCheckCircle className="dashboard-notification-type-icon dashboard-notification-approved" />;
      case 'booking_rejected':
        return <MdCancel className="dashboard-notification-type-icon dashboard-notification-rejected" />;
      case 'booking_pending':
        return <MdPending className="dashboard-notification-type-icon dashboard-notification-pending" />;
      case 'booking_cancelled':
        return <MdCancel className="dashboard-notification-type-icon dashboard-notification-cancelled" />;
      case 'booking_created':
        return <MdEvent className="dashboard-notification-type-icon" />;
      default:
        return <MdNotifications className="dashboard-notification-type-icon" />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'dashboard-notification-priority-high';
      case 'medium':
        return 'dashboard-notification-priority-medium';
      case 'low':
        return 'dashboard-notification-priority-low';
      default:
        return '';
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const time = new Date(dateString);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  useEffect(() => {
    console.log('🔔 Dashboard mounted, fetching notifications...');
    fetchNotifications();
    
    const interval = setInterval(() => {
      console.log('🔔 Polling notifications...');
      fetchNotifications();
    }, 30000);
    
    return () => {
      console.log('🔔 Dashboard unmounted, clearing notification polling');
      clearInterval(interval);
    };
  }, [token]);

  // ✅ NEW: Handle period selection with filter priority
  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    setShowPeriodDropdown(false);
    
    // Set period filter as active and clear date
    setActiveFilter('period');
    setSelectedDate('');
    
    console.log('📅 Period selected:', period, 'clearing date filter');
  };

  // ✅ NEW: Handle date change with filter priority
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    
    // Set date filter as active and clear period if date is selected
    if (newDate) {
      setActiveFilter('date');
      console.log('📅 Date selected:', newDate, 'switching to date filter');
    }
  };

  // ✅ NEW: Clear date filter and switch back to period
  const clearDateFilter = () => {
    setSelectedDate('');
    setActiveFilter('period');
    console.log('📅 Date filter cleared, switching back to period filter');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dashboard-dropdown-container')) {
        setShowPeriodDropdown(false);
      }
      if (!event.target.closest('.dashboard-notification-container')) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Dashboard
          </h1>
        </div>
        
        <div className="dashboard-dashboard-controls">
          {/* Period Selector */}
          <div className="dashboard-control-item">
            <div className="dashboard-dropdown-container">
              <button 
                className={`dashboard-dropdown-button ${activeFilter === 'period' ? 'active' : ''}`}
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                disabled={activeFilter === 'date'}
              >
                {selectedPeriod}
                <MdKeyboardArrowDown className="dashboard-dropdown-icon" />
              </button>
              {showPeriodDropdown && (
                <div className="dashboard-dropdown-menu">
                  {periodOptions.map((option) => (
                    <button
                      key={option}
                      className={`dashboard-dropdown-item ${selectedPeriod === option ? 'selected' : ''}`}
                      onClick={() => handlePeriodSelect(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Calendar Picker */}
          <div className="dashboard-control-item">
            <div className="dashboard-calendar-container">
              <MdCalendarToday className="dashboard-calendar-icon" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className={`dashboard-calendar-input ${activeFilter === 'date' ? 'active' : ''}`}
                placeholder="Select date"
              />
              {selectedDate && (
                <button
                  onClick={clearDateFilter}
                  className="dashboard-clear-date-btn"
                  title="Clear date"
                >
                  <MdClose />
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Notification Icon (existing) */}
          <div className="dashboard-control-item">
            <div className="dashboard-notification-container">
              <button 
                className={`dashboard-notification-button ${notificationCount > 0 ? 'dashboard-has-notifications' : ''}`}
                onClick={() => {
                  console.log('🔔 Notification button clicked, current count:', notificationCount);
                  setShowNotificationDropdown(!showNotificationDropdown);
                }}
                title="Notifications"
              >
                {notificationCount > 0 ? (
                  <MdNotificationsActive className="dashboard-notification-icon dashboard-notification-active" />
                ) : (
                  <MdNotifications className="dashboard-notification-icon" />
                )}
                {notificationCount > 0 && (
                  <span className="dashboard-notification-count">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown (existing) */}
              {showNotificationDropdown && (
                <div className="dashboard-notification-dropdown">
                  <div className="dashboard-notification-header">
                    <div className="dashboard-notification-title">
                      <MdNotifications className="dashboard-notification-header-icon" />
                      <span>Notifications</span>
                      {notificationCount > 0 && (
                        <span className="dashboard-notification-header-count">
                          {notificationCount}
                        </span>
                      )}
                    </div>
                    <div className="dashboard-notification-actions">
                      {notificationCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="dashboard-notification-action-btn"
                          title="Mark all as read"
                        >
                          <MdMarkEmailRead />
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotificationDropdown(false)}
                        className="dashboard-notification-action-btn"
                        title="Close"
                      >
                        <MdClear />
                      </button>
                    </div>
                  </div>

                  <div className="dashboard-notification-content">
                    {notificationLoading ? (
                      <div className="dashboard-notification-loading">
                        <div className="dashboard-notification-loading-spinner"></div>
                        <span>Loading notifications...</span>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="dashboard-notification-empty">
                        <MdNotifications className="dashboard-notification-empty-icon" />
                        <h4>No notifications</h4>
                        <p>You're all caught up!</p>
                      </div>
                    ) : (
                      <div className="dashboard-notification-list">
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`dashboard-notification-item ${!notification.read ? 'dashboard-notification-unread' : ''} ${getPriorityClass(notification.priority)}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="dashboard-notification-item-icon">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="dashboard-notification-item-content">
                              <div className="dashboard-notification-item-header">
                                <h5 className="dashboard-notification-item-title">
                                  {notification.title}
                                </h5>
                                <span className="dashboard-notification-item-time">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                              </div>
                              
                              <p className="dashboard-notification-item-message">
                                {notification.message}
                              </p>
                              
                              {notification.roomName && (
                                <div className="dashboard-notification-item-details">
                                  <div className="dashboard-notification-detail">
                                    <MdRoom className="dashboard-notification-detail-icon" />
                                    <span>{notification.roomName}</span>
                                  </div>
                                  {notification.bookingDate && (
                                    <div className="dashboard-notification-detail">
                                      <MdCalendarToday className="dashboard-notification-detail-icon" />
                                      <span>{notification.bookingDate}</span>
                                    </div>
                                  )}
                                  {notification.bookingTime && (
                                    <div className="dashboard-notification-detail">
                                      <MdAccessTime className="dashboard-notification-detail-icon" />
                                      <span>{notification.bookingTime}</span>
                                    </div>
                                  )}
                                  {notification.senderName && (
                                    <div className="dashboard-notification-detail">
                                      <MdPerson className="dashboard-notification-detail-icon" />
                                      <span>{notification.senderName}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="dashboard-notification-item-actions">
                              <button
                                onClick={(e) => handleDeleteNotification(notification._id, e)}
                                className="dashboard-notification-delete-btn"
                                title="Delete notification"
                              >
                                <MdDelete />
                              </button>
                              <MdArrowForward className="dashboard-notification-arrow" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="dashboard-notification-footer">
                      <button
                        onClick={() => {
                          setShowNotificationDropdown(false);
                          navigate(user.role === 'employee' ? '/booking-status' : '/approval');
                        }}
                        className="dashboard-notification-view-all-btn"
                      >
                        View All {user.role === 'employee' ? 'Bookings' : 'Requests'}
                        <MdArrowForward />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <Status 
          selectedPeriod={selectedPeriod}
          selectedDate={selectedDate}
          filterDateRange={filterDateRange}
          activeFilter={activeFilter}
        />
      </div>

      <div className="charts-section">
        <div className="charts-grid">
          <ChartSwitcher 
            selectedPeriod={selectedPeriod}
            selectedDate={selectedDate}
            filterDateRange={filterDateRange}
            activeFilter={activeFilter}
          />
          <BookingSummary 
            selectedPeriod={selectedPeriod}
            selectedDate={selectedDate}
            filterDateRange={filterDateRange}
            activeFilter={activeFilter}
          />
        </div>
      </div>

      <div className="content-grid">
        <RoomUtilization 
          selectedPeriod={selectedPeriod}
          selectedDate={selectedDate}
          filterDateRange={filterDateRange}
          activeFilter={activeFilter}
        />
        <UpcomingBookings 
          selectedPeriod={selectedPeriod}
          selectedDate={selectedDate}
          filterDateRange={filterDateRange}
          activeFilter={activeFilter}
        />
      </div>
    </div>
  );
};

export default Dashboard;