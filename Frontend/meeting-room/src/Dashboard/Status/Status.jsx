import React, { useState, useEffect } from 'react';
import './Status.css';

const Status = ({ selectedPeriod, selectedDate, filterDateRange, activeFilter }) => {
  const [statusData, setStatusData] = useState({
    total: 0,
    available: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get user data from sessionStorage
  const getUserData = () => {
    try {
      const userData = sessionStorage.getItem('user');
      return userData ? JSON.parse(userData) : { role: 'employee' };
    } catch (error) {
      return { role: 'employee' };
    }
  };

  const user = getUserData();
  const token = sessionStorage.getItem('token');

  // ✅ ENHANCED: Fetch statistics with filter parameters
  const fetchStatusData = async () => {
    if (!token) {
      setError('No authentication token found');
      setStatusData(getFallbackData(user.role));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Status: Fetching statistics with filter:', {
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

      const response = await fetch(`http://localhost:5000/api/bookings/statistics?${queryParams.toString()}`, {
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
      console.log('📊 Status: Statistics response:', data);

      if (data.success && data.data) {
        setStatusData(data.data);
        console.log('✅ Status: Statistics loaded with filter:', data.data);
      } else {
        throw new Error(data.message || 'Failed to load statistics');
      }
    } catch (error) {
      console.error('❌ Status: Failed to fetch filtered status data:', error);
      setError(error.message);
      setStatusData(getFallbackData(user.role));
    } finally {
      setLoading(false);
    }
  };

  // Fallback data when API fails
  const getFallbackData = (role) => {
    switch (role) {
      case 'manager':
        return { total: 0, available: 25, approved: 0, pending: 0, rejected: 0 };
      case 'hr':
        return { total: 0, available: 25, cancelled: 0 };
      case 'employee':
      default:
        return { total: 0, available: 25, approved: 0, pending: 0, rejected: 0 };
    }
  };

  // ✅ ENHANCED: Fetch data when filters change
  useEffect(() => {
    if (filterDateRange.startDate && filterDateRange.endDate) {
      console.log('📊 Status: Filter changed, fetching new data');
      fetchStatusData();
    }
  }, [filterDateRange, activeFilter, user.role, token]);

  // ✅ NEW: Reset to zero at midnight but preserve filtered data
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
          console.log('🕛 Status: Midnight reset - showing zeros for current day');
          setStatusData(getFallbackData(user.role));
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkForMidnightReset, 60000);
    return () => clearInterval(interval);
  }, [selectedPeriod, selectedDate, activeFilter, user.role]);

  // ✅ UPDATED: Get status configuration based on role with Available card for Manager and Employee
  const getStatusConfig = () => {
    const filterLabel = activeFilter === 'date' && selectedDate 
      ? `for ${new Date(selectedDate).toLocaleDateString()}` 
      : `for ${selectedPeriod}`;

    switch (user.role) {
      case 'manager':
        return {
          cards: [
            {
              label: `My Total Bookings`,
              value: loading ? '...' : statusData.total,
              color: '#2563eb',
              icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
              iconContainer: 'stats-icon-primary',
              trend: `Rooms I booked ${filterLabel}`,
              trendUp: true
            },
            {
              label: "Available Rooms",
              value: loading ? '...' : statusData.available,
              color: '#10b981',
              icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
              iconContainer: 'stats-icon-available',
              trend: 'Ready to book now',
              trendUp: true
            },
            {
              label: "Approvals Given",
              value: loading ? '...' : statusData.approved,
              color: '#16a34a',
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
              iconContainer: 'stats-icon-success',
              trend: `Requests I approved ${filterLabel}`,
              trendUp: true
            },
            {
              label: "Pending My Review",
              value: loading ? '...' : statusData.pending,
              color: '#ca8a04',
              icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
              iconContainer: 'stats-icon-warning',
              trend: 'Awaiting my approval',
              trendUp: false
            },
            {
              label: "Rejections Given",
              value: loading ? '...' : statusData.rejected,
              color: '#dc2626',
              icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
              iconContainer: 'stats-icon-error',
              trend: `Requests I rejected ${filterLabel}`,
              trendUp: true
            }
          ]
        };

      case 'hr':
        return {
          cards: [
            {
              label: "My Total Bookings",
              value: loading ? '...' : statusData.total,
              color: '#2563eb',
              icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
              iconContainer: 'stats-icon-primary',
              trend: `My requests ${filterLabel}`,
              trendUp: true
            },
            {
              label: "Available Rooms",
              value: loading ? '...' : statusData.available,
              color: '#10b981',
              icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
              iconContainer: 'stats-icon-available',
              trend: 'Ready to book now',
              trendUp: true
            },
            {
              label: "My Cancelled",
              value: loading ? '...' : statusData.cancelled,
              color: '#dc2626',
              icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
              iconContainer: 'stats-icon-error',
              trend: `Bookings I cancelled ${filterLabel}`,
              trendUp: false
            }
          ]
        };

      case 'employee':
      default:
        return {
          cards: [
            {
              label: "My Total Requests",
              value: loading ? '...' : statusData.total,
              color: '#2563eb',
              icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
              iconContainer: 'stats-icon-primary',
              trend: `All my requests ${filterLabel}`,
              trendUp: true
            },
            {
              label: "Available Rooms",
              value: loading ? '...' : statusData.available,
              color: '#10b981',
              icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
              iconContainer: 'stats-icon-available',
              trend: 'Ready to book now',
              trendUp: true
            },
            {
              label: "My Approved",
              value: loading ? '...' : statusData.approved,
              color: '#16a34a',
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
              iconContainer: 'stats-icon-success',
              trend: `Approved ${filterLabel}`,
              trendUp: true
            },
            {
              label: "My Pending",
              value: loading ? '...' : statusData.pending,
              color: '#ca8a04',
              icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
              iconContainer: 'stats-icon-warning',
              trend: 'Awaiting manager approval',
              trendUp: false
            },
            {
              label: "My Rejected",
              value: loading ? '...' : statusData.rejected,
              color: '#dc2626',
              icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
              iconContainer: 'stats-icon-error',
              trend: 'Need to revise request',
              trendUp: true
            }
          ]
        };
    }
  };

  const config = getStatusConfig();

  // ✅ NEW: Error state display (keeping same UI structure)
  if (error) {
    return (
      <div className="status-stats-grid">
        <div className="stats-card error-card">
          <div className="stats-card-body">
            <p className="stats-label">Failed to Load Statistics</p>
            <div className="stats-row-between">
              <h3 className="stats-value" style={{ color: '#dc2626', margin: 0 }}>
                Error
              </h3>
              <div className="stats-icon-container stats-icon-error">
                <svg className="stats-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="stats-change">
              <button onClick={fetchStatusData} className="retry-button">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`status-stats-grid ${user.role === 'hr' ? 'hr-layout' : 'full-layout'}`}>
      {config.cards.map((card, index) => (
        <div key={index} className="stats-card">
          <div className="stats-card-body">
            {/* Line 1: Label */}
            <p className="stats-label">{card.label}</p>

            {/* Line 2: Number and Icon */}
            <div className="stats-row-between">
              <h3 className="stats-value" style={{ color: card.color, margin: 0 }}>
                {card.value}
              </h3>
              <div className={`stats-icon-container ${card.iconContainer}`}>
                <svg className="stats-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.icon} />
                </svg>
              </div>
            </div>

            {/* Line 3: Trend info */}
            <div className="stats-change">
              <svg 
                className={`trend-icon ${card.trendUp ? 'trend-up' : 'trend-down'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d={card.trendUp 
                    ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
                    : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  } 
                />
              </svg>
              <span className={`trend-text ${card.trendUp ? 'trend-positive' : 'trend-negative'}`}>
                {card.trend}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Status;