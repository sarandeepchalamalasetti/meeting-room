import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiSearch, FiCalendar, FiClock, FiUsers, FiMapPin,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiBarChart2, FiList, 
  FiTrendingUp, FiActivity, FiRefreshCw, FiChevronUp, FiChevronDown,
  FiTrash2, FiPlus
} from 'react-icons/fi';
import './History.css';

const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState({
    totalBookings: 0,
    completedBookings: 0,
    rejectedBookings: 0,
    totalHours: 0
  });

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
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Show toast notification
  const showToast = (message, type = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // Reset all data to empty state
  const resetToEmptyState = () => {
    console.log('🔄 Resetting to empty state');
    setHistoryData([]);
    setFilteredData([]);
    setStatsData({
      totalBookings: 0,
      completedBookings: 0,
      rejectedBookings: 0,
      totalHours: 0
    });
  };

  // Calculate statistics from data array - FIXED VERSION
  const calculateStats = (dataArray) => {
    console.log('📊 Calculating stats for data:', dataArray);
    
    // Ensure we have valid array data
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      console.log('📊 No data available, returning zero stats');
      return {
        totalBookings: 0,
        completedBookings: 0,
        rejectedBookings: 0,
        totalHours: 0
      };
    }

    const completed = dataArray.filter(b => 
      b.status === 'completed' || b.status === 'approved'
    ).length;

    const rejected = dataArray.filter(b => 
      b.status === 'rejected' || b.status === 'cancelled'
    ).length;

    const totalHours = dataArray.reduce((acc, booking) => {
      if (booking.time) {
        const timeMatch = booking.time.match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/);
        if (timeMatch) {
          const startHour = parseInt(timeMatch[1]);
          const startMin = parseInt(timeMatch[2]);
          const endHour = parseInt(timeMatch[3]);
          const endMin = parseInt(timeMatch[4]);
          
          const startTime = startHour + (startMin / 60);
          const endTime = endHour + (endMin / 60);
          const duration = endTime - startTime;
          
          return acc + (duration > 0 ? duration : 0);
        }
      }
      return acc;
    }, 0);

    const result = {
      totalBookings: dataArray.length,
      completedBookings: completed,
      rejectedBookings: rejected,
      totalHours: Math.round(totalHours * 10) / 10
    };
    
    console.log('📊 Calculated stats result:', result);
    return result;
  };

  // Fetch user's booking history for selected date
  const fetchHistory = async (showLoadingToast = false, dateFilter = null) => {
    try {
      if (showLoadingToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const targetDate = dateFilter || selectedDate;
      console.log('📋 Fetching history data for date:', targetDate);
      
      if (!token) {
        console.log('❌ No token available');
        resetToEmptyState();
        return;
      }

      // Fetch all history data
      const historyResponse = await axios.get(`${API_BASE_URL}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('📋 Raw API response:', historyResponse.data);
      
      // Filter data for the selected date ONLY
      let dateFilteredData = [];
      if (Array.isArray(historyResponse.data)) {
        dateFilteredData = historyResponse.data.filter(booking => {
          const bookingDate = booking.date ? booking.date.split('T')[0] : booking.date;
          const matches = bookingDate === targetDate;
          console.log(`📅 Comparing booking date ${bookingDate} with target ${targetDate}: ${matches}`);
          return matches;
        });
      }
      
      console.log(`📋 Filtered data for ${targetDate}:`, dateFilteredData);
      
      // CRITICAL: Set data first, then calculate stats
      setHistoryData(dateFilteredData);
      setFilteredData(dateFilteredData);
      
      // Calculate stats ONLY from the filtered date data
      const calculatedStats = calculateStats(dateFilteredData);
      setStatsData(calculatedStats);

      if (showLoadingToast) {
        showToast('History refreshed successfully!', 'success');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch history:', error);
      
      if (error.response?.status === 401) {
        showToast('Session expired. Please login again.', 'error');
      } else if (error.response?.status === 403) {
        showToast('You do not have permission to view this data.', 'error');
      } else if (error.code === 'ECONNABORTED') {
        showToast('Request timed out. Please try again.', 'error');
      } else {
        showToast('Failed to load booking history. Please try again.', 'error');
      }
      
      resetToEmptyState();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Delete history entry
  const handleDeleteHistory = async (historyId) => {
    try {
      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }

      console.log('🗑️ Deleting history entry:', historyId);

      await axios.delete(`${API_BASE_URL}/history/${historyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      showToast('History entry deleted successfully', 'success');
      
      // Update data immediately
      const updatedHistoryData = historyData.filter(item => item._id !== historyId);
      const updatedFilteredData = filteredData.filter(item => item._id !== historyId);
      
      setHistoryData(updatedHistoryData);
      setFilteredData(updatedFilteredData);
      
      // Recalculate stats with updated data
      const updatedStats = calculateStats(updatedHistoryData);
      setStatsData(updatedStats);
      
    } catch (error) {
      console.error('❌ Failed to delete history entry:', error);
      
      if (error.response?.status === 404) {
        showToast('History entry not found', 'error');
      } else if (error.response?.status === 401) {
        showToast('Session expired. Please login again.', 'error');
      } else {
        showToast('Failed to delete history entry', 'error');
      }
    }
  };

  // Handle date change
  const handleDateChange = (event) => {
    const newDate = event.target.value;
    console.log('📅 Date changed to:', newDate);
    setSelectedDate(newDate);
    
    // Reset filters when changing date
    setSearchTerm('');
    setStatusFilter('all');
    
    // Clear current data immediately to prevent showing old data
    resetToEmptyState();
    
    // Fetch fresh data for new date
    fetchHistory(false, newDate);
  };

  // Filter data based on search and status - UPDATED to recalculate stats
  useEffect(() => {
    console.log('🔍 Applying filters. History data length:', historyData.length);
    let filtered = [...historyData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.room?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.organizer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    console.log('🔍 Filtered data result:', filtered);
    setFilteredData(filtered);
    
    // IMPORTANT: Always recalculate stats based on what's actually being displayed
    const displayStats = calculateStats(filtered);
    setStatsData(displayStats);
    
  }, [historyData, searchTerm, statusFilter]);

  // Midnight cleanup
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setDate(now.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = nextMidnight.getTime() - now.getTime();
    
    const midnightTimeout = setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      console.log('🕛 Midnight cleanup - resetting to today:', today);
      setSelectedDate(today);
      setSearchTerm('');
      setStatusFilter('all');
      resetToEmptyState();
      fetchHistory(false, today);
      
      const dailyCleanup = setInterval(() => {
        const currentDay = new Date().toISOString().split('T')[0];
        console.log('🕛 Daily cleanup - resetting to:', currentDay);
        setSelectedDate(currentDay);
        setSearchTerm('');
        setStatusFilter('all');
        resetToEmptyState();
        fetchHistory(false, currentDay);
      }, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(dailyCleanup);
    }, timeUntilMidnight);
    
    return () => clearTimeout(midnightTimeout);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchHistory();
  }, []);

  // Navigation handler
  const handleBookRoom = () => {
    console.log('Navigate to book room');
  };

  // Format date for display
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return React.createElement(FiCheckCircle, { className: "h-4 w-4" });
      case 'pending':
        return React.createElement(FiAlertCircle, { className: "h-4 w-4" });
      case 'upcoming':
        return React.createElement(FiClock, { className: "h-4 w-4" });
      case 'rejected':
      case 'cancelled':
        return React.createElement(FiXCircle, { className: "h-4 w-4" });
      default:
        return React.createElement(FiClock, { className: "h-4 w-4" });
    }
  };

  // Table empty state
  const TableEmptyState = () => (
    React.createElement('tr', null,
      React.createElement('td', { colSpan: "6", className: "history-table-empty-state" },
        React.createElement('div', { className: "history-table-empty-content" },
          React.createElement(FiCalendar, { className: "h-12 w-12 text-gray-400" }),
          React.createElement('h3', null, 'No History Found'),
          React.createElement('p', null, `There are no bookings for ${formatDate(selectedDate)}.`)
        )
      )
    )
  );

  if (loading) {
    return (
      React.createElement('div', { className: "history-booking-analytics-wrapper" },
        React.createElement('div', { className: "history-loading-state" },
          React.createElement(FiRefreshCw, { className: "history-loading-icon" }),
          React.createElement('p', null, 'Loading your booking history...')
        )
      )
    );
  }

  return (
    React.createElement('div', { className: "history-booking-analytics-wrapper" },
      // Header Section
      React.createElement('div', { className: "history-analytics-top-section" },
        React.createElement('div', { className: "history-top-section-layout" },
          React.createElement('div', { className: "history-top-section-info" },
            React.createElement('div', { className: "history-title-area-container" },
              React.createElement('div', { className: "history-main-title-icon" },
                React.createElement(FiBarChart2, { className: "h-6 w-6 text-white" })
              ),
              React.createElement('div', { className: "history-title-text-area" },
                React.createElement('h1', { className: "history-main-analytics-title" }, 'My Booking History'),
                React.createElement('p', { className: "history-analytics-description" },
                  'Track and analyze your meeting room bookings - UpToDate View',
                  user && ` - ${user.name || user.username || 'User'}`
                )
              )
            )
          ),
          React.createElement('div', { className: "history-header-actions" },
            React.createElement('button', {
              onClick: () => fetchHistory(true, selectedDate),
              className: "history-refresh-button",
              disabled: refreshing
            },
              React.createElement(FiRefreshCw, { className: `h-4 w-4 ${refreshing ? 'animate-spin' : ''}` }),
              refreshing ? 'Refreshing...' : 'Refresh'
            ),
            React.createElement('button', {
              onClick: handleBookRoom,
              className: "history-book-room-button"
            },
              React.createElement(FiPlus, { className: "h-4 w-4" }),
              'Book Room'
            )
          )
        )
      ),

      // Filters Section
      React.createElement('div', { className: "history-control-filters-card" },
        React.createElement('div', { className: "history-filters-layout-area" },
          React.createElement('div', { className: "history-search-control-wrapper" },
            React.createElement('div', { className: "history-search-field-container" },
              React.createElement(FiSearch, { className: "history-search-field-icon" }),
              React.createElement('input', {
                type: "text",
                placeholder: "Search bookings...",
                className: "history-search-field-input",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value)
              })
            )
          ),
          React.createElement('div', { className: "history-filter-options-group" },
            React.createElement('div', { className: "history-date-filter-wrapper" },
              React.createElement('label', { htmlFor: "date-picker", className: "history-date-label" },
                React.createElement(FiCalendar, { className: "h-4 w-4" }),
                'Select Date:'
              ),
              React.createElement('input', {
                id: "date-picker",
                type: "date",
                className: "history-filter-dropdown-input history-date-input",
                value: selectedDate,
                onChange: handleDateChange,
                max: new Date().toISOString().split('T')[0]
              })
            ),
            React.createElement('div', { className: "history-status-filter-wrapper" },
              React.createElement('select', {
                className: "history-filter-dropdown-input",
                value: statusFilter,
                onChange: (e) => setStatusFilter(e.target.value)
              },
                React.createElement('option', { value: "all" }, 'All Status'),
                React.createElement('option', { value: "completed" }, 'Completed'),
                React.createElement('option', { value: "approved" }, 'Approved'),
                React.createElement('option', { value: "pending" }, 'Pending'),
                React.createElement('option', { value: "upcoming" }, 'Upcoming'),
                React.createElement('option', { value: "rejected" }, 'Rejected'),
                React.createElement('option', { value: "cancelled" }, 'Cancelled')
              )
            )
          )
        )
      ),

      // Statistics Cards - FIXED to always reflect current filtered data
      React.createElement('div', { className: "history-metrics-display-grid" },
        React.createElement('div', { className: "history-metric-card history-metric-blue-theme" },
          React.createElement('div', { className: "history-metric-bg-decoration" }),
          React.createElement('div', { className: "history-metric-card-content" },
            React.createElement('div', { className: "history-metric-top-row" },
              React.createElement('div', { className: "history-metric-icon-container" },
                React.createElement(FiCalendar, { className: "h-6 w-6 text-white" })
              ),
              React.createElement('div', { className: "history-metric-trend-badge" },
                selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : 'Selected'
              )
            ),
            React.createElement('div', { className: "history-metric-data-section" },
              React.createElement('p', { className: "history-metric-category-label" }, 'Total Bookings'),
              React.createElement('p', { className: "history-metric-primary-number" }, statsData.totalBookings),
              React.createElement('div', { className: "history-metric-comparison-info" },
                React.createElement(FiTrendingUp, { className: "h-3 w-3" }),
                React.createElement('span', null, formatDate(selectedDate))
              )
            )
          )
        ),

        React.createElement('div', { className: "history-metric-card history-metric-green-theme" },
          React.createElement('div', { className: "history-metric-bg-decoration" }),
          React.createElement('div', { className: "history-metric-card-content" },
            React.createElement('div', { className: "history-metric-top-row" },
              React.createElement('div', { className: "history-metric-icon-container" },
                React.createElement(FiCheckCircle, { className: "h-6 w-6 text-white" })
              ),
              React.createElement('div', { className: "history-metric-trend-badge" },
                `${statsData.totalBookings > 0 ? Math.round((statsData.completedBookings / statsData.totalBookings) * 100) : 0}%`
              )
            ),
            React.createElement('div', { className: "history-metric-data-section" },
              React.createElement('p', { className: "history-metric-category-label" }, 'Completed'),
              React.createElement('p', { className: "history-metric-primary-number" }, statsData.completedBookings),
              React.createElement('div', { className: "history-metric-comparison-info" },
                React.createElement(FiCheckCircle, { className: "h-3 w-3" }),
                React.createElement('span', null, 'Success rate')
              )
            ),
            React.createElement('div', { className: "history-metric-progress-track" },
              React.createElement('div', {
                className: "history-metric-progress-indicator",
                style: {
                  width: `${statsData.totalBookings > 0 ? (statsData.completedBookings / statsData.totalBookings) * 100 : 0}%`
                }
              })
            )
          )
        ),

        React.createElement('div', { className: "history-metric-card history-metric-red-theme" },
          React.createElement('div', { className: "history-metric-bg-decoration" }),
          React.createElement('div', { className: "history-metric-card-content" },
            React.createElement('div', { className: "history-metric-top-row" },
              React.createElement('div', { className: "history-metric-icon-container" },
                React.createElement(FiXCircle, { className: "h-6 w-6 text-white" })
              ),
              React.createElement('div', { className: "history-metric-trend-badge" },
                `${statsData.totalBookings > 0 ? Math.round((statsData.rejectedBookings / statsData.totalBookings) * 100) : 0}%`
              )
            ),
            React.createElement('div', { className: "history-metric-data-section" },
              React.createElement('p', { className: "history-metric-category-label" }, 'Rejected'),
              React.createElement('p', { className: "history-metric-primary-number" }, statsData.rejectedBookings),
              React.createElement('div', { className: "history-metric-comparison-info" },
                React.createElement(FiXCircle, { className: "h-3 w-3" }),
                React.createElement('span', null, 'Rejection rate')
              )
            ),
            React.createElement('div', { className: "history-metric-progress-track" },
              React.createElement('div', {
                className: "history-metric-progress-indicator",
                style: {
                  width: `${statsData.totalBookings > 0 ? (statsData.rejectedBookings / statsData.totalBookings) * 100 : 0}%`
                }
              })
            )
          )
        ),

        React.createElement('div', { className: "history-metric-card history-metric-purple-theme" },
          React.createElement('div', { className: "history-metric-bg-decoration" }),
          React.createElement('div', { className: "history-metric-card-content" },
            React.createElement('div', { className: "history-metric-top-row" },
              React.createElement('div', { className: "history-metric-icon-container" },
                React.createElement(FiClock, { className: "h-6 w-6 text-white" })
              ),
              React.createElement('div', { className: "history-metric-trend-badge" }, 'Hours')
            ),
            React.createElement('div', { className: "history-metric-data-section" },
              React.createElement('p', { className: "history-metric-category-label" }, 'Total Hours'),
              React.createElement('p', { className: "history-metric-primary-number" }, statsData.totalHours),
              React.createElement('div', { className: "history-metric-comparison-info" },
                React.createElement(FiActivity, { className: "h-3 w-3" }),
                React.createElement('span', null, 'Meeting time')
              )
            )
          )
        )
      ),

      // Bookings Table
      React.createElement('div', { className: "history-data-display-container" },
        React.createElement('div', { className: "history-data-container-top" },
          React.createElement('div', { className: "history-data-top-layout" },
            React.createElement('div', { className: "history-data-title-area" },
              React.createElement('div', { className: "history-data-section-icon" },
                React.createElement(FiList, { className: "h-5 w-5 text-white" })
              ),
              React.createElement('div', { className: "history-data-title-content" },
                React.createElement('h3', { className: "history-data-section-title" }, 'Booking History'),
                React.createElement('p', { className: "history-data-section-desc" },
                  `Bookings for ${formatDate(selectedDate)}`,
                  selectedDate === new Date().toISOString().split('T')[0] && ' (Today - UpToDate)'
                )
              )
            ),
            React.createElement('div', { className: "history-data-top-actions" },
              React.createElement('div', { className: "history-records-count-badge" },
                `${filteredData.length} booking${filteredData.length !== 1 ? 's' : ''}`
              )
            )
          )
        ),

        React.createElement('div', { className: "history-data-table-area" },
          React.createElement('div', { className: "history-data-table-scroll" },
            React.createElement('table', { className: "history-records-data-table" },
              React.createElement('thead', null,
                React.createElement('tr', { className: "history-data-headers-row" },
                  React.createElement('th', { className: "history-data-column-header" },
                    React.createElement('div', { className: "history-column-header-layout" },
                      React.createElement(FiCalendar, { className: "h-4 w-4 text-gray-500 mr-2" }),
                      'Meeting Details',
                      React.createElement('div', { className: "history-column-sort-indicator" },
                        React.createElement(FiChevronUp, { className: "h-3 w-3 text-gray-400 -mb-0.5" }),
                        React.createElement(FiChevronDown, { className: "h-3 w-3 text-gray-400" })
                      )
                    )
                  ),
                  React.createElement('th', { className: "history-data-column-header" },
                    React.createElement('div', { className: "history-column-header-layout" },
                      React.createElement(FiCalendar, { className: "h-4 w-4 text-gray-500 mr-2" }),
                      'Date',
                      React.createElement('div', { className: "history-column-sort-indicator" },
                        React.createElement(FiChevronUp, { className: "h-3 w-3 text-gray-400 -mb-0.5" }),
                        React.createElement(FiChevronDown, { className: "h-3 w-3 text-gray-400" })
                      )
                    )
                  ),
                  React.createElement('th', { className: "history-data-column-header" },
                    React.createElement('div', { className: "history-column-header-layout" },
                      React.createElement(FiClock, { className: "h-4 w-4 text-gray-500 mr-2" }),
                      'Time',
                      React.createElement('div', { className: "history-column-sort-indicator" },
                        React.createElement(FiChevronUp, { className: "h-3 w-3 text-gray-400 -mb-0.5" }),
                        React.createElement(FiChevronDown, { className: "h-3 w-3 text-gray-400" })
                      )
                    )
                  ),
                  React.createElement('th', { className: "history-data-column-header" },
                    React.createElement('div', { className: "history-column-header-layout" },
                      React.createElement(FiMapPin, { className: "h-4 w-4 text-gray-500 mr-2" }),
                      'Room & Attendees',
                      React.createElement('div', { className: "history-column-sort-indicator" },
                        React.createElement(FiChevronUp, { className: "h-3 w-3 text-gray-400 -mb-0.5" }),
                        React.createElement(FiChevronDown, { className: "h-3 w-3 text-gray-400" })
                      )
                    )
                  ),
                  React.createElement('th', { className: "history-data-column-header" },
                    React.createElement('div', { className: "history-column-header-layout" },
                      'Status',
                      React.createElement('div', { className: "history-column-sort-indicator" },
                        React.createElement(FiChevronUp, { className: "h-3 w-3 text-gray-400 -mb-0.5" }),
                        React.createElement(FiChevronDown, { className: "h-3 w-3 text-gray-400" })
                      )
                    )
                  ),
                  React.createElement('th', { className: "history-data-column-header" }, 'Actions')
                )
              ),
              React.createElement('tbody', { className: "history-data-records-body" },
                filteredData.length === 0 ? (
                  React.createElement(TableEmptyState)
                ) : (
                  filteredData.map((booking) =>
                    React.createElement('tr', { key: booking._id || booking.id, className: "history-data-record-row" },
                      React.createElement('td', { className: "history-record-data-cell" },
                        React.createElement('div', { className: "history-meeting-info-layout" },
                          React.createElement('div', { className: "history-meeting-visual-icon" },
                            React.createElement(FiCalendar, { className: "h-6 w-6 text-blue-600" })
                          ),
                          React.createElement('div', { className: "history-meeting-text-info" },
                            React.createElement('p', { className: "history-meeting-name-text" }, booking.title),
                            React.createElement('p', { className: "history-meeting-creator-text" }, `Organized by ${booking.organizer}`)
                          )
                        )
                      ),
                      React.createElement('td', { className: "history-record-data-cell" },
                        React.createElement('div', { className: "history-date-display-layout" },
                          React.createElement('div', { className: "history-date-visual-dot" }),
                          React.createElement('span', { className: "history-date-value-text" }, formatDate(booking.date))
                        )
                      ),
                      React.createElement('td', { className: "history-record-data-cell" },
                        React.createElement('div', { className: "history-time-display-layout" },
                          React.createElement(FiClock, { className: "h-4 w-4 text-gray-400" }),
                          React.createElement('span', { className: "history-time-value-text" }, booking.time)
                        )
                      ),
                      React.createElement('td', { className: "history-record-data-cell" },
                        React.createElement('div', { className: "history-location-info-area" },
                          React.createElement('div', { className: "history-room-location-info" },
                            React.createElement(FiMapPin, { className: "h-4 w-4 text-gray-400" }),
                            React.createElement('span', { className: "history-room-name-text" }, booking.room)
                          ),
                          React.createElement('div', { className: "history-participants-info" },
                            React.createElement(FiUsers, { className: "h-4 w-4 text-gray-400" }),
                            React.createElement('span', { className: "history-participants-count-text" }, `${booking.attendees} attendees`)
                          )
                        )
                      ),
                      React.createElement('td', { className: "history-record-data-cell" },
                        React.createElement('div', {
                          className: `history-booking-status-indicator history-booking-status-${booking.status}`
                        },
                          React.createElement('span', { className: "history-status-visual-icon" }, getStatusIcon(booking.status)),
                          React.createElement('span', { className: "history-status-label-text" }, booking.status)
                        )
                      ),
                      React.createElement('td', { className: "history-record-data-cell" },
                        React.createElement('button', {
                          onClick: () => handleDeleteHistory(booking._id || booking.id),
                          className: "history-delete-button",
                          title: "Delete from history"
                        },
                          React.createElement(FiTrash2, { className: "h-4 w-4" })
                        )
                      )
                    )
                  )
                )
              )
            )
          ),

          React.createElement('div', { className: "history-data-table-bottom" },
            React.createElement('div', { className: "history-table-bottom-layout" },
              React.createElement('div', { className: "history-records-summary-info" },
                React.createElement('span', null, `Showing ${filteredData.length} booking${filteredData.length !== 1 ? 's' : ''} for ${formatDate(selectedDate)}`)
              ),
              React.createElement('div', { className: "history-page-navigation-controls" },
                React.createElement('button', { className: "history-nav-control-button", disabled: true }, 'Previous'),
                React.createElement('span', { className: "history-current-page-marker" }, '1'),
                React.createElement('button', { className: "history-nav-control-button", disabled: true }, 'Next')
              )
            )
          )
        )
      )
    )
  );
};

export default History;