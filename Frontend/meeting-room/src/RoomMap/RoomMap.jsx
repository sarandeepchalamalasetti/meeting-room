import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  FaUsers, 
  FaDesktop,
  FaWifi,
  FaPhone,
  FaMicrophone,
  FaCoffee,
  FaSearch,
  FaFilter,
  FaBuilding,
  FaTh,
  FaList,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaCalendar,
  FaClock,
  FaStar,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaTv,
  FaChalkboardTeacher,
  FaSpinner,
  FaBan,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import './RoomMap.css';

const RoomMap = () => {
  // Get user data from sessionStorage with fallbacks
  const getUserData = () => {
    try {
      const userData = sessionStorage.getItem('user');
      return userData ? JSON.parse(userData) : { 
        role: 'manager',
        name: 'Demo User',
        email: 'demo@example.com',
        id: 'demo-user-id'
      };
    } catch (error) {
      return { 
        role: 'manager', 
        name: 'Demo User',
        email: 'demo@example.com',
        id: 'demo-user-id'
      };
    }
  };

  const user = getUserData();
  const token = sessionStorage.getItem('token');

  // State management
  const [selectedFloor, setSelectedFloor] = useState('Floor 1');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [capacityFilter, setCapacityFilter] = useState('All Sizes');
  const [currentView, setCurrentView] = useState('Layout View');
  const [showDetails, setShowDetails] = useState(true);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    date: '',
    startTime: '',
    duration: '',
    attendees: '',
    purpose: '',
    manager: ''
  });
  const [bookingErrors, setBookingErrors] = useState({});
  const [conflictError, setConflictError] = useState(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Fallback room data for offline mode
  const fallbackRoomData = {
    'Floor 1': {
      'Wing A': [
        { 
          id: 'wing-a-conf-1', 
          name: 'Conference Room A1', 
          capacity: 12, 
          status: 'available',
          equipment: ['Projector', 'Whiteboard', 'Video Conf'],
          nextAvailable: 'Available Now',
          bookings: [],
          floor: 'Floor 1',
          wing: 'Wing A'
        },
        { 
          id: 'wing-a-meeting-1', 
          name: 'Meeting Room A3', 
          capacity: 8, 
          status: 'available',
          equipment: ['TV Display', 'Whiteboard'],
          nextAvailable: 'Available Now',
          bookings: [],
          floor: 'Floor 1',
          wing: 'Wing A'
        }
      ],
      'Wing B': [
        { 
          id: 'wing-b-training', 
          name: 'Training Room B1', 
          capacity: 20, 
          status: 'available',
          equipment: ['Projector', 'Whiteboard', 'Audio System'],
          nextAvailable: 'Available Now',
          bookings: [],
          floor: 'Floor 1',
          wing: 'Wing B'
        },
        { 
          id: 'wing-b-meeting-1', 
          name: 'Small Meeting B3', 
          capacity: 4, 
          status: 'available',
          equipment: ['TV Display', 'Whiteboard'],
          nextAvailable: 'Available Now',
          bookings: [],
          floor: 'Floor 1',
          wing: 'Wing B'
        }
      ]
    },
    'Floor 2': {
      'Wing A': [
        { 
          id: 'wing-a-board', 
          name: 'Board Room A2', 
          capacity: 16, 
          status: 'available',
          equipment: ['4K Display', 'Video Conf', 'Premium Audio'],
          nextAvailable: 'Available Now',
          bookings: [],
          floor: 'Floor 2',
          wing: 'Wing A'
        },
        { 
          id: 'wing-a-creative', 
          name: 'Creative Space A4', 
          capacity: 10, 
          status: 'available',
          equipment: ['Interactive Display', 'Whiteboard'],
          nextAvailable: 'Available Now',
          bookings: [],
          floor: 'Floor 2',
          wing: 'Wing A'
        }
      ],
      'Wing B': [
        { 
          id: 'wing-b-discussion', 
          name: 'Discussion Room B2', 
          capacity: 6, 
          status: 'available',
          equipment: ['Whiteboard', 'TV Display'],
          nextAvailable: 'Available Now',
          bookings: [],
          floor: 'Floor 2',
          wing: 'Wing B'
        },
        { 
          id: 'wing-b-meeting-2', 
          name: 'Small Meeting B4', 
          capacity: 4, 
          status: 'available',
          equipment: ['TV Display', 'Whiteboard'],
          nextAvailable: 'Available Now',
          bookings: [],
          floor: 'Floor 2',
          wing: 'Wing B'
        }
      ]
    }
  };

  // Manager list and time slots (same as BookRoom)
  const managers = [
    { id: 'john-manager', name: 'John Manager', team: 'Engineering' },
    { id: 'sarah-hr', name: 'Sarah HR', team: 'Human Resources' },
    { id: 'mike-sales', name: 'Mike Sales', team: 'Sales' },
    { id: 'lisa-marketing', name: 'Lisa Marketing', team: 'Marketing' }
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const durations = [
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' },
    { value: '180', label: '3 hours' },
    { value: '240', label: '4 hours' }
  ];

  // Helper functions for time and conflict checking
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isTimeOverlapping = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1;
  };

  const getConflictingBookingInfo = (roomName, date, startTime, durationMinutes) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + parseInt(durationMinutes);
    
    const conflictingBookings = bookings.filter(booking => 
      booking.roomName === roomName && 
      booking.date === date &&
      (booking.status === 'approved' || booking.status === 'pending')
    );

    for (let booking of conflictingBookings) {
      const bookingStartMinutes = timeToMinutes(booking.startTime);
      const bookingEndMinutes = timeToMinutes(booking.endTime);
      
      if (isTimeOverlapping(startMinutes, endMinutes, bookingStartMinutes, bookingEndMinutes)) {
        return {
          hasConflict: true,
          conflictingBooking: booking,
          bookedBy: booking.bookedBy?.name || booking.bookedBy?.username || 'Unknown User',
          timeSlot: `${booking.startTime} to ${booking.endTime}`
        };
      }
    }
    
    return { hasConflict: false };
  };

  // ✅ NEW: Real-time conflict checking for the booking form
  const checkCurrentFormConflict = () => {
    if (!selectedRoom || !bookingForm.date || !bookingForm.startTime || !bookingForm.duration) {
      return null;
    }

    const conflictInfo = getConflictingBookingInfo(
      selectedRoom.name, 
      bookingForm.date, 
      bookingForm.startTime, 
      bookingForm.duration
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
        message: `This time slot is already booked! The room "${selectedRoom.name}" is reserved from ${conflictingBooking.startTime} to ${conflictingBooking.endTime} on ${formatDate(conflictingBooking.date)} by ${conflictingBooking.bookedBy.name}.`,
        conflictingBooking: {
          startTime: conflictingBooking.startTime,
          endTime: conflictingBooking.endTime,
          date: conflictingBooking.date,
          bookedBy: conflictingBooking.bookedBy.name,
          status: conflictingBooking.status,
          room: selectedRoom.name
        },
        type: 'BOOKING_CONFLICT'
      };
    }

    return null;
  };

  // ✅ ENHANCED: Get available time slots (now shows all slots, conflicts handled by warning)
  const getAvailableTimeSlots = (roomName, date, selectedDuration) => {
    // Always return all time slots - conflicts will be shown as warnings
    return timeSlots;
  };

  // Fetch rooms from backend
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!token || !isOnline) {
        setRooms(getFlatRoomList(fallbackRoomData));
        setIsOnline(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/rooms', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000
      });
      
      setRooms(response.data || []);
      setIsOnline(true);
      
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setRooms(getFlatRoomList(fallbackRoomData));
      setIsOnline(false);
      
      toast.error('Failed to load rooms from server. Using cached data.', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  }, [token, isOnline]);

  // Fetch bookings from backend with real-time updates
  const fetchBookings = useCallback(async () => {
    try {
      if (!token) {
        setBookings([]);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000
      });
      
      setBookings(response.data || []);
      
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
    }
  }, [token]);

  // Convert flat room list to structured format for display
  const getFlatRoomList = (roomData) => {
    const flatList = [];
    Object.entries(roomData).forEach(([floor, wings]) => {
      Object.entries(wings).forEach(([wing, rooms]) => {
        rooms.forEach(room => {
          flatList.push({
            ...room,
            floor,
            wing: wing === 'Wing A' ? 'Wing A' : 'Wing B'
          });
        });
      });
    });
    return flatList;
  };

  // Structure rooms by floor and wing for layout view
  const getStructuredRoomData = () => {
    const structured = {};
    
    rooms.forEach(room => {
      if (!structured[room.floor]) {
        structured[room.floor] = {};
      }
      if (!structured[room.floor][room.wing]) {
        structured[room.floor][room.wing] = [];
      }
      structured[room.floor][room.wing].push(room);
    });
    
    return structured;
  };

  // Get room status with proper status logic (like BookRoom)
  const getRoomStatus = (room) => {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date();
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    // Find bookings for this room today
    const roomBookings = bookings.filter(booking => 
      booking.roomName === room.name && 
      booking.date === today &&
      (booking.status === 'approved' || booking.status === 'pending')
    );

    // Default to available if no bookings
    if (roomBookings.length === 0) {
      return { status: 'available', nextAvailable: 'Available Now', bookings: [] };
    }

    // Check if currently occupied (approved bookings only)
    const approvedBookings = roomBookings.filter(b => b.status === 'approved');
    for (let booking of approvedBookings) {
      const startMinutes = timeToMinutes(booking.startTime);
      const endMinutes = timeToMinutes(booking.endTime);
      
      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        return { 
          status: 'occupied', 
          nextAvailable: booking.endTime,
          bookings: [`${booking.startTime}-${booking.endTime}`]
        };
      }
    }

    // Check for pending bookings
    const pendingBookings = roomBookings.filter(b => b.status === 'pending');
    if (pendingBookings.length > 0) {
      const bookingSlots = roomBookings.map(booking => `${booking.startTime}-${booking.endTime}`);
      return { 
        status: 'pending', 
        nextAvailable: 'Pending Approval',
        bookings: bookingSlots
      };
    }

    // Check for future approved bookings today
    const futureBookings = approvedBookings.filter(booking => 
      timeToMinutes(booking.startTime) > currentMinutes
    );

    const bookingSlots = roomBookings.map(booking => `${booking.startTime}-${booking.endTime}`);

    if (futureBookings.length > 0) {
      return { 
        status: 'available', 
        nextAvailable: `Next: ${futureBookings[0].startTime}`,
        bookings: bookingSlots
      };
    }

    return { 
      status: 'available', 
      nextAvailable: 'Available Now',
      bookings: bookingSlots
    };
  };

  // Get rooms with current status
  const getRoomsWithStatus = () => {
    return rooms.map(room => {
      const statusInfo = getRoomStatus(room);
      return {
        ...room,
        ...statusInfo
      };
    });
  };

  // Fetch data on component mount and set up polling
  useEffect(() => {
    fetchRooms();
    fetchBookings();

    // Set up polling every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchBookings();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchRooms, fetchBookings]);

  const roomsWithStatus = getRoomsWithStatus();
  const structuredRoomData = getStructuredRoomData();

  // Status colors to match requirements
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'available'; // Green
      case 'occupied': return 'occupied';   // Red
      case 'pending': return 'pending';     // Orange
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return FaCheckCircle;
      case 'occupied': return FaTimesCircle;
      case 'pending': return FaExclamationCircle;
      default: return FaExclamationCircle;
    }
  };

  const getEquipmentIcon = (equipment) => {
    const iconMap = {
      'projector': FaDesktop,
      '4k projector': FaDesktop,
      '4k display': FaDesktop,
      'tv display': FaTv,
      'tv': FaTv,
      'video conf': FaPhone,
      'whiteboard': FaChalkboardTeacher,
      'audio system': FaMicrophone,
      'premium audio': FaMicrophone,
      'flip chart': FaChalkboardTeacher,
      'wifi': FaWifi,
      'coffee': FaCoffee,
      'smart board': FaDesktop,
      'interactive display': FaDesktop,
      'wireless display': FaDesktop,
      'multiple displays': FaDesktop,
      'design tools': FaDesktop,
      'catering setup': FaCoffee
    };
    
    const key = equipment.toLowerCase();
    for (const [term, Icon] of Object.entries(iconMap)) {
      if (key.includes(term)) return Icon;
    }
    return FaDesktop;
  };

  // Get current floor rooms
  const getCurrentFloorRooms = () => {
    return roomsWithStatus.filter(room => room.floor === selectedFloor);
  };

  const floorRooms = getCurrentFloorRooms();
  const floorStats = {
    available: floorRooms.filter(r => r.status === 'available').length,
    occupied: floorRooms.filter(r => r.status === 'occupied').length,
    pending: floorRooms.filter(r => r.status === 'pending').length,
    total: floorRooms.length
  };

  const filteredRooms = (wingRooms) => {
    return wingRooms.filter(room => {
      const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All Statuses' || room.status === statusFilter.toLowerCase();
      const matchesCapacity = capacityFilter === 'All Sizes' || 
        (capacityFilter === 'Small (1-6)' && room.capacity <= 6) ||
        (capacityFilter === 'Medium (7-12)' && room.capacity >= 7 && room.capacity <= 12) ||
        (capacityFilter === 'Large (13+)' && room.capacity >= 13);
      return matchesSearch && matchesStatus && matchesCapacity;
    });
  };

  const getAllFilteredRooms = () => {
    return floorRooms.filter(room => {
      const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All Statuses' || room.status === statusFilter.toLowerCase();
      const matchesCapacity = capacityFilter === 'All Sizes' || 
        (capacityFilter === 'Small (1-6)' && room.capacity <= 6) ||
        (capacityFilter === 'Medium (7-12)' && room.capacity >= 7 && room.capacity <= 12) ||
        (capacityFilter === 'Large (13+)' && room.capacity >= 13);
      return matchesSearch && matchesStatus && matchesCapacity;
    });
  };

  // Handle room click and open booking dialog
  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setIsBookingDialogOpen(true);
    
    // Reset booking form
    setBookingForm({
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      duration: '',
      attendees: '',
      purpose: '',
      manager: ''
    });
    setBookingErrors({});
    setConflictError(null);
  };

  // ✅ ENHANCED: Handle booking form changes with real-time conflict checking
  const handleBookingFormChange = (field, value) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (bookingErrors[field]) {
      setBookingErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Clear conflict error when changing conflicting fields
    if (conflictError && (field === 'date' || field === 'startTime' || field === 'duration')) {
      setConflictError(null);
    }
  };

  // ✅ NEW: Real-time conflict checking when form values change
  useEffect(() => {
    if (selectedRoom && bookingForm.date && bookingForm.startTime && bookingForm.duration) {
      const conflict = checkCurrentFormConflict();
      setConflictError(conflict);
    } else {
      setConflictError(null);
    }
  }, [selectedRoom, bookingForm.date, bookingForm.startTime, bookingForm.duration, bookings]);

  // Validate booking form
  const validateBookingForm = () => {
    const errors = {};
    
    if (!bookingForm.date) errors.date = 'Date is required';
    if (!bookingForm.startTime) errors.startTime = 'Start time is required';
    if (!bookingForm.duration) errors.duration = 'Duration is required';
    if (!bookingForm.attendees || bookingForm.attendees < 1) errors.attendees = 'Number of attendees is required';
    if (!bookingForm.purpose.trim()) errors.purpose = 'Meeting purpose is required';
    if (user.role === 'employee' && !bookingForm.manager) errors.manager = 'Manager selection is required';
    
    // Validate date is not in the past
    const selectedDate = new Date(bookingForm.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.date = 'Cannot book rooms for past dates';
    }
    
    setBookingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle booking submission with full backend integration
  const handleBookRoom = async () => {
    if (!selectedRoom || !validateBookingForm()) return;

    // ✅ NEW: Prevent booking if there's a conflict
    if (conflictError) {
      toast.error('Please resolve the time slot conflict before booking.');
      return;
    }

    setIsSubmittingBooking(true);

    try {
      const userInfo = {
        name: user.name || user.username || user.fullName || 'Demo User',
        email: user.email || user.userEmail || 'demo@example.com',
        employeeId: user.employeeId || user.id || user._id || 'demo-user-id',
        role: user.role || 'manager'
      };

      const bookingData = {
        room: selectedRoom.name,
        date: bookingForm.date,
        time: bookingForm.startTime,
        duration: bookingForm.duration,
        attendees: parseInt(bookingForm.attendees),
        purpose: bookingForm.purpose,
        manager: user.role === 'employee' ? bookingForm.manager : null,
        status: user.role === 'employee' ? 'pending' : 'approved',
        role: user.role,
        userInfo: userInfo
      };

      if (!token || !isOnline) {
        // Offline simulation
        const startMinutes = timeToMinutes(bookingForm.startTime);
        const endMinutes = startMinutes + parseInt(bookingForm.duration);
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

        const mockBooking = {
          _id: `mock-${Date.now()}`,
          roomName: selectedRoom.name,
          date: bookingForm.date,
          startTime: bookingForm.startTime,
          endTime: endTime,
          purpose: bookingForm.purpose,
          status: user.role === 'employee' ? 'pending' : 'approved',
          bookedBy: userInfo
        };
        
        setBookings(prev => [...prev, mockBooking]);
        toast.success(`${selectedRoom.name} has been booked successfully!`);
      } else {
        const response = await axios.post(
          'http://localhost:5000/api/bookings/create',
          bookingData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        toast.success(`${selectedRoom.name} has been booked successfully!`);
        
        // Refresh bookings to show updated status
        setTimeout(() => {
          fetchBookings();
        }, 1000);
      }
      
      setIsBookingDialogOpen(false);
      setSelectedRoom(null);
      
    } catch (error) {
      console.error('Booking failed:', error);
      
      let errorMessage = 'Failed to book room. Please try again.';
      
      if (error.response?.status === 409) {
        const conflictData = error.response.data;
        setConflictError({
          message: conflictData.message,
          conflictingBooking: conflictData.conflictingBooking,
          type: conflictData.type || 'BOOKING_CONFLICT'
        });
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
        toast.error(errorMessage);
      } else {
        toast.error(error.response?.data?.message || errorMessage);
      }
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Get available time slots for the booking form (now shows all slots)
  const availableTimeSlots = selectedRoom && bookingForm.date && bookingForm.duration ? 
    getAvailableTimeSlots(selectedRoom.name, bookingForm.date, bookingForm.duration) : timeSlots;

  // Enhanced Room Card with conditional details display
  const RoomCard = ({ room }) => (
    <div
      onClick={() => handleRoomClick(room)}
      className={`roommap-room-card roommap-room-card-${getStatusColor(room.status)}`}
    >
      <div className={`roommap-status-dot roommap-status-dot-${getStatusColor(room.status)}`}></div>
      
      <div className="roommap-room-card-content">
        <div className="roommap-room-header">
          <h3 className="roommap-room-name">{room.name}</h3>
          {showDetails && (
            <p className="roommap-room-capacity">Up to {room.capacity} people</p>
          )}
        </div>
        
        {showDetails && (
          <div className="roommap-room-equipment">
            {room.equipment?.map((item, index) => {
              const IconComponent = getEquipmentIcon(item);
              return (
                <div key={index} className="roommap-equipment-item">
                  <IconComponent className="roommap-equipment-icon" />
                  <span className="roommap-equipment-name">{item}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const ListViewRow = ({ room }) => {
    const StatusIcon = getStatusIcon(room.status);
    return (
      <tr 
        className="roommap-list-row"
        onClick={() => handleRoomClick(room)}
      >
        <td className="roommap-list-cell">
          <div className="roommap-room-info">
            <StatusIcon className={`roommap-status-icon roommap-status-icon-${getStatusColor(room.status)}`} />
            <span className="roommap-room-name-list">{room.name}</span>
          </div>
        </td>
        <td className="roommap-list-cell">{showDetails ? room.floor : '-'}</td>
        <td className="roommap-list-cell">{showDetails ? room.wing : '-'}</td>
        <td className="roommap-list-cell">{showDetails ? room.capacity : '-'}</td>
        <td className="roommap-list-cell">
          <span className={`roommap-status-badge roommap-status-badge-${getStatusColor(room.status)}`}>
            {room.status}
          </span>
        </td>
        <td className="roommap-list-cell">{showDetails ? room.nextAvailable : '-'}</td>
        <td className="roommap-list-cell">
          {showDetails ? (
            <div className="roommap-equipment-badges">
              {room.equipment?.slice(0, 3).map((item, index) => (
                <span key={index} className="roommap-equipment-badge">
                  {item}
                </span>
              ))}
              {room.equipment?.length > 3 && (
                <span className="roommap-equipment-badge">
                  +{room.equipment.length - 3}
                </span>
              )}
            </div>
          ) : '-'}
        </td>
      </tr>
    );
  };

  const GridViewCard = ({ room }) => {
    const StatusIcon = getStatusIcon(room.status);
    return (
      <div
        onClick={() => handleRoomClick(room)}
        className={`roommap-grid-card roommap-grid-card-${getStatusColor(room.status)}`}
      >
        <div className="roommap-grid-card-header">
          <div className="roommap-grid-card-info">
            <h3 className="roommap-grid-card-name">{room.name}</h3>
            {showDetails && (
              <p className="roommap-grid-card-location">{room.floor} • {room.wing}</p>
            )}
          </div>
          <StatusIcon className={`roommap-grid-status-icon roommap-grid-status-icon-${getStatusColor(room.status)}`} />
        </div>
        
        {showDetails && (
          <div className="roommap-grid-card-details">
            <div className="roommap-grid-detail-item">
              <FaUsers className="roommap-grid-detail-icon" />
              <span>{room.capacity} people</span>
            </div>
            
            <div className="roommap-grid-detail-item">
              <FaClock className="roommap-grid-detail-icon" />
              <span>{room.nextAvailable}</span>
            </div>
            
            <div className="roommap-grid-equipment">
              {room.equipment?.slice(0, 2).map((item, index) => (
                <span key={index} className="roommap-grid-equipment-badge">
                  {item}
                </span>
              ))}
              {room.equipment?.length > 2 && (
                <span className="roommap-grid-equipment-badge">
                  +{room.equipment.length - 2}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="roommap-loading-container">
          <FaSpinner className="roommap-loading-spinner" />
          <p>Loading rooms...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'Layout View':
        const currentFloorData = structuredRoomData[selectedFloor] || {};
        return (
          <div className="roommap-layout-view">
            {Object.entries(currentFloorData).map(([wingName, wingRooms]) => (
              <div key={wingName} className="roommap-wing-container">
                <div className="roommap-wing-header">
                  <h3 className="roommap-wing-name">{wingName}</h3>
                  <div className="roommap-wing-status"></div>
                </div>
                
                <div className="roommap-wing-rooms">
                  {filteredRooms(wingRooms).map((room) => (
                    <RoomCard key={room.id || room._id} room={room} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'List View':
        return (
          <div className="roommap-list-view">
            <div className="roommap-list-container">
              <table className="roommap-rooms-table">
                <thead className="roommap-table-header">
                  <tr>
                    <th className="roommap-table-head">Room</th>
                    <th className="roommap-table-head">Floor</th>
                    <th className="roommap-table-head">Wing</th>
                    <th className="roommap-table-head">Capacity</th>
                    <th className="roommap-table-head">Status</th>
                    <th className="roommap-table-head">Next Available</th>
                    <th className="roommap-table-head">Equipment</th>
                  </tr>
                </thead>
                <tbody className="roommap-table-body">
                  {getAllFilteredRooms().map((room) => (
                    <ListViewRow key={room.id || room._id} room={room} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Grid View':
        return (
          <div className="roommap-grid-view">
            <div className="roommap-grid-container">
              {getAllFilteredRooms().map((room) => (
                <GridViewCard key={room.id || room._id} room={room} />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const availableFloors = [...new Set(roomsWithStatus.map(room => room.floor))].sort();

  return (
    <div className="roommap-container">
      {/* Left Sidebar */}
      <div className="roommap-sidebar">
        {/* Floor Selection */}
        <div className="roommap-sidebar-section">
          <div className="roommap-section-header">
            <FaBuilding className="roommap-section-icon" />
            <h3 className="roommap-section-title">Select Floor</h3>
          </div>
          <select 
            value={selectedFloor} 
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="roommap-floor-select"
          >
            {availableFloors.map(floor => (
              <option key={floor} value={floor}>{floor}</option>
            ))}
          </select>
          {!isOnline && (
            <p className="roommap-offline-notice">Offline Mode</p>
          )}
        </div>

        <hr className="roommap-separator" />

        {/* Floor Status */}
        <div className="roommap-sidebar-section">
          <div className="roommap-section-header">
            <FaTh className="roommap-section-icon" />
            <h3 className="roommap-section-title">{selectedFloor} Status</h3>
          </div>
          
          <div className="roommap-status-grid">
            <div className="roommap-status-item">
              <div className="roommap-status-count roommap-status-count-available">
                <span className="roommap-count-number">{floorStats.available}</span>
              </div>
              <p className="roommap-status-label">Available</p>
            </div>
            
            <div className="roommap-status-item">
              <div className="roommap-status-count roommap-status-count-occupied">
                <span className="roommap-count-number">{floorStats.occupied}</span>
              </div>
              <p className="roommap-status-label">Occupied</p>
            </div>
            
            <div className="roommap-status-item">
              <div className="roommap-status-count roommap-status-count-pending">
                <span className="roommap-count-number">{floorStats.pending}</span>
              </div>
              <p className="roommap-status-label">Pending</p>
            </div>
            
            <div className="roommap-status-item">
              <div className="roommap-status-count roommap-status-count-total">
                <span className="roommap-count-number">{floorStats.total}</span>
              </div>
              <p className="roommap-status-label">Total</p>
            </div>
          </div>
        </div>

        <hr className="roommap-separator" />

        {/* Filters */}
        <div className="roommap-sidebar-section">
          <div className="roommap-section-header">
            <FaFilter className="roommap-section-icon" />
            <h3 className="roommap-section-title">Filters</h3>
          </div>
          
          <div className="roommap-filters">
            <div className="roommap-search-container">
              <FaSearch className="roommap-search-icon" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search rooms..."
                className="roommap-search-input"
              />
            </div>
            
            <div className="roommap-filter-group">
              <label className="roommap-filter-label">Status</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="roommap-filter-select"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            
            <div className="roommap-filter-group">
              <label className="roommap-filter-label">Capacity</label>
              <select 
                value={capacityFilter} 
                onChange={(e) => setCapacityFilter(e.target.value)}
                className="roommap-filter-select"
              >
                <option value="All Sizes">All Sizes</option>
                <option value="Small (1-6)">Small (1-6)</option>
                <option value="Medium (7-12)">Medium (7-12)</option>
                <option value="Large (13+)">Large (13+)</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="roommap-separator" />

        {/* Legend */}
        <div className="roommap-sidebar-section">
          <div className="roommap-section-header">
            <FaEye className="roommap-section-icon" />
            <h3 className="roommap-section-title">Legend</h3>
          </div>
          
          <div className="roommap-legend">
            <div className="roommap-legend-item">
              <div className="roommap-legend-color roommap-legend-color-available"></div>
              <span className="roommap-legend-text">Available</span>
            </div>
            <div className="roommap-legend-item">
              <div className="roommap-legend-color roommap-legend-color-pending"></div>
              <span className="roommap-legend-text">Pending</span>
            </div>
            <div className="roommap-legend-item">
              <div className="roommap-legend-color roommap-legend-color-occupied"></div>
              <span className="roommap-legend-text">Occupied</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="roommap-main">
        <div className="roommap-main-container">
          {/* Header */}
          <div className="roommap-main-header">
            <div className="roommap-header-content">
              <div className="roommap-header-info">
                <FaBuilding className="roommap-header-icon" />
                <h2 className="roommap-header-title">{selectedFloor} Layout</h2>
              </div>
              
              <div className="roommap-header-controls">
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className={`roommap-details-toggle ${showDetails ? 'roommap-details-toggle-active' : ''}`}
                >
                  {showDetails ? <FaEyeSlash className="roommap-toggle-icon" /> : <FaEye className="roommap-toggle-icon" />}
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
                
                <span className="roommap-room-count">
                  {getAllFilteredRooms().length} of {floorStats.total} rooms
                </span>
              </div>
            </div>
            
            {/* View Tabs */}
            <div className="roommap-view-tabs">
              <div className="roommap-tabs-list">
                <button 
                  onClick={() => setCurrentView('Layout View')}
                  className={`roommap-tab-trigger ${currentView === 'Layout View' ? 'roommap-tab-trigger-active' : ''}`}
                >
                  Layout View
                </button>
                <button 
                  onClick={() => setCurrentView('List View')}
                  className={`roommap-tab-trigger ${currentView === 'List View' ? 'roommap-tab-trigger-active' : ''}`}
                >
                  List View
                </button>
                <button 
                  onClick={() => setCurrentView('Grid View')}
                  className={`roommap-tab-trigger ${currentView === 'Grid View' ? 'roommap-tab-trigger-active' : ''}`}
                >
                  Grid View
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="roommap-main-content">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* ✅ ENHANCED: Comprehensive Booking Dialog with real-time conflict warnings */}
      {isBookingDialogOpen && selectedRoom && (
        <div className="roommap-dialog-overlay" onClick={() => setIsBookingDialogOpen(false)}>
          <div className="roommap-booking-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="roommap-dialog-header">
              <div className="roommap-dialog-title">
                <FaCalendar className="roommap-dialog-icon" />
                Book {selectedRoom.name}
              </div>
              <button 
                onClick={() => setIsBookingDialogOpen(false)}
                className="roommap-dialog-close"
              >
                ×
              </button>
            </div>
            
            {/* ✅ ENHANCED: Real-time Conflict Alert */}
            {conflictError && (
              <div className="roommap-conflict-alert">
                <div className="roommap-conflict-header">
                  <FaBan className="roommap-conflict-icon" />
                  <h4>Time Slot Conflict</h4>
                </div>
                <div className="roommap-conflict-message">
                  {conflictError.message}
                </div>
                {conflictError.conflictingBooking && (
                  <div className="roommap-conflict-details">
                    <strong>Conflicting booking details:</strong>
                    <ul>
                      <li><strong>Time:</strong> {conflictError.conflictingBooking.startTime} - {conflictError.conflictingBooking.endTime}</li>
                      <li><strong>Date:</strong> {conflictError.conflictingBooking.date}</li>
                      <li><strong>Booked by:</strong> {conflictError.conflictingBooking.bookedBy}</li>
                      <li><strong>Status:</strong> {conflictError.conflictingBooking.status}</li>
                    </ul>
                  </div>
                )}
                <div className="roommap-conflict-suggestion">
                  💡 <strong>Suggestion:</strong> Try changing the time, duration, or date to avoid this conflict.
                </div>
              </div>
            )}
            
            <div className="roommap-dialog-content">
              {/* Room Info */}
              <div className="roommap-dialog-info">
                <div className="roommap-info-item">
                  <label className="roommap-info-label">Location</label>
                  <p className="roommap-info-value">{selectedRoom.floor} • {selectedRoom.wing}</p>
                </div>
                <div className="roommap-info-item">
                  <label className="roommap-info-label">Capacity</label>
                  <p className="roommap-info-value">{selectedRoom.capacity} people</p>
                </div>
                <div className="roommap-info-item">
                  <label className="roommap-info-label">Status</label>
                  <span className={`roommap-status-badge-${getStatusColor(selectedRoom.status)}`}>
                    {selectedRoom.status}
                  </span>
                </div>
              </div>
              
              {/* ✅ ENHANCED: Comprehensive Booking Form with real-time conflict detection */}
              <form className="roommap-booking-form">
                {/* Date */}
                <div className="roommap-form-group">
                  <label className="roommap-form-label">Date *</label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => handleBookingFormChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`roommap-form-input ${bookingErrors.date ? 'roommap-form-input-error' : ''} ${conflictError ? 'roommap-form-input-conflict' : ''}`}
                  />
                  {bookingErrors.date && (
                    <span className="roommap-form-error">
                      <FaExclamationTriangle className="roommap-error-icon" />
                      {bookingErrors.date}
                    </span>
                  )}
                </div>

                {/* Time and Duration */}
                <div className="roommap-form-row">
                  <div className="roommap-form-group">
                    <label className="roommap-form-label">Start Time *</label>
                    <select
                      value={bookingForm.startTime}
                      onChange={(e) => handleBookingFormChange('startTime', e.target.value)}
                      className={`roommap-form-input ${bookingErrors.startTime ? 'roommap-form-input-error' : ''} ${conflictError ? 'roommap-form-input-conflict' : ''}`}
                    >
                      <option value="">Select time</option>
                      {availableTimeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    {bookingErrors.startTime && (
                      <span className="roommap-form-error">
                        <FaExclamationTriangle className="roommap-error-icon" />
                        {bookingErrors.startTime}
                      </span>
                    )}
                  </div>

                  <div className="roommap-form-group">
                    <label className="roommap-form-label">Duration *</label>
                    <select
                      value={bookingForm.duration}
                      onChange={(e) => handleBookingFormChange('duration', e.target.value)}
                      className={`roommap-form-input ${bookingErrors.duration ? 'roommap-form-input-error' : ''} ${conflictError ? 'roommap-form-input-conflict' : ''}`}
                    >
                      <option value="">Select duration</option>
                      {durations.map(dur => (
                        <option key={dur.value} value={dur.value}>{dur.label}</option>
                      ))}
                    </select>
                    {bookingErrors.duration && (
                      <span className="roommap-form-error">
                        <FaExclamationTriangle className="roommap-error-icon" />
                        {bookingErrors.duration}
                      </span>
                    )}
                  </div>
                </div>

                {/* Attendees */}
                <div className="roommap-form-group">
                  <label className="roommap-form-label">Number of Attendees *</label>
                  <input
                    type="number"
                    value={bookingForm.attendees}
                    onChange={(e) => handleBookingFormChange('attendees', e.target.value)}
                    min="1"
                    max={selectedRoom.capacity}
                    className={`roommap-form-input ${bookingErrors.attendees ? 'roommap-form-input-error' : ''}`}
                    placeholder="Enter number of attendees"
                  />
                  {bookingErrors.attendees && (
                    <span className="roommap-form-error">
                      <FaExclamationTriangle className="roommap-error-icon" />
                      {bookingErrors.attendees}
                    </span>
                  )}
                </div>

                {/* Purpose */}
                <div className="roommap-form-group">
                  <label className="roommap-form-label">Meeting Purpose *</label>
                  <textarea
                    value={bookingForm.purpose}
                    onChange={(e) => handleBookingFormChange('purpose', e.target.value)}
                    className={`roommap-form-textarea ${bookingErrors.purpose ? 'roommap-form-input-error' : ''}`}
                    placeholder="Describe the purpose of your meeting..."
                    rows={3}
                    maxLength={500}
                  />
                  {bookingErrors.purpose && (
                    <span className="roommap-form-error">
                      <FaExclamationTriangle className="roommap-error-icon" />
                      {bookingErrors.purpose}
                    </span>
                  )}
                </div>

                {/* Manager Selection for Employees */}
                {user.role === 'employee' && (
                  <div className="roommap-form-group">
                    <label className="roommap-form-label">Select Manager for Approval *</label>
                    <select
                      value={bookingForm.manager}
                      onChange={(e) => handleBookingFormChange('manager', e.target.value)}
                      className={`roommap-form-input ${bookingErrors.manager ? 'roommap-form-input-error' : ''}`}
                    >
                      <option value="">Choose your manager</option>
                      {managers.map(mgr => (
                        <option key={mgr.id} value={mgr.id}>
                          {mgr.name} ({mgr.team})
                        </option>
                      ))}
                    </select>
                    {bookingErrors.manager && (
                      <span className="roommap-form-error">
                        <FaExclamationTriangle className="roommap-error-icon" />
                        {bookingErrors.manager}
                      </span>
                    )}
                  </div>
                )}
              </form>

              {/* Equipment Display */}
              <div className="roommap-dialog-equipment">
                <label className="roommap-info-label">Available Equipment</label>
                <div className="roommap-equipment-list">
                  {selectedRoom.equipment?.map((item, index) => {
                    const IconComponent = getEquipmentIcon(item);
                    return (
                      <div key={index} className="roommap-equipment-item-dialog">
                        <IconComponent className="roommap-equipment-icon-dialog" />
                        <span>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Actions */}
              <div className="roommap-dialog-actions">
                <button 
                  className="roommap-book-button"
                  onClick={handleBookRoom}
                  disabled={isSubmittingBooking || conflictError}
                >
                  <FaPlus className="roommap-button-icon" />
                  {isSubmittingBooking ? 'Booking...' : (user.role === 'employee' ? 'Submit for Approval' : 'Book Now')}
                </button>
                <button 
                  onClick={() => setIsBookingDialogOpen(false)} 
                  className="roommap-cancel-button"
                  disabled={isSubmittingBooking}
                >
                  Cancel
                </button>
              </div>

              {/* Employee Notice */}
              {user.role === 'employee' && (
                <div className="roommap-approval-notice">
                  <FaExclamationCircle className="roommap-notice-icon" />
                  <p className="roommap-notice-text">
                    Your booking will be sent to the selected manager for approval. 
                    You'll be notified once it's reviewed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomMap;