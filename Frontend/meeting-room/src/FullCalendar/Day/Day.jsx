import React, { useState } from 'react';
import { FiCalendar, FiClock, FiUsers, FiMapPin } from 'react-icons/fi';
import './Day.css';

const Day = ({ selectedDate, bookings }) => {
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ✅ Format time for display
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12 === 0 ? 12 : hour12}:${minutes} ${ampm}`;
  };

  // ✅ Generate comprehensive time slots (every 30 minutes)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // ✅ Map bookings to time slots
  const getBookingForTimeSlot = (timeSlot) => {
    return bookings.find(booking => booking.startTime === timeSlot);
  };

  // ✅ Check if time slot is occupied by an ongoing booking
  const getTimeSlotStatus = (timeSlot) => {
    const slotMinutes = timeToMinutes(timeSlot);
    
    const occupyingBooking = bookings.find(booking => {
      const startMinutes = timeToMinutes(booking.startTime);
      const endMinutes = timeToMinutes(booking.endTime);
      return slotMinutes >= startMinutes && slotMinutes < endMinutes;
    });
    
    if (occupyingBooking) {
      return {
        status: occupyingBooking.displayStatus,
        booking: occupyingBooking,
        isStart: occupyingBooking.startTime === timeSlot
      };
    }
    
    return { status: 'available' };
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

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

  // ✅ Create time columns (3 columns layout)
  const createTimeColumns = () => {
    const slotsPerColumn = Math.ceil(timeSlots.length / 3);
    const columns = [];
    
    for (let i = 0; i < 3; i++) {
      const columnSlots = timeSlots.slice(i * slotsPerColumn, (i + 1) * slotsPerColumn);
      columns.push(columnSlots);
    }
    return columns;
  };

  const timeColumns = createTimeColumns();

  // ✅ Get status counts
  const getStatusCounts = () => {
    const counts = {
      upcoming: 0,
      completed: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0
    };
    
    bookings.forEach(booking => {
      if (counts.hasOwnProperty(booking.displayStatus)) {
        counts[booking.displayStatus]++;
      }
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="day-view-container">
      {/* Enhanced day header */}

      {/* ✅ Bookings summary if any exist */}
      {bookings.length > 0 && (
        <div className="day-bookings-summary">
          <h4>Today's Bookings</h4>
          <div className="bookings-list">
            {bookings.map((booking, index) => (
              <div
                key={index}
                className={`booking-summary-card ${booking.displayStatus}`}
                onMouseEnter={(e) => handleBookingHover(booking, e)}
                onMouseLeave={handleBookingLeave}
              >
                <div className="booking-summary-header">
                  <span className="booking-room-name">{booking.roomName}</span>
                  <span className={`booking-status-label ${booking.displayStatus}`}>
                    {booking.displayStatus}
                  </span>
                </div>
                <div className="booking-summary-details">
                  <div className="booking-detail">
                    <FiClock size={12} />
                    <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                  </div>
                  <div className="booking-detail">
                    <FiUsers size={12} />
                    <span>{booking.attendees} people</span>
                  </div>
                </div>
                <div className="booking-purpose-summary">
                  {booking.purpose}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced time slots grid */}
      <div className="day-timeslots-section">
        <h4>Time Slots</h4>
        <div className="day-timeslots-grid">
          {timeColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="day-time-column">
              {column.map((slot, slotIndex) => {
                const slotStatus = getTimeSlotStatus(slot);
                const directBooking = getBookingForTimeSlot(slot);
                
                return (
                  <div 
                    key={slotIndex} 
                    className={`day-time-slot ${slotStatus.status}`}
                    onMouseEnter={(e) => slotStatus.booking && handleBookingHover(slotStatus.booking, e)}
                    onMouseLeave={handleBookingLeave}
                  >
                    <div className="day-time-label">{formatTime(slot)}</div>
                    <div className={`day-availability-status ${slotStatus.status}`}>
                      {slotStatus.status === 'available' ? (
                        <span className="day-status-text">Available</span>
                      ) : (
                        <div className="day-booking-info">
                          {slotStatus.isStart && (
                            <div className="booking-start-indicator">
                              <FiMapPin size={10} />
                              <span className="booking-room-mini">{slotStatus.booking.roomName}</span>
                            </div>
                          )}
                          {!slotStatus.isStart && (
                            <span className="day-status-text">Occupied</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Empty state */}
      {bookings.length === 0 && (
        <div className="day-empty-state">
          <FiCalendar size={48} />
          <h3>No bookings for this day</h3>
          <p>You have a free schedule today!</p>
        </div>
      )}

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

export default Day;