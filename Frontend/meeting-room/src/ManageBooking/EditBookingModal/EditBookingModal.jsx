import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditBookingModal.css';
import { 
  FaSave, 
  FaTimes, 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaUsers,
  FaFileAlt,
  FaExclamationTriangle,
  FaEdit,
  FaBan,
  FaUserClock
} from 'react-icons/fa';

const EditBookingModal = ({ booking, isOpen, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    duration: 60,
    room: '',
    attendees: 1,
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [availableRooms] = useState([
    'Conference A1',
    'Board Room A1',
    'Training A4',
    'Board Room B1',
    'Meeting Room C2',
    'Conference B2',
    'Training B3',
    'Meeting Room A3'
  ]);

  // Time slots for dropdown
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = sessionStorage.getItem('token');

  // Helper functions for conflict detection
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isTimeOverlapping = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1;
  };

  // Get conflicting booking info
  const getConflictingBookingInfo = (roomName, date, startTime, durationMinutes) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + parseInt(durationMinutes);
    
    const conflictingBookings = bookings.filter(bookingItem => 
      bookingItem.roomName === roomName && 
      bookingItem.date === date &&
      (bookingItem.status === 'approved' || bookingItem.status === 'pending') &&
      bookingItem._id !== booking?.id // Exclude current booking being edited
    );

    for (let conflictBooking of conflictingBookings) {
      const bookingStartMinutes = timeToMinutes(conflictBooking.startTime);
      const bookingEndMinutes = timeToMinutes(conflictBooking.endTime);
      
      if (isTimeOverlapping(startMinutes, endMinutes, bookingStartMinutes, bookingEndMinutes)) {
        return {
          hasConflict: true,
          conflictingBooking: conflictBooking,
          bookedBy: conflictBooking.bookedBy?.name || conflictBooking.bookedBy?.username || 'Unknown User',
          timeSlot: `${conflictBooking.startTime} to ${conflictBooking.endTime}`
        };
      }
    }
    
    return { hasConflict: false };
  };

  // ✅ FIXED: Check current form for conflicts only when all required fields are filled
  const checkCurrentFormConflict = () => {
    // Only check for conflicts when all required fields are filled
    if (!formData.room || !formData.date || !formData.startTime || !formData.duration) {
      return null;
    }

    const conflictInfo = getConflictingBookingInfo(
      formData.room, 
      formData.date, 
      formData.startTime, 
      formData.duration
    );

    if (conflictInfo.hasConflict) {
      const conflictingBooking = conflictInfo.conflictingBooking;
      
      // Format the date for better display
      const formatDate = (dateStr) => {
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        } catch (error) {
          return dateStr;
        }
      };

      return {
        message: `This time slot is already booked! The room "${formData.room}" is reserved from ${conflictingBooking.startTime} to ${conflictingBooking.endTime} on ${formatDate(conflictingBooking.date)} by ${conflictingBooking.bookedBy.name}.`,
        conflictingBooking: {
          startTime: conflictingBooking.startTime,
          endTime: conflictingBooking.endTime,
          date: conflictingBooking.date,
          bookedBy: conflictingBooking.bookedBy.name,
          status: conflictingBooking.status,
          room: formData.room,
          userEmail: conflictingBooking.bookedBy.email || 'N/A',
          purpose: conflictingBooking.purpose || 'N/A'
        },
        type: 'BOOKING_CONFLICT'
      };
    }

    return null;
  };

  // Get available time slots (filter out conflicting ones)
  const getAvailableTimeSlots = () => {
    if (!formData.room || !formData.date || !formData.duration) {
      return timeSlots;
    }

    return timeSlots.filter(timeSlot => {
      const testConflict = getConflictingBookingInfo(
        formData.room,
        formData.date,
        timeSlot,
        formData.duration
      );
      return !testConflict.hasConflict;
    });
  };

  // Fetch all bookings for conflict checking
  const fetchBookings = async () => {
    try {
      if (!token) {
        setBookings([]);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000
      });
      
      setBookings(response.data || []);
      
    } catch (error) {
      console.error('Failed to fetch bookings for conflict checking:', error);
      setBookings([]);
    }
  };

  // Initialize form data when booking changes
  useEffect(() => {
    if (booking) {
      // Calculate duration from start and end time
      const calculateDuration = (startTime, endTime) => {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;
        return endTotalMinutes - startTotalMinutes;
      };

      // Convert date format from "16 Jan 2025" to "2025-01-16"
      const convertDateFormat = (dateStr) => {
        try {
          const months = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          
          const parts = dateStr.split(' ');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = months[parts[1]];
            const year = parts[2];
            return `${year}-${month}-${day}`;
          }
          
          // Try parsing as ISO date
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
          
          return dateStr;
        } catch (error) {
          console.error('Error converting date:', error);
          return dateStr;
        }
      };

      const duration = booking.endTime ? 
        calculateDuration(booking.startTime, booking.endTime) : 60;

      setFormData({
        title: booking.title || booking.description || '',
        date: convertDateFormat(booking.date),
        startTime: booking.startTime || '',
        duration: duration,
        room: booking.room || '',
        attendees: booking.attendees || 1,
        description: booking.description || booking.title || ''
      });

      // Fetch bookings when booking data is available
      fetchBookings();
      
      // Clear any existing conflict error when new booking is loaded
      setConflictError(null);
    }
  }, [booking]);

  // ✅ FIXED: Only check for conflicts when form values change AND all required fields are filled
  useEffect(() => {
    // Only check for conflicts if we have bookings data and all required fields are filled
    if (bookings.length > 0 && formData.room && formData.date && formData.startTime && formData.duration) {
      const conflict = checkCurrentFormConflict();
      setConflictError(conflict);
    } else {
      // Clear conflict error if any required field is missing
      setConflictError(null);
    }
  }, [formData.room, formData.date, formData.startTime, formData.duration, bookings]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Meeting title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Cannot book rooms for past dates';
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.room) {
      newErrors.room = 'Room selection is required';
    }

    if (formData.attendees < 1 || formData.attendees > 50) {
      newErrors.attendees = 'Attendees must be between 1 and 50';
    }

    if (formData.duration < 30 || formData.duration > 480) {
      newErrors.duration = 'Duration must be between 30 minutes and 8 hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prevent saving if there's a conflict
    if (conflictError) {
      return;
    }

    setLoading(true);

    try {
      console.log('💾 Updating booking:', booking.id);
      console.log('Form data:', formData);

      if (!token) {
        throw new Error('Authentication required');
      }

      const updateData = {
        room: formData.room,
        date: formData.date,
        time: formData.startTime,
        duration: formData.duration,
        attendees: parseInt(formData.attendees),
        purpose: formData.description || formData.title
      };

      const response = await axios.put(
        `${API_BASE_URL}/bookings/${booking.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('✅ Booking updated successfully:', response.data);
      
      // Call the parent's onSave callback
      onSave(response.data.booking);
      
      alert('Booking updated successfully!');

    } catch (error) {
      console.error('❌ Failed to update booking:', error);
      
      let errorMessage = 'Failed to update booking. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        alert(errorMessage);
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to update this booking.';
        alert(errorMessage);
      } else if (error.response?.status === 409) {
        // Handle booking conflicts with detailed UI
        const conflictData = error.response.data;
        console.log('⚠️ Booking conflict detected:', conflictData);
        
        setConflictError({
          message: conflictData.message,
          conflictingBooking: conflictData.conflictingBooking,
          type: conflictData.type || 'BOOKING_CONFLICT'
        });
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        alert(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setErrors({});
    setConflictError(null);
    onCancel();
  };

  // Calculate end time for display
  const calculateEndTime = () => {
    if (formData.startTime && formData.duration) {
      const [hours, minutes] = formData.startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + parseInt(formData.duration);
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }
    return '';
  };

  // Get available time slots with conflict filtering
  const availableTimeSlots = getAvailableTimeSlots();

  if (!isOpen) return null;

  return (
    <div className="edit-modal-overlay" onClick={handleCancel}>
      <div className="edit-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <div className="edit-modal-title-section">
            <FaEdit className="edit-modal-title-icon" />
            <h2 className="edit-modal-title">Edit Booking</h2>
          </div>
          <button 
            className="edit-modal-close-btn"
            onClick={handleCancel}
            type="button"
          >
            <FaTimes />
          </button>
        </div>

        {/* ✅ FIXED: Only show conflict alert when there's an actual conflict */}
        {conflictError && (
          <div className="edit-conflict-alert">
            <div className="edit-conflict-header">
              <FaBan className="edit-conflict-icon" />
              <h3>Time Slot Already Booked</h3>
            </div>
            <div className="edit-conflict-message">
              {conflictError.message}
            </div>
            {conflictError.conflictingBooking && (
              <div className="edit-conflict-details">
                <div className="edit-conflict-user-info">
                  <FaUserClock className="edit-conflict-user-icon" />
                  <div className="edit-conflict-user-details">
                    <strong>Booked by:</strong> {conflictError.conflictingBooking.bookedBy}
                    <br />
                    <small>Email: {conflictError.conflictingBooking.userEmail}</small>
                  </div>
                </div>
                <div className="edit-conflict-booking-info">
                  <strong>Conflicting booking details:</strong>
                  <ul>
                    <li><strong>Time:</strong> {conflictError.conflictingBooking.startTime} - {conflictError.conflictingBooking.endTime}</li>
                    <li><strong>Date:</strong> {conflictError.conflictingBooking.date}</li>
                    <li><strong>Status:</strong> {conflictError.conflictingBooking.status}</li>
                    <li><strong>Purpose:</strong> {conflictError.conflictingBooking.purpose}</li>
                  </ul>
                </div>
              </div>
            )}
            <div className="edit-conflict-suggestion">
              💡 <strong>Suggestion:</strong> Please choose a different time slot. The blocked times have been removed from the time selection dropdown.
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="edit-modal-form">
          {/* ✅ FIXED: Added scrollable form content */}
          <div className="edit-modal-form-content">
            {/* Meeting Title */}
            <div className="edit-form-group">
              <label className="edit-form-label">
                <FaFileAlt className="edit-form-label-icon" />
                Meeting Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`edit-form-input ${errors.title ? 'edit-form-input-error' : ''}`}
                placeholder="Enter meeting title"
                maxLength={100}
              />
              {errors.title && (
                <span className="edit-form-error">
                  <FaExclamationTriangle className="edit-error-icon" />
                  {errors.title}
                </span>
              )}
            </div>

            {/* Date and Time Row */}
            <div className="edit-form-row">
              <div className="edit-form-group">
                <label className="edit-form-label">
                  <FaCalendarAlt className="edit-form-label-icon" />
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`edit-form-input ${errors.date ? 'edit-form-input-error' : ''} ${conflictError ? 'edit-form-input-conflict' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.date && (
                  <span className="edit-form-error">
                    <FaExclamationTriangle className="edit-error-icon" />
                    {errors.date}
                  </span>
                )}
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">
                  <FaClock className="edit-form-label-icon" />
                  Start Time *
                  {availableTimeSlots.length < timeSlots.length && (
                    <span className="edit-form-label-info">
                      ({timeSlots.length - availableTimeSlots.length} slots unavailable)
                    </span>
                  )}
                </label>
                <select
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className={`edit-form-input ${errors.startTime ? 'edit-form-input-error' : ''} ${conflictError ? 'edit-form-input-conflict' : ''}`}
                >
                  <option value="">Select time</option>
                  {availableTimeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                {errors.startTime && (
                  <span className="edit-form-error">
                    <FaExclamationTriangle className="edit-error-icon" />
                    {errors.startTime}
                  </span>
                )}
                {availableTimeSlots.length === 0 && formData.room && formData.date && (
                  <span className="edit-form-warning">
                    <FaExclamationTriangle className="edit-error-icon" />
                    No available time slots for selected room and date
                  </span>
                )}
              </div>
            </div>

            {/* Duration and End Time Display */}
            <div className="edit-form-row">
              <div className="edit-form-group">
                <label className="edit-form-label">
                  <FaClock className="edit-form-label-icon" />
                  Duration (minutes) *
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className={`edit-form-input ${errors.duration ? 'edit-form-input-error' : ''} ${conflictError ? 'edit-form-input-conflict' : ''}`}
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={150}>2.5 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={300}>5 hours</option>
                  <option value={360}>6 hours</option>
                  <option value={420}>7 hours</option>
                  <option value={480}>8 hours</option>
                </select>
                {errors.duration && (
                  <span className="edit-form-error">
                    <FaExclamationTriangle className="edit-error-icon" />
                    {errors.duration}
                  </span>
                )}
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">
                  <FaClock className="edit-form-label-icon" />
                  End Time
                </label>
                <input
                  type="text"
                  value={calculateEndTime()}
                  className="edit-form-input edit-form-input-readonly"
                  readOnly
                  placeholder="Calculated automatically"
                />
              </div>
            </div>

            {/* Room and Attendees Row */}
            <div className="edit-form-row">
              <div className="edit-form-group">
                <label className="edit-form-label">
                  <FaMapMarkerAlt className="edit-form-label-icon" />
                  Room *
                </label>
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  className={`edit-form-input ${errors.room ? 'edit-form-input-error' : ''} ${conflictError ? 'edit-form-input-conflict' : ''}`}
                >
                  <option value="">Select a room</option>
                  {availableRooms.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
                {errors.room && (
                  <span className="edit-form-error">
                    <FaExclamationTriangle className="edit-error-icon" />
                    {errors.room}
                  </span>
                )}
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">
                  <FaUsers className="edit-form-label-icon" />
                  Number of Attendees *
                </label>
                <input
                  type="number"
                  name="attendees"
                  value={formData.attendees}
                  onChange={handleInputChange}
                  className={`edit-form-input ${errors.attendees ? 'edit-form-input-error' : ''}`}
                  min="1"
                  max="50"
                  placeholder="Enter number of attendees"
                />
                {errors.attendees && (
                  <span className="edit-form-error">
                    <FaExclamationTriangle className="edit-error-icon" />
                    {errors.attendees}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="edit-form-group">
              <label className="edit-form-label">
                <FaFileAlt className="edit-form-label-icon" />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="edit-form-textarea"
                placeholder="Enter meeting description or agenda"
                rows={3}
                maxLength={500}
              />
              <div className="edit-form-character-count">
                {formData.description.length}/500 characters
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="edit-modal-actions">
            <button
              type="button"
              className="edit-modal-btn edit-modal-cancel-btn"
              onClick={handleCancel}
              disabled={loading}
            >
              <FaTimes className="edit-btn-icon" />
              Cancel
            </button>
            <button
              type="submit"
              className={`edit-modal-btn edit-modal-save-btn ${conflictError ? 'edit-modal-save-btn-disabled' : ''}`}
              disabled={loading || conflictError}
            >
              <FaSave className="edit-btn-icon" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Conflict prevention notice */}
          {conflictError && (
            <div className="edit-conflict-prevention-notice">
              <FaBan className="edit-notice-icon" />
              <p className="edit-notice-text">
                Cannot save booking due to time slot conflict. Please select a different time.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditBookingModal;