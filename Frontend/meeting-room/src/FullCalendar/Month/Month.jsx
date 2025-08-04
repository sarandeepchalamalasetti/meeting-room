import React, { useState } from 'react';
import './Month.css';

const Month = ({ calendarData, onDateClick }) => {
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [expandedCells, setExpandedCells] = useState(new Set());

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ✅ Handle booking hover for tooltip
  const handleBookingHover = (booking, event) => {
    if (!booking) {
      setHoveredBooking(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoveredBooking(booking);
  };

  const handleBookingLeave = () => {
    setHoveredBooking(null);
  };

  // ✅ Handle "X+ more" click to expand/collapse cell
  const handleMoreClick = (dateString, event) => {
    event.stopPropagation(); // Prevent date click
    const newExpanded = new Set(expandedCells);
    if (newExpanded.has(dateString)) {
      newExpanded.delete(dateString);
    } else {
      newExpanded.add(dateString);
    }
    setExpandedCells(newExpanded);
  };

  // ✅ Get status color for booking indicators
  const getStatusColor = (status) => {
    const colorMap = {
      upcoming: '#3b82f6',
      completed: '#10b981',
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      cancelled: '#6b7280'
    };
    return colorMap[status] || '#6b7280';
  };

  // ✅ Get status background color for booking cards
  const getStatusBackground = (status) => {
    const backgroundMap = {
      upcoming: '#dbeafe',
      completed: '#d1fae5',
      pending: '#fef3c7',
      approved: '#d1fae5',
      rejected: '#fee2e2',
      cancelled: '#f3f4f6'
    };
    return backgroundMap[status] || '#f3f4f6';
  };

  // ✅ Format time for display
  const formatTime = (time) => {
    return time; // Keep 24-hour format
  };

  // ✅ Shorten room name for compact display
  const shortenRoomName = (roomName) => {
    return roomName
      .replace('Conference Room ', 'Conf ')
      .replace('Meeting Room ', 'Meet ')
      .replace('Board Room ', 'Board ')
      .replace('Room ', '');
  };

  // ✅ Generate a unique key for each date cell
  const getDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="month-view-container">
      {/* Week day headers */}
      <div className="month-weekday-headers">
        {weekDays.map((day) => (
          <div key={day} className="month-weekday-header">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="month-calendar-grid">
        {calendarData.map((dayData, index) => {
          const dateKey = getDateKey(dayData.date);
          const isExpanded = expandedCells.has(dateKey);
          const maxVisibleBookings = isExpanded ? dayData.bookings.length : 2;
          const visibleBookings = dayData.bookings.slice(0, maxVisibleBookings);
          const hiddenCount = dayData.bookings.length - maxVisibleBookings;

          return (
            <div
              key={index}
              className={`month-calendar-cell ${
                !dayData.isCurrentMonth ? 'other-month' : ''
              } ${dayData.isToday ? 'today' : ''} ${
                dayData.isSelected ? 'selected' : ''
              } ${dayData.hasBookings ? 'has-bookings' : ''}`}
              onClick={() => onDateClick(dayData.date)}
            >
              <div className="month-date-number">
                {dayData.date.getDate()}
              </div>
              
              <div className="month-cell-content">
                {dayData.isCurrentMonth && dayData.bookings && dayData.bookings.length > 0 && (
                  <div className="month-booking-cards">
                    {/* ✅ Show simplified booking cards */}
                    {visibleBookings.map((booking, bookingIndex) => (
                      <div
                        key={bookingIndex}
                        className={`month-booking-card ${booking.displayStatus}`}
                        style={{
                          backgroundColor: getStatusBackground(booking.displayStatus),
                          borderLeftColor: getStatusColor(booking.displayStatus)
                        }}
                        onMouseEnter={(e) => handleBookingHover(booking, e)}
                        onMouseLeave={handleBookingLeave}
                      >
                        {/* ✅ Single line: Room name and time range */}
                        <div className="booking-card-title">
                          {shortenRoomName(booking.roomName)} {formatTime(booking.startTime)}-{formatTime(booking.endTime)}
                        </div>
                      </div>
                    ))}
                    
                    {/* ✅ Show expandable overflow indicator */}
                    {hiddenCount > 0 && !isExpanded && (
                      <div 
                        className="booking-overflow clickable"
                        onClick={(e) => handleMoreClick(dateKey, e)}
                      >
                        {hiddenCount}+ more
                      </div>
                    )}
                    
                    {/* ✅ Show collapse option when expanded */}
                    {isExpanded && dayData.bookings.length > 2 && (
                      <div 
                        className="booking-collapse clickable"
                        onClick={(e) => handleMoreClick(dateKey, e)}
                      >
                        Show less
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ Booking hover tooltip */}
      {hoveredBooking && (
        <div
          className="booking-tooltip"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="tooltip-header">
            {hoveredBooking.roomName}
          </div>
          <div className="tooltip-content">
            <div className="tooltip-row">
              <span className="tooltip-label">Time:</span>
              <span className="tooltip-value">
                {formatTime(hoveredBooking.startTime)} - {formatTime(hoveredBooking.endTime)}
              </span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Duration:</span>
              <span className="tooltip-value">{hoveredBooking.duration}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Attendees:</span>
              <span className="tooltip-value">{hoveredBooking.attendees} people</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Purpose:</span>
              <span className="tooltip-value">{hoveredBooking.purpose}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Status:</span>
              <span className={`status-indicator ${hoveredBooking.displayStatus}`}>
                {hoveredBooking.displayStatus}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Month;