import React, { useState, useEffect } from "react";
import { MdBarChart, MdRefresh } from 'react-icons/md';
import { IoChevronDown } from 'react-icons/io5';
import BarChart from './Barchart/BarChart';
import DoughnutChart from './Doughnut/DoughnutChart';
import axios from 'axios';
import './ChartSwitcher.css'

const ChartSwitcher = ({ selectedPeriod, selectedDate, filterDateRange, activeFilter }) => {
  const [chartType, setChartType] = useState("bar");
  const [showDropdown, setShowDropdown] = useState(false);
  const [bookingData, setBookingData] = useState({
    overall: { approved: 0, pending: 0, rejected: 0 },
    weekly: [],
    loading: true,
    error: null
  });

  const token = sessionStorage.getItem('token');

  // ✅ ENHANCED: Fetch user booking statistics with filter parameters
  const fetchBookingStats = async () => {
    if (!token) {
      setBookingData(prev => ({ ...prev, loading: false, error: 'No authentication token' }));
      return;
    }

    try {
      setBookingData(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('📊 ChartSwitcher: Fetching statistics with filter:', {
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

      const response = await axios.get(`http://localhost:5000/api/bookings/my-stats?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📊 ChartSwitcher: Received booking statistics:', response.data);
      
      setBookingData({
        overall: response.data.overall,
        weekly: response.data.weekly,
        totalBookings: response.data.totalBookings,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('❌ ChartSwitcher: Error fetching booking statistics:', error);
      setBookingData(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch booking statistics'
      }));
    }
  };

  // ✅ ENHANCED: Fetch data when filters change
  useEffect(() => {
    if (filterDateRange.startDate && filterDateRange.endDate) {
      console.log('📊 ChartSwitcher: Filter changed, fetching new data');
      fetchBookingStats();
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
          console.log('🕛 ChartSwitcher: Midnight reset - clearing current day chart data');
          setBookingData({
            overall: { approved: 0, pending: 0, rejected: 0 },
            weekly: [],
            loading: false,
            error: null
          });
          // Fetch fresh data for the new day
          setTimeout(() => fetchBookingStats(), 1000);
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkForMidnightReset, 60000);
    return () => clearInterval(interval);
  }, [selectedPeriod, selectedDate, activeFilter]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(fetchBookingStats, 30000);
    return () => clearInterval(interval);
  }, [token, filterDateRange, activeFilter]);

  const handleSelection = (type) => {
    setChartType(type);
    setShowDropdown(false);
  };

  const handleRefresh = () => {
    fetchBookingStats();
  };

  // ✅ Generate filter label for display
  const getFilterLabel = () => {
    if (activeFilter === 'date' && selectedDate) {
      return `for ${new Date(selectedDate).toLocaleDateString()}`;
    }
    return `${selectedPeriod}`;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">
          <MdBarChart className="chart-icon" />
          My Booking Trends {getFilterLabel()}
          {bookingData.loading && <span className="loading-indicator">Loading...</span>}
        </h3>
        <div className="chart-controls">
          <button 
            className="refresh-button"
            onClick={handleRefresh}
            disabled={bookingData.loading}
            title="Refresh data"
          >
            <MdRefresh className={`refresh-icon ${bookingData.loading ? 'spinning' : ''}`} />
          </button>
          <div className="dropdown">
            <button 
              className="dropdown-button" 
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {chartType === "bar" ? "Bar Chart" : "Pie Chart"}
              <IoChevronDown className="dropdown-icon" />
            </button>
            {showDropdown && (
              <ul className="dropdown-menu">
                <li onClick={() => handleSelection("bar")}>Bar Chart</li>
                <li onClick={() => handleSelection("pie")}>Pie Chart</li>
              </ul>
            )}
          </div>
        </div>
      </div>
      
      <div className="chart-content">
        {bookingData.error ? (
          <div className="error-message">
            <p>❌ {bookingData.error}</p>
            <button onClick={handleRefresh} className="retry-button">
              Retry
            </button>
          </div>
        ) : (
          <div className="chart-container">
            {chartType === "bar" ? (
              <BarChart 
                data={bookingData.weekly} 
                loading={bookingData.loading}
                filterLabel={getFilterLabel()}
              />
            ) : (
              <DoughnutChart 
                data={bookingData.overall} 
                loading={bookingData.loading}
                filterLabel={getFilterLabel()}
              />
            )}
          </div>
        )}
        
        <div className="chart-legend">
          <div className="legend-title">Color Guide:</div>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
              <span className="legend-label">Approved Bookings</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="legend-label">Pending Approval</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="legend-label">Rejected Bookings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartSwitcher;