import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiSearch, FiFilter, FiCalendar, FiClock, FiUsers, FiMapPin,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiBarChart2, FiList, 
  FiTrendingUp, FiActivity, FiRefreshCw, FiChevronUp, FiChevronDown,
  FiTrash2, FiPlus
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import './History.css';

const History = () => {
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
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

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch user's booking history
  const fetchHistory = async (showLoadingToast = false) => {
    try {
      if (showLoadingToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('📋 Fetching history data...');
      console.log('Token available:', !!token);
      console.log('User data:', user);
      
      if (!token) {
        console.log('❌ No token available - showing empty state');
        setHistoryData([]);
        setFilteredData([]);
        setStatsData({
          totalBookings: 0,
          completedBookings: 0,
          rejectedBookings: 0,
          totalHours: 0
        });
        return;
      }

      // Fetch history data
      const historyResponse = await axios.get(`${API_BASE_URL}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('📋 History response:', historyResponse.data);
      setHistoryData(historyResponse.data);
      setFilteredData(historyResponse.data);
      
      // Fetch statistics
      const statsResponse = await axios.get(`${API_BASE_URL}/history/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('📊 Stats response:', statsResponse.data);
      setStatsData(statsResponse.data);

      if (showLoadingToast) {
        toast.success('History refreshed successfully!');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch history:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        // Optionally redirect to login
        // navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to view this data.');
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Failed to load booking history. Please try again.');
      }
      
      setHistoryData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Delete history entry
  const handleDeleteHistory = async (historyId) => {
    try {
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      console.log('🗑️ Deleting history entry:', historyId);

      await axios.delete(`${API_BASE_URL}/history/${historyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success('History entry deleted successfully');
      
      // Remove the deleted item from local state immediately
      setHistoryData(prev => prev.filter(item => item._id !== historyId));
      setFilteredData(prev => prev.filter(item => item._id !== historyId));
      
      // Refresh stats
      fetchHistory();
      
    } catch (error) {
      console.error('❌ Failed to delete history entry:', error);
      
      if (error.response?.status === 404) {
        toast.error('History entry not found');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Failed to delete history entry');
      }
    }
  };

  // Filter data based on search and filters
  useEffect(() => {
    let filtered = [...historyData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.room?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.organizer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Time filter
    if (timeFilter !== 'all') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      switch (timeFilter) {
        case 'today':
          filtered = filtered.filter(booking => booking.date === todayStr);
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          const weekAgoStr = weekAgo.toISOString().split('T')[0];
          filtered = filtered.filter(booking => 
            booking.date >= weekAgoStr && booking.date <= todayStr
          );
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          const monthAgoStr = monthAgo.toISOString().split('T')[0];
          filtered = filtered.filter(booking => 
            booking.date >= monthAgoStr && booking.date <= todayStr
          );
          break;
        default:
          break;
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredData(filtered);
  }, [historyData, searchTerm, timeFilter, statusFilter]);

  // Fetch data on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle navigation to BookRoom
  const handleBookRoom = () => {
    navigate('/bookroom');
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
        return <FiCheckCircle className="h-4 w-4" />;
      case 'pending':
        return <FiAlertCircle className="h-4 w-4" />;
      case 'upcoming':
        return <FiClock className="h-4 w-4" />;
      case 'rejected':
      case 'cancelled':
        return <FiXCircle className="h-4 w-4" />;
      default:
        return <FiClock className="h-4 w-4" />;
    }
  };

  // Empty state component
  const EmptyState = () => (
    <div className="history-empty-state">
      <div className="history-empty-state-content">
        <div className="history-empty-state-icon">
          <FiCalendar className="h-16 w-16 text-gray-400" />
        </div>
        <h3 className="history-empty-state-title">No Booking History</h3>
        <p className="history-empty-state-description">
          You haven't made any room bookings yet. Start by booking your first meeting room.
        </p>
        <button 
          onClick={handleBookRoom}
          className="history-empty-state-button"
        >
          <FiPlus className="h-5 w-5" />
          Book a Room
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="history-booking-analytics-wrapper">
        <div className="history-loading-state">
          <FiRefreshCw className="history-loading-icon" />
          <p>Loading your booking history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-booking-analytics-wrapper">
      {/* Header Section */}
      <div className="history-analytics-top-section">
        <div className="history-top-section-layout">
          <div className="history-top-section-info">
            <div className="history-title-area-container">
              <div className="history-main-title-icon">
                <FiBarChart2 className="h-6 w-6 text-white" />
              </div>
              <div className="history-title-text-area">
                <h1 className="history-main-analytics-title">
                  My Booking History
                </h1>
                <p className="history-analytics-description">
                  Track and analyze your meeting room bookings
                  {user && ` - ${user.name || user.username || 'User'}`}
                </p>
              </div>
            </div>
          </div>
          <div className="history-header-actions">
            <button 
              onClick={() => fetchHistory(true)}
              className="history-refresh-button"
              disabled={refreshing}
            >
              <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={handleBookRoom}
              className="history-book-room-button"
            >
              <FiPlus className="h-4 w-4" />
              Book Room
            </button>
          </div>
        </div>
      </div>

      {historyData.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Filters Section */}
          <div className="history-control-filters-card">
            <div className="history-filters-layout-area">
              <div className="history-search-control-wrapper">
                <div className="history-search-field-container">
                  <FiSearch className="history-search-field-icon" />
                  <input 
                    type="text"
                    placeholder="Search bookings..." 
                    className="history-search-field-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="history-filter-options-group">
                <div className="history-time-filter-wrapper">
                  <select 
                    className="history-filter-dropdown-input"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
                <div className="history-status-filter-wrapper">
                  <select 
                    className="history-filter-dropdown-input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="history-metrics-display-grid">
            <div className="history-metric-card history-metric-blue-theme">
              <div className="history-metric-bg-decoration"></div>
              <div className="history-metric-card-content">
                <div className="history-metric-top-row">
                  <div className="history-metric-icon-container">
                    <FiCalendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="history-metric-trend-badge">
                    Total
                  </div>
                </div>
                <div className="history-metric-data-section">
                  <p className="history-metric-category-label">Total Bookings</p>
                  <p className="history-metric-primary-number">{statsData.totalBookings}</p>
                  <div className="history-metric-comparison-info">
                    <FiTrendingUp className="h-3 w-3" />
                    <span>All time</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="history-metric-card history-metric-green-theme">
              <div className="history-metric-bg-decoration"></div>
              <div className="history-metric-card-content">
                <div className="history-metric-top-row">
                  <div className="history-metric-icon-container">
                    <FiCheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="history-metric-trend-badge">
                    {statsData.totalBookings > 0 ? Math.round((statsData.completedBookings / statsData.totalBookings) * 100) : 0}%
                  </div>
                </div>
                <div className="history-metric-data-section">
                  <p className="history-metric-category-label">Completed</p>
                  <p className="history-metric-primary-number">{statsData.completedBookings}</p>
                  <div className="history-metric-comparison-info">
                    <FiCheckCircle className="h-3 w-3" />
                    <span>Success rate</span>
                  </div>
                </div>
                <div className="history-metric-progress-track">
                  <div 
                    className="history-metric-progress-indicator" 
                    style={{
                      width: `${statsData.totalBookings > 0 ? (statsData.completedBookings / statsData.totalBookings) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="history-metric-card history-metric-red-theme">
              <div className="history-metric-bg-decoration"></div>
              <div className="history-metric-card-content">
                <div className="history-metric-top-row">
                  <div className="history-metric-icon-container">
                    <FiXCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="history-metric-trend-badge">
                    {statsData.totalBookings > 0 ? Math.round((statsData.rejectedBookings / statsData.totalBookings) * 100) : 0}%
                  </div>
                </div>
                <div className="history-metric-data-section">
                  <p className="history-metric-category-label">Rejected</p>
                  <p className="history-metric-primary-number">{statsData.rejectedBookings}</p>
                  <div className="history-metric-comparison-info">
                    <FiXCircle className="h-3 w-3" />
                    <span>Rejection rate</span>
                  </div>
                </div>
                <div className="history-metric-progress-track">
                  <div 
                    className="history-metric-progress-indicator" 
                    style={{
                      width: `${statsData.totalBookings > 0 ? (statsData.rejectedBookings / statsData.totalBookings) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="history-metric-card history-metric-purple-theme">
              <div className="history-metric-bg-decoration"></div>
              <div className="history-metric-card-content">
                <div className="history-metric-top-row">
                  <div className="history-metric-icon-container">
                    <FiClock className="h-6 w-6 text-white" />
                  </div>
                  <div className="history-metric-trend-badge">
                    Hours
                  </div>
                </div>
                <div className="history-metric-data-section">
                  <p className="history-metric-category-label">Total Hours</p>
                  <p className="history-metric-primary-number">{statsData.totalHours}</p>
                  <div className="history-metric-comparison-info">
                    <FiActivity className="h-3 w-3" />
                    <span>Meeting time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="history-data-display-container">
            <div className="history-data-container-top">
              <div className="history-data-top-layout">
                <div className="history-data-title-area">
                  <div className="history-data-section-icon">
                    <FiList className="h-5 w-5 text-white" />
                  </div>
                  <div className="history-data-title-content">
                    <h3 className="history-data-section-title">Booking History</h3>
                    <p className="history-data-section-desc">
                      Your personal meeting room booking records
                    </p>
                  </div>
                </div>
                <div className="history-data-top-actions">
                  <div className="history-records-count-badge">
                    {filteredData.length} of {historyData.length}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="history-data-table-area">
              <div className="history-data-table-scroll">
                <table className="history-records-data-table">
                  <thead>
                    <tr className="history-data-headers-row">
                      <th className="history-data-column-header">
                        <div className="history-column-header-layout">
                          <FiCalendar className="h-4 w-4 text-gray-500 mr-2" />
                          Meeting Details
                          <div className="history-column-sort-indicator">
                            <FiChevronUp className="h-3 w-3 text-gray-400 -mb-0.5" />
                            <FiChevronDown className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="history-data-column-header">
                        <div className="history-column-header-layout">
                          <FiCalendar className="h-4 w-4 text-gray-500 mr-2" />
                          Date
                          <div className="history-column-sort-indicator">
                            <FiChevronUp className="h-3 w-3 text-gray-400 -mb-0.5" />
                            <FiChevronDown className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="history-data-column-header">
                        <div className="history-column-header-layout">
                          <FiClock className="h-4 w-4 text-gray-500 mr-2" />
                          Time
                          <div className="history-column-sort-indicator">
                            <FiChevronUp className="h-3 w-3 text-gray-400 -mb-0.5" />
                            <FiChevronDown className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="history-data-column-header">
                        <div className="history-column-header-layout">
                          <FiMapPin className="h-4 w-4 text-gray-500 mr-2" />
                          Room & Attendees
                          <div className="history-column-sort-indicator">
                            <FiChevronUp className="h-3 w-3 text-gray-400 -mb-0.5" />
                            <FiChevronDown className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="history-data-column-header">
                        <div className="history-column-header-layout">
                          Status
                          <div className="history-column-sort-indicator">
                            <FiChevronUp className="h-3 w-3 text-gray-400 -mb-0.5" />
                            <FiChevronDown className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="history-data-column-header">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="history-data-records-body">
                    {filteredData.map((booking) => (
                      <tr key={booking._id || booking.id} className="history-data-record-row">
                        <td className="history-record-data-cell">
                          <div className="history-meeting-info-layout">
                            <div className="history-meeting-visual-icon">
                              <FiCalendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="history-meeting-text-info">
                              <p className="history-meeting-name-text">
                                {booking.title}
                              </p>
                              <p className="history-meeting-creator-text">
                                Organized by {booking.organizer}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="history-record-data-cell">
                          <div className="history-date-display-layout">
                            <div className="history-date-visual-dot"></div>
                            <span className="history-date-value-text">
                              {formatDate(booking.date)}
                            </span>
                          </div>
                        </td>
                        
                        <td className="history-record-data-cell">
                          <div className="history-time-display-layout">
                            <FiClock className="h-4 w-4 text-gray-400" />
                            <span className="history-time-value-text">{booking.time}</span>
                          </div>
                        </td>
                        
                        <td className="history-record-data-cell">
                          <div className="history-location-info-area">
                            <div className="history-room-location-info">
                              <FiMapPin className="h-4 w-4 text-gray-400" />
                              <span className="history-room-name-text">{booking.room}</span>
                            </div>
                            <div className="history-participants-info">
                              <FiUsers className="h-4 w-4 text-gray-400" />
                              <span className="history-participants-count-text">
                                {booking.attendees} attendees
                              </span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="history-record-data-cell">
                          <div className={`history-booking-status-indicator history-booking-status-${booking.status}`}>
                            <span className="history-status-visual-icon">
                              {getStatusIcon(booking.status)}
                            </span>
                            <span className="history-status-label-text">{booking.status}</span>
                          </div>
                        </td>

                        <td className="history-record-data-cell">
                          <button
                            onClick={() => handleDeleteHistory(booking._id || booking.id)}
                            className="history-delete-button"
                            title="Delete from history"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Table Footer */}
              <div className="history-data-table-bottom">
                <div className="history-table-bottom-layout">
                  <div className="history-records-summary-info">
                    <span>
                      Showing {filteredData.length} of {historyData.length} bookings
                    </span>
                  </div>
                  <div className="history-page-navigation-controls">
                    <button className="history-nav-control-button" disabled>
                      Previous
                    </button>
                    <span className="history-current-page-marker">
                      1
                    </span>
                    <button className="history-nav-control-button" disabled>
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default History;