import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdRefresh, MdTrendingUp } from 'react-icons/md';
import './RoomUtilization.css';

const RoomUtilization = ({ selectedPeriod, selectedDate, filterDateRange, activeFilter }) => {
  const [utilizationData, setUtilizationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = sessionStorage.getItem('token');

  // ✅ Get progress bar color based on percentage
  const getProgressBarColor = (percentage) => {
    if (percentage >= 80) return '#ef4444'; // Red - High utilization
    if (percentage >= 60) return '#f59e0b'; // Orange - Medium-high utilization
    if (percentage >= 40) return '#3b82f6'; // Blue - Medium utilization
    if (percentage >= 20) return '#10b981'; // Green - Low utilization
    return '#6b7280'; // Gray - Very low utilization
  };

  // ✅ ENHANCED: Fetch utilization data with filter parameters
  const fetchUtilizationData = async () => {
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      console.log('🔄 RoomUtilization: Fetching with filter:', {
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

      const response = await axios.get(`http://localhost:5000/api/rooms/utilization?${queryParams.toString()}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 RoomUtilization: Response:', response.data);

      if (response.data.success && response.data.data) {
        setUtilizationData(response.data.data);
        console.log('✅ RoomUtilization: Data updated:', response.data.data.length, 'rooms');
        
        // Log top 3 for debugging
        console.log('🔝 RoomUtilization: Top 3 rooms:', response.data.data.slice(0, 3).map(room => ({
          name: room.name,
          stats: `${room.ourBookings}/${room.totalUniqueUsers}`,
          percentage: `${room.utilizationPercentage}%`,
          priority: room.hasUserBookings
        })));
        
      } else {
        setError(response.data.message || 'Invalid response format');
        console.error('❌ RoomUtilization: Invalid response:', response.data);
      }
    } catch (error) {
      console.error('❌ RoomUtilization: Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to fetch room utilization data');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    console.log('🔄 RoomUtilization: Manual refresh triggered');
    setLoading(true);
    fetchUtilizationData();
  };

  // ✅ ENHANCED: Fetch data when filters change
  useEffect(() => {
    if (filterDateRange.startDate && filterDateRange.endDate) {
      console.log('📊 RoomUtilization: Filter changed, fetching new data');
      fetchUtilizationData();
    }
  }, [filterDateRange, activeFilter, token]);

  // ✅ NEW: Reset data at midnight for current day view
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
          console.log('🕛 RoomUtilization: Midnight reset - clearing current day data');
          setUtilizationData([]);
          // Fetch fresh data for the new day
          setTimeout(() => fetchUtilizationData(), 1000);
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkForMidnightReset, 60000);
    return () => clearInterval(interval);
  }, [selectedPeriod, selectedDate, activeFilter]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      console.log('🕐 RoomUtilization: Auto-refreshing data...');
      fetchUtilizationData();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [token, filterDateRange, activeFilter]);

  // Expose refresh function globally for other components to trigger
  useEffect(() => {
    window.refreshRoomUtilization = handleRefresh;
    return () => {
      delete window.refreshRoomUtilization;
    };
  }, []);

  // ✅ Show top 5 rooms, remaining in scroll
  const topRooms = utilizationData.slice(0, 5);
  const remainingRooms = utilizationData.slice(5);

  // ✅ Generate filter label for display
  const getFilterLabel = () => {
    if (activeFilter === 'date' && selectedDate) {
      return `for ${new Date(selectedDate).toLocaleDateString()}`;
    }
    return `for ${selectedPeriod}`;
  };

  return (
    <div className="content-card">
      <div className="content-header">
        <h3 className="content-title">
          <MdTrendingUp className="content-icon" />
          Room Utilization {getFilterLabel()}
        </h3>
        <button 
          className="refresh-button" 
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh data"
        >
          <MdRefresh className={`refresh-icon ${loading ? 'spinning' : ''}`} />
        </button>
      </div>
      <div className="content-body">
        <div className="utilization-list">
          {loading ? (
            // Show skeleton loading for 5 items
            [...Array(5)].map((_, index) => (
              <div key={index} className="utilization-item">
                <div className="utilization-header">
                  <div className="utilization-info">
                    <h4 className="room-name">Loading...</h4>
                    <p className="room-stats">Loading data...</p>
                  </div>
                  <span className="utilization-badge">--</span>
                </div>
                <div className="utilization-progress">
                  <div className="utilization-progress-bar skeleton-animation" style={{width: '60%'}}></div>
                </div>
              </div>
            ))
          ) : error ? (
            // Show error state
            <div className="utilization-error">
              <p className="error-message">Error: {error}</p>
              <button onClick={handleRefresh} className="retry-button">
                <MdRefresh className="retry-icon" />
                Retry
              </button>
            </div>
          ) : utilizationData.length === 0 ? (
            // Show empty state
            <div className="utilization-empty">
              <p className="empty-message">No room data available {getFilterLabel()}</p>
              <button onClick={handleRefresh} className="retry-button">
                <MdRefresh className="retry-icon" />
                Refresh
              </button>
            </div>
          ) : (
            // Show actual data for top 5 rooms
            topRooms.map((room) => (
              <div key={room.id} className="utilization-item">
                <div className="utilization-header">
                  <div className="utilization-info">
                    <h4 className="room-name">{room.name}</h4>
                    <p className="room-stats">{room.ourBookings}/{room.totalUniqueUsers} bookings</p>
                  </div>
                  <span className="utilization-badge">{room.utilizationPercentage}%</span>
                </div>
                <div className="utilization-progress">
                  <div 
                    className="utilization-progress-bar" 
                    style={{
                      width: `${room.utilizationPercentage}%`,
                      backgroundColor: getProgressBarColor(room.utilizationPercentage)
                    }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Scrollable section for remaining rooms */}
        {!loading && !error && remainingRooms.length > 0 && (
          <div className="utilization-scroll-section">
            {remainingRooms.map((room) => (
              <div key={room.id} className="utilization-item">
                <div className="utilization-header">
                  <div className="utilization-info">
                    <h4 className="room-name">{room.name}</h4>
                    <p className="room-stats">{room.ourBookings}/{room.totalUniqueUsers} bookings</p>
                  </div>
                  <span className="utilization-badge">{room.utilizationPercentage}%</span>
                </div>
                <div className="utilization-progress">
                  <div 
                    className="utilization-progress-bar" 
                    style={{
                      width: `${room.utilizationPercentage}%`,
                      backgroundColor: getProgressBarColor(room.utilizationPercentage)
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomUtilization;