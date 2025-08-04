import React, { useState } from 'react';
import './Week.css';

const Week = ({ weekData, onDateClick }) => {
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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

  // ✅ Format time for display
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12 === 0 ? 12 : hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="week-view-container">
      {/* Week day headers */}
      <div className="week-days-header">
        {weekData.map((day, index) => (
          <div
            key={index}
            className={`week-day-header ${day.isSelected ? 'selected' : ''} ${day.hasBookings ? 'has-bookings' : ''}`}
            onClick={() => onDateClick(day.date)}
          >
            <div className="week-day-name">{day.dayName}</div>
            <div className="week-day-number">{day.dayNumber}</div>
            {day.hasBookings && (
              <div className="week-booking-indicator">
                <span className="booking-count-badge">{day.bookings.length}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Week content area */}
      <div className="week-content-area">
        {weekData.map((day, index) => (
          <div key={index} className="week-day-column">
            <div className="week-day-bookings">
              {day.bookings.length === 0 ? (
                <div className="no-bookings-message">No bookings</div>
              ) : (
                <div className="week-bookings-list">
                  {day.bookings.map((booking, bookingIndex) => (
                    <div
                      key={bookingIndex}
                      className={`week-booking-slot ${booking.displayStatus}`}
                      onMouseEnter={(e) => handleBookingHover(booking, e)}
                      onMouseLeave={handleBookingLeave}
                    >
                      <div className="booking-time">
                        {formatTime(booking.startTime)}
                      </div>
                      <div className="booking-room">
                        {booking.roomName}
                      </div>
                      <div className="booking-purpose">
                        {booking.purpose.length > 20 ? 
                          `${booking.purpose.substring(0, 20)}...` : 
                          booking.purpose
                        }
                      </div>
                      <div className={`booking-status-badge ${booking.displayStatus}`}>
                        {booking.displayStatus}
                      </div>
                    </div>
                  ))}
                  
                  {/* ✅ Show scroll indicator if more bookings */}
                  {day.bookings.length > 3 && (
                    <div className="scroll-indicator">
                      Scroll for more
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
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

export default Week;