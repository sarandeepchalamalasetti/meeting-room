import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdBarChart, MdAdd, MdRefresh } from 'react-icons/md';
import { FaCheckCircle, FaClock, FaLock, FaUser, FaCalendarAlt, FaMapMarkerAlt, FaBriefcase } from 'react-icons/fa';
import { BiTime } from 'react-icons/bi';
import { HiOutlineUsers } from 'react-icons/hi';
import axios from 'axios';
import './BookingSummary.css';

export function BookingSummary({ selectedPeriod, selectedDate, filterDateRange, activeFilter }) {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');
  
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedWing, setSelectedWing] = useState('all');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Tooltip state
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: null,
    position: { x: 0, y: 0 },
    showBelow: false
  });
  
  // Data states
  const [statistics, setStatistics] = useState({
    available: 0,
    pending: 0,
    booked: 0,
    totalRooms: 0
  });
  const [heatmapData, setHeatmapData] = useState({
    timeSlots: [],
    rooms: []
  });
  const [filters, setFilters] = useState({
    floors: [],
    wings: []
  });

  // ✅ ENHANCED: Fetch room statistics with filter parameters
  const fetchStatistics = async () => {
    if (!token) return;
    
    try {
      // ✅ NEW: Build query parameters based on active filter
      const queryParams = new URLSearchParams();
      
      if (activeFilter === 'date' && selectedDate) {
        queryParams.append('date', selectedDate);
        queryParams.append('startDate', filterDateRange.startDate);
        queryParams.append('endDate', filterDateRange.endDate);
        queryParams.append('filterType', 'custom_date');
      } else if (activeFilter === 'period') {
        // For period filter, use the start date for the main date param
        queryParams.append('date', filterDateRange.startDate);
        queryParams.append('startDate', filterDateRange.startDate);
        queryParams.append('endDate', filterDateRange.endDate);
        queryParams.append('filterType', filterDateRange.type);
      }

      console.log('📊 BookingSummary: Fetching statistics with filter:', {
        period: selectedPeriod,
        date: selectedDate,
        dateRange: filterDateRange,
        activeFilter,
        queryParams: queryParams.toString()
      });

      const response = await axios.get(`http://localhost:5000/api/rooms/statistics?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStatistics(response.data);
      console.log('📊 BookingSummary: Statistics updated:', response.data);
    } catch (error) {
      console.error('❌ BookingSummary: Error fetching statistics:', error);
    }
  };

  // ✅ ENHANCED: Fetch heatmap data with filter parameters
  const fetchHeatmapData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // ✅ NEW: Build query parameters based on active filter
      const queryParams = new URLSearchParams();
      
      if (activeFilter === 'date' && selectedDate) {
        queryParams.append('date', selectedDate);
      } else if (activeFilter === 'period') {
        // For period filter, use the start date but note this is for heatmap of single day
        queryParams.append('date', filterDateRange.startDate);
      }
      
      queryParams.append('floor', selectedFloor);
      queryParams.append('wing', selectedWing);

      console.log('🗺️ BookingSummary: Fetching heatmap with filter:', {
        period: selectedPeriod,
        date: selectedDate,
        dateRange: filterDateRange,
        activeFilter,
        floor: selectedFloor,
        wing: selectedWing,
        queryParams: queryParams.toString()
      });

      const response = await axios.get(`http://localhost:5000/api/rooms/heatmap?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setHeatmapData(response.data);
      setLastUpdated(new Date());
      console.log('🗺️ BookingSummary: Heatmap data updated:', response.data.rooms.length, 'rooms');
    } catch (error) {
      console.error('❌ BookingSummary: Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available filters
  const fetchFilters = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rooms/filters');
      setFilters(response.data);
    } catch (error) {
      console.error('❌ BookingSummary: Error fetching filters:', error);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchFilters();
  }, []);

  // ✅ ENHANCED: Fetch data when dependencies change
  useEffect(() => {
    if (token && filterDateRange.startDate && filterDateRange.endDate) {
      console.log('📊 BookingSummary: Filter changed, fetching new data');
      fetchStatistics();
      fetchHeatmapData();
    }
  }, [token, filterDateRange, activeFilter, selectedFloor, selectedWing]);

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
          console.log('🕛 BookingSummary: Midnight reset - clearing current day data');
          setStatistics({ available: 0, pending: 0, booked: 0, totalRooms: 0 });
          setHeatmapData({ timeSlots: [], rooms: [] });
          // Fetch fresh data for the new day
          setTimeout(() => {
            fetchStatistics();
            fetchHeatmapData();
          }, 1000);
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkForMidnightReset, 60000);
    return () => clearInterval(interval);
  }, [selectedPeriod, selectedDate, activeFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      fetchStatistics();
      fetchHeatmapData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [token, filterDateRange, activeFilter, selectedFloor, selectedWing]);

  // Handle quick book navigation
  const handleQuickBook = () => {
    navigate('/bookroom');
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchStatistics();
    fetchHeatmapData();
  };

  // Get cell color based on status
  const getCellColor = (timeSlotData) => {
    if (!timeSlotData) return 'bookingsummary-heat-empty';
    
    switch (timeSlotData.status) {
      case 'approved':
        return 'bookingsummary-heat-approved';
      case 'pending':
        return 'bookingsummary-heat-pending';
      case 'rejected':
        return 'bookingsummary-heat-rejected';
      case 'available':
        return timeSlotData.isPastTime ? 'bookingsummary-heat-past' : 'bookingsummary-heat-available';
      default:
        return 'bookingsummary-heat-empty';
    }
  };

  // Get cell content
  const getCellContent = (timeSlotData) => {
    if (!timeSlotData) return '';
    
    if (timeSlotData.status === 'available' && !timeSlotData.isPastTime) {
      return timeSlotData.capacity || '';
    }
    
    if (timeSlotData.attendees) {
      return timeSlotData.attendees;
    }
    
    return '';
  };

  // ✅ Enhanced mouse enter handler with viewport positioning
  const handleMouseEnter = (event, room, timeSlot, timeSlotData) => {
    const rect = event.target.getBoundingClientRect();
    
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    
    const tooltipHeight = 120;
    const showBelow = y < tooltipHeight;
    
    const tooltipContent = createTooltipContent(room, timeSlot, timeSlotData);
    
    setTooltip({
      visible: true,
      content: tooltipContent,
      position: { 
        x, 
        y: showBelow ? y + rect.height + 10 : y
      },
      showBelow: showBelow
    });
  };

  // Handle mouse leave for tooltip
  const handleMouseLeave = () => {
    setTooltip({
      visible: false,
      content: null,
      position: { x: 0, y: 0 },
      showBelow: false
    });
  };

  // Create tooltip content
  const createTooltipContent = (room, timeSlot, timeSlotData) => {
    if (!timeSlotData) {
      return {
        type: 'empty',
        title: 'No Data',
        room: room.roomName,
        time: timeSlot,
        details: []
      };
    }

    if (timeSlotData.status === 'available') {
      return {
        type: 'available',
        title: timeSlotData.isPastTime ? 'Past Time' : 'Available',
        room: room.roomName,
        time: timeSlot,
        details: [
          { icon: <FaMapMarkerAlt />, label: 'Location', value: `${room.floor} • ${room.wing}` },
          { icon: <HiOutlineUsers />, label: 'Capacity', value: `${timeSlotData.capacity} people` },
          { icon: <FaCheckCircle />, label: 'Status', value: timeSlotData.isPastTime ? 'Past Time' : 'Available' }
        ]
      };
    }

    return {
      type: timeSlotData.status,
      title: getStatusTitle(timeSlotData.status),
      room: room.roomName,
      time: timeSlot,
      details: [
        { icon: <FaUser />, label: 'Booked by', value: timeSlotData.bookedBy.name },
        { icon: <FaBriefcase />, label: 'Role', value: timeSlotData.bookedBy.role },
        { icon: <BiTime />, label: 'Duration', value: `${timeSlotData.startTime} - ${timeSlotData.endTime}` },
        { icon: <HiOutlineUsers />, label: 'Attendees', value: `${timeSlotData.attendees} people` },
        { icon: <FaCalendarAlt />, label: 'Purpose', value: timeSlotData.purpose },
        { icon: <FaMapMarkerAlt />, label: 'Location', value: `${room.floor} • ${room.wing}` }
      ]
    };
  };

  // Get status title
  const getStatusTitle = (status) => {
    switch (status) {
      case 'approved': return 'Approved Booking';
      case 'pending': return 'Pending Approval';
      case 'rejected': return 'Rejected Booking';
      default: return 'Booking';
    }
  };

  // ✅ Generate filter label for display
  const getFilterLabel = () => {
    if (activeFilter === 'date' && selectedDate) {
      return `for ${new Date(selectedDate).toLocaleDateString()}`;
    }
    return `${selectedPeriod}`;
  };

  // ✅ Generate period appropriate label for heatmap
  const getHeatmapLabel = () => {
    if (activeFilter === 'date' && selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const today = new Date();
      if (selectedDateObj.toDateString() === today.toDateString()) {
        return 'Live Room Utilization (Today)';
      } else {
        return `Room Utilization for ${selectedDateObj.toLocaleDateString()}`;
      }
    } else if (selectedPeriod === 'Today') {
      return 'Live Room Utilization (Today)';
    } else {
      return `Room Utilization Overview`;
    }
  };

  return (
    <div className="bookingsummary-card">
      {/* Header with Status Cards */}
      <div className="bookingsummary-header">
        <div className="bookingsummary-title-section">
          <MdBarChart className="bookingsummary-title-icon" />
          <h3 className="bookingsummary-title">Room Booking Overview {getFilterLabel()}</h3>
          {lastUpdated && (
            <span className="bookingsummary-last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="bookingsummary-header-actions">
          <button 
            className="bookingsummary-refresh-btn" 
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh data"
          >
            <MdRefresh className={`bookingsummary-refresh-icon ${loading ? 'bookingsummary-spinning' : ''}`} />
          </button>
          <button className="bookingsummary-quick-book-btn" onClick={handleQuickBook}>
            <MdAdd className="bookingsummary-btn-icon" />
            Quick Book
          </button>
        </div>
      </div>

      {/* Status Cards Row */}
      <div className="bookingsummary-stats-header">
        <div className="bookingsummary-stat-card bookingsummary-available">
          <div className="bookingsummary-stat-main">
            <div className="bookingsummary-stat-value">{statistics.available}</div>
            <FaCheckCircle className="bookingsummary-stat-icon" />
          </div>
          <div className="bookingsummary-stat-label">Available Rooms</div>
        </div>
        
        <div className="bookingsummary-stat-card bookingsummary-pending">
          <div className="bookingsummary-stat-main">
            <div className="bookingsummary-stat-value">{statistics.pending}</div>
            <FaClock className="bookingsummary-stat-icon" />
          </div>
          <div className="bookingsummary-stat-label">Pending Approvals</div>
        </div>
        
        <div className="bookingsummary-stat-card bookingsummary-booked">
          <div className="bookingsummary-stat-main">
            <div className="bookingsummary-stat-value">{statistics.booked}</div>
            <FaLock className="bookingsummary-stat-icon" />
          </div>
          <div className="bookingsummary-stat-label">Active Bookings</div>
        </div>
      </div>
      
      <div className="bookingsummary-content">
        <div className="bookingsummary-filters">
          <div className="bookingsummary-filter-group">
            <label className="bookingsummary-filter-label">Floor</label>
            <select 
              className="bookingsummary-select"
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
            >
              <option value="all">All Floors</option>
              {filters.floors.map(floor => (
                <option key={floor} value={floor}>{floor}</option>
              ))}
            </select>
          </div>
          
          <div className="bookingsummary-filter-group">
            <label className="bookingsummary-filter-label">Wing</label>
            <select 
              className="bookingsummary-select"
              value={selectedWing}
              onChange={(e) => setSelectedWing(e.target.value)}
            >
              <option value="all">All Wings</option>
              {filters.wings.map(wing => (
                <option key={wing} value={wing}>{wing}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bookingsummary-section">
          <div className="bookingsummary-section-header">
            <h4 className="bookingsummary-section-title">
              {getHeatmapLabel()}
            </h4>
            {loading && <div className="bookingsummary-loading-indicator">Loading...</div>}
          </div>
          
          {/* Heatmap with Custom Tooltip */}
          <div className="bookingsummary-heatmap-container">
            <div className="bookingsummary-heatmap">
              {/* Time headers */}
              <div className="bookingsummary-time-headers">
                <div className="bookingsummary-room-header"></div>
                {heatmapData.timeSlots.map((time, index) => (
                  <div key={index} className="bookingsummary-time-slot">
                    {time}
                  </div>
                ))}
              </div>
              
              {/* Room rows */}
              {heatmapData.rooms.length === 0 ? (
                <div className="bookingsummary-no-rooms">
                  {loading ? 'Loading rooms...' : `No rooms found ${getFilterLabel()}`}
                </div>
              ) : (
                heatmapData.rooms.map((room, roomIndex) => (
                  <div key={room.roomId} className="bookingsummary-room-row">
                    <div className="bookingsummary-room-name" title={`${room.roomName}\n${room.floor} • ${room.wing}\nCapacity: ${room.capacity}`}>
                      {room.roomName}
                    </div>
                    {room.timeSlots.map((timeSlotData, timeIndex) => (
                      <div
                        key={timeIndex}
                        className={`bookingsummary-heat-cell ${getCellColor(timeSlotData)}`}
                        onMouseEnter={(e) => handleMouseEnter(e, room, heatmapData.timeSlots[timeIndex], timeSlotData)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {getCellContent(timeSlotData)}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Color Guide */}
        <div className="bookingsummary-color-guide">
          <div className="bookingsummary-guide-title">Status Legend:</div>
          <div className="bookingsummary-guide-items">
            <div className="bookingsummary-guide-item">
              <div className="bookingsummary-guide-color bookingsummary-guide-approved"></div>
              <span>Approved/Booked</span>
            </div>
            <div className="bookingsummary-guide-item">
              <div className="bookingsummary-guide-color bookingsummary-guide-pending"></div>
              <span>Pending Approval</span>
            </div>
            <div className="bookingsummary-guide-item">
              <div className="bookingsummary-guide-color bookingsummary-guide-rejected"></div>
              <span>Rejected</span>
            </div>
            <div className="bookingsummary-guide-item">
              <div className="bookingsummary-guide-color bookingsummary-guide-available"></div>
              <span>Available (shows capacity)</span>
            </div>
            <div className="bookingsummary-guide-item">
              <div className="bookingsummary-guide-color bookingsummary-guide-past"></div>
              <span>Past Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Tooltip rendered outside container to prevent clipping */}
      {tooltip.visible && tooltip.content && (
        <div 
          className={`bookingsummary-tooltip-portal bookingsummary-custom-tooltip bookingsummary-tooltip-${tooltip.content.type} ${tooltip.showBelow ? 'bookingsummary-tooltip-below' : ''}`}
          style={{
            left: `${tooltip.position.x}px`,
            top: `${tooltip.position.y}px`,
          }}
        >
          <div className={`bookingsummary-tooltip-arrow ${tooltip.showBelow ? 'bookingsummary-tooltip-arrow-above' : ''}`}></div>
          <div className="bookingsummary-tooltip-header">
            <div className="bookingsummary-tooltip-title">{tooltip.content.title}</div>
            <div className="bookingsummary-tooltip-room">{tooltip.content.room}</div>
            <div className="bookingsummary-tooltip-time">{tooltip.content.time}</div>
          </div>
          <div className="bookingsummary-tooltip-content">
            {tooltip.content.details.map((detail, index) => (
              <div key={index} className="bookingsummary-tooltip-detail">
                <div className="bookingsummary-tooltip-detail-icon">
                  {detail.icon}
                </div>
                <div className="bookingsummary-tooltip-detail-text">
                  <span className="bookingsummary-tooltip-detail-label">{detail.label}:</span>
                  <span className="bookingsummary-tooltip-detail-value">{detail.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingSummary;