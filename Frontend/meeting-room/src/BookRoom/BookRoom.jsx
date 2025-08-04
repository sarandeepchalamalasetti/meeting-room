import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  FiPlus, 
  FiCalendar, 
  FiClock, 
  FiUsers, 
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiMonitor,
  FiWifi,
  FiPhone,
  FiMic,
  FiCoffee,
  FiChevronDown,
  FiX,
  FiHome,
  FiWifiOff,
  FiRefreshCw,
  FiBook,
  FiSlash,
  FiXCircle,
  FiChevronUp,
  FiUser
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import './BookRoom.css';

const BookRoom = () => {
  // Get user data from sessionStorage with fallbacks
  const getUserData = () => {
    try {
      const userData = sessionStorage.getItem('user');
      return userData ? JSON.parse(userData) : { 
        role: 'employee',
        name: 'Demo User',
        email: 'demo@example.com',
        id: 'demo-user-id'
      };
    } catch (error) {
      return { 
        role: 'employee', 
        name: 'Demo User',
        email: 'demo@example.com',
        id: 'demo-user-id'
      };
    }
  };

  const user = getUserData();
  const token = sessionStorage.getItem('token');
  
  // State management
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('');
  const [attendees, setAttendees] = useState('');
  const [purpose, setPurpose] = useState('');
  const [manager, setManager] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [floorFilter, setFloorFilter] = useState('all');
  const [wingFilter, setWingFilter] = useState('all');
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);
  const [showWingDropdown, setShowWingDropdown] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  // Manager-related state for JSON-based system
  const [managers, setManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [managerSearchTerm, setManagerSearchTerm] = useState('');
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [selectedManagerName, setSelectedManagerName] = useState('');
  const [selectedManagerInfo, setSelectedManagerInfo] = useState(null);

  // FIXED: Add initialization complete state to prevent premature button hiding
  const [initializationComplete, setInitializationComplete] = useState(false);

  // Mock data fallbacks
  const fallbackRooms = [
    {
      id: 'wing-a-conf-1',
      name: 'Conference Room A1',
      capacity: 12,
      floor: 'Floor 1',
      wing: 'Wing A',
      equipment: ['Projector', 'Whiteboard', 'Video Conf', 'Audio System'],
      description: 'Large conference room perfect for team meetings and presentations',
    },
    {
      id: 'wing-a-board',
      name: 'Board Room A2',
      capacity: 16,
      floor: 'Floor 2',
      wing: 'Wing A',
      equipment: ['4K Display', 'Video Conf', 'Premium Audio', 'Catering Setup'],
      description: 'Executive boardroom for high-level meetings and presentations',
    },
    {
      id: 'wing-a-meeting-1',
      name: 'Meeting Room A3',
      capacity: 8,
      floor: 'Floor 1',
      wing: 'Wing A',
      equipment: ['TV Display', 'Whiteboard', 'Video Conf'],
      description: 'Cozy meeting room ideal for small team discussions',
    },
    {
      id: 'wing-a-creative',
      name: 'Creative Space A4',
      capacity: 10,
      floor: 'Floor 2',
      wing: 'Wing A',
      equipment: ['Interactive Display', 'Whiteboard', 'Design Tools'],
      description: 'Modern creative space with innovative collaboration tools',
    },
    {
      id: 'wing-b-training',
      name: 'Training Room B1',
      capacity: 20,
      floor: 'Floor 1',
      wing: 'Wing B',
      equipment: ['Projector', 'Whiteboard', 'Audio System', 'Multiple Displays'],
      description: 'Spacious training room with flexible seating arrangements',
    },
    {
      id: 'wing-b-discussion',
      name: 'Discussion Room B2',
      capacity: 6,
      floor: 'Floor 2',
      wing: 'Wing B',
      equipment: ['Whiteboard', 'TV Display'],
      description: 'Intimate space for focused discussions and brainstorming',
    },
    {
      id: 'wing-b-meeting-1',
      name: 'Small Meeting B3',
      capacity: 4,
      floor: 'Floor 1',
      wing: 'Wing B',
      equipment: ['TV Display', 'Whiteboard'],
      description: 'Compact meeting room for quick discussions',
    },
    {
      id: 'wing-b-meeting-2',
      name: 'Small Meeting B4',
      capacity: 4,
      floor: 'Floor 2',
      wing: 'Wing B',
      equipment: ['TV Display', 'Whiteboard'],
      description: 'Compact meeting room for quick discussions',
    }
  ];

  // Fallback managers matching JSON structure
  const fallbackManagers = [
    { 
      _id: 'EI-850', 
      name: 'Sarandeep Chalamalasetti', 
      email: 'sarandeep.chalamalasetti@ispace.com',
      team: 'Engineering',
      department: 'Technology',
      role: 'manager',
      employeeId: 'EI-850'
    },
    { 
      _id: 'EI-105', 
      name: 'AjayKumar Ummadi', 
      email: 'ajay.ummadi@ispace.com',
      team: 'Product Development',
      department: 'Technology',
      role: 'manager',
      employeeId: 'EI-105'
    }
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

  // FIXED: Enhanced fetch managers with proper error handling and timeout
  const fetchManagers = useCallback(async () => {
    if (user.role !== 'employee') {
      setManagersLoading(false);
      return;
    }
    
    try {
      setManagersLoading(true);
      
      if (!token || !isOnline) {
        setManagers(fallbackManagers);
        setManagersLoading(false);
        return;
      }

      console.log('📋 Fetching managers from JSON-based API...');
      
      // FIXED: Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await axios.get('http://localhost:5000/api/auth/managers', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 8000,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const managersData = response.data || fallbackManagers;
      console.log('📋 Fetched managers from JSON:', managersData);
      setManagers(managersData);
      setIsOnline(true);
      
    } catch (error) {
      console.error('Failed to fetch managers from JSON:', error);
      setManagers(fallbackManagers);
      setIsOnline(false);
      
      if (error.response?.status !== 404) {
        toast.error('Failed to load managers from server. Using cached data.');
      }
    } finally {
      // FIXED: Always set loading to false
      setManagersLoading(false);
    }
  }, [token, isOnline, user.role]);

  // Filter managers based on search term
  const getFilteredManagers = () => {
    if (!managerSearchTerm.trim()) return managers;
    
    const searchLower = managerSearchTerm.toLowerCase();
    return managers.filter(manager => 
      manager.name.toLowerCase().includes(searchLower) ||
      manager.email.toLowerCase().includes(searchLower) ||
      (manager.team && manager.team.toLowerCase().includes(searchLower)) ||
      (manager.department && manager.department.toLowerCase().includes(searchLower)) ||
      (manager.employeeId && manager.employeeId.toLowerCase().includes(searchLower))
    );
  };

  // Handle manager selection
  const handleManagerSelect = (selectedManager) => {
    const managerId = selectedManager._id || selectedManager.employeeId;
    setManager(managerId);
    setSelectedManagerName(selectedManager.name);
    setSelectedManagerInfo(selectedManager);
    setShowManagerDropdown(false);
    setManagerSearchTerm('');
    console.log('👤 Selected manager from JSON:', selectedManager);
    console.log('👤 Manager ID stored:', managerId);
  };

  // Helper function to convert time to minutes for comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to check if two time ranges overlap
  const isTimeOverlapping = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1;
  };

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Helper function to filter bookings by today's date for daily reset
  const getTodaysBookings = () => {
    const today = getTodayDate();
    return bookings.filter(booking => booking.date === today);
  };

  // Helper function to get user's own bookings
  const getUserBookings = () => {
    return bookings.filter(booking => 
      booking.bookedBy?.id === user.id || 
      booking.bookedBy?.email === user.email ||
      booking.bookedBy?.employeeId === user.employeeId ||
      booking.bookedBy?.username === user.name
    );
  };

  // Get conflicting booking info for a specific time slot - FIXED: Only show when time is selected
  const getConflictingBookingInfo = (roomName, date, startTime, durationMinutes) => {
    // Only check conflicts when all required fields are selected
    if (!roomName || !date || !startTime || !durationMinutes) {
      return { hasConflict: false };
    }

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

  // Get available time slots for a specific room and date
  const getAvailableTimeSlots = (roomName, date, selectedDuration) => {
    if (!roomName || !date || !selectedDuration) return timeSlots;

    const durationMinutes = parseInt(selectedDuration);
    
    return timeSlots.filter(slot => {
      const conflict = getConflictingBookingInfo(roomName, date, slot, durationMinutes);
      return !conflict.hasConflict;
    });
  };

  // FIXED: Enhanced fetch rooms with proper error handling and timeout
  const fetchRooms = useCallback(async () => {
    try {
      setRoomsLoading(true);
      
      if (!token || !isOnline) {
        setRooms(fallbackRooms);
        setIsOnline(false);
        setRoomsLoading(false);
        return;
      }

      // FIXED: Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await axios.get('http://localhost:5000/api/rooms', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 8000,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      setRooms(response.data || fallbackRooms);
      setIsOnline(true);
      
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setRooms(fallbackRooms);
      setIsOnline(false);
      
      toast.error('Failed to load rooms from server. Using cached data.');
    } finally {
      // FIXED: Always set loading to false
      setRoomsLoading(false);
    }
  }, [token, isOnline]);

  // FIXED: Enhanced fetch bookings with proper error handling
  const fetchBookings = useCallback(async (showToast = false) => {
    try {
      if (!token) {
        const mockData = [
          {
            _id: 'mock-1',
            roomName: 'Conference Room A1',
            date: new Date().toISOString().split('T')[0],
            startTime: '10:00',
            endTime: '11:00',
            purpose: 'Team Standup',
            status: 'approved',
            bookedBy: {
              name: 'John Doe',
              email: 'john@example.com',
              role: 'manager',
              id: 'john-doe-id'
            }
          },
          {
            _id: 'mock-2',
            roomName: 'Board Room A2',
            date: new Date().toISOString().split('T')[0],
            startTime: '14:00',
            endTime: '15:30',
            purpose: 'Board Meeting',
            status: 'cancelled',
            bookedBy: {
              name: 'Demo User',
              email: 'demo@example.com',
              role: 'manager',
              id: 'demo-user-id'
            }
          },
          {
            _id: 'mock-3',
            roomName: 'Meeting Room A3',
            date: new Date().toISOString().split('T')[0],
            startTime: '12:00',
            endTime: '13:00',
            purpose: 'Project Review',
            status: 'pending',
            bookedBy: {
              name: 'Sarandeep Chalamalasetti',
              email: 'sarandeep@example.com',
              role: 'employee',
              id: 'sarandeep-id'
            }
          },
          {
            _id: 'mock-4',
            roomName: 'Creative Space A4',
            date: new Date().toISOString().split('T')[0],
            startTime: '15:00',
            endTime: '16:00',
            purpose: 'Design Review',
            status: 'rejected',
            bookedBy: {
              name: 'Alice Johnson',
              email: 'alice@example.com',
              role: 'employee',
              id: 'alice-id'
            }
          },
          {
            _id: 'mock-5',
            roomName: 'Training Room B1',
            date: new Date().toISOString().split('T')[0],
            startTime: '16:00',
            endTime: '17:00',
            purpose: 'HR Meeting',
            status: 'approved',
            bookedBy: {
              name: 'HR Manager',
              email: 'hr@example.com',
              role: 'hr',
              id: 'hr-manager-id'
            }
          }
        ];
        setBookings(mockData);
        setIsOnline(false);
        return;
      }

      // FIXED: Add timeout for booking fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await axios.get('http://localhost:5000/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 8000,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      setBookings(response.data || []);
      setIsOnline(true);
      setLastFetchTime(new Date());
      
      if (showToast) {
        toast.success('Bookings refreshed!');
      }
      
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setIsOnline(false);
      
      if (showToast) {
        toast.error('Failed to refresh bookings. Using cached data.');
      }
    }
  }, [token]);

  // FIXED: Initialize component with proper sequencing
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Fetch rooms first
        await fetchRooms();
        
        // Then fetch managers if user is employee
        if (user.role === 'employee') {
          await fetchManagers();
        }
        
        // Finally fetch bookings
        await fetchBookings();
        
        // Mark initialization as complete
        setInitializationComplete(true);
        
      } catch (error) {
        console.error('Initialization failed:', error);
        // Still mark as complete to prevent infinite loading
        setInitializationComplete(true);
      }
    };

    initializeComponent();
  }, [fetchRooms, fetchManagers, fetchBookings, user.role]);

  // Real-time polling for bookings every 30 seconds
  useEffect(() => {
    if (!isPolling || !initializationComplete) return;

    const interval = setInterval(() => {
      fetchBookings();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBookings, isPolling, initializationComplete]);

  // Start polling when component mounts and stop when unmounts
  useEffect(() => {
    if (initializationComplete) {
      setIsPolling(true);
    }
    return () => setIsPolling(false);
  }, [initializationComplete]);

  // Enhanced booking refresh - fetch immediately when date changes
  useEffect(() => {
    if (initializationComplete) {
      fetchBookings();
    }
  }, [fetchBookings, selectedDate, refreshKey, initializationComplete]);

  // Helper function to get booking info for tooltip with correct status and role
  const getBookingInfo = (roomName, date, timeSlot) => {
    const booking = bookings.find(booking => 
      booking.roomName === roomName && 
      booking.date === date &&
      `${booking.startTime}-${booking.endTime}` === timeSlot
    );
    
    if (booking) {
      // Determine the correct status based on booking logic
      let displayStatus = booking.status || 'Unknown';
      
      // If booking is by employee and not yet approved/rejected, it should show as pending
      if (booking.bookedBy?.role === 'employee' && booking.status !== 'approved' && booking.status !== 'rejected' && booking.status !== 'cancelled') {
        displayStatus = 'pending';
      }
      
      // Get role information with proper formatting
      const userRole = booking.bookedBy?.role || 'Unknown';
      const roleDisplay = userRole.charAt(0).toUpperCase() + userRole.slice(1);
      
      return {
        bookedBy: booking.bookedBy?.name || booking.bookedBy?.username || 'Unknown User',
        status: displayStatus,
        purpose: booking.purpose || 'No purpose specified',
        startTime: booking.startTime,
        endTime: booking.endTime,
        role: roleDisplay
      };
    }
    
    return null;
  };

  // Get rooms with current booking status - show ALL booking slots to ALL users
  const getRoomsWithStatus = () => {
    const selectedDateToCheck = selectedDate || new Date().toISOString().split('T')[0];
    
    return rooms.map(room => {
      // Get ALL bookings for this room and date (for displaying time slots)
      const allRoomBookings = bookings.filter(booking => 
        booking.roomName === room.name && 
        booking.date === selectedDateToCheck &&
        (booking.status === 'approved' || booking.status === 'pending')
      );

      // Get role-filtered bookings for status calculation only (employees don't see manager/HR for status)
      let statusRelevantBookings = allRoomBookings;
      if (user.role === 'employee') {
        statusRelevantBookings = allRoomBookings.filter(booking => 
          (booking.bookedBy?.role !== 'manager' && booking.bookedBy?.role !== 'hr') || 
          booking.bookedBy?.id === user.id ||
          booking.bookedBy?.email === user.email
        );
      }

      let status = 'available';
      let nextAvailable = 'Available Now';
      // Show ALL booking slots to ALL users, regardless of who booked them
      let bookingSlots = allRoomBookings.map(booking => `${booking.startTime}-${booking.endTime}`);

      if (statusRelevantBookings.length > 0) {
        const currentTime = new Date();
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const isToday = selectedDateToCheck === new Date().toISOString().split('T')[0];
        
        let hasCurrentBooking = false;
        
        statusRelevantBookings.forEach(booking => {
          const startMinutes = timeToMinutes(booking.startTime);
          const endMinutes = timeToMinutes(booking.endTime);
          
          if (booking.status === 'approved') {
            if (isToday && currentMinutes >= startMinutes && currentMinutes < endMinutes) {
              status = 'booked';
              nextAvailable = booking.endTime;
              hasCurrentBooking = true;
            } else if (!hasCurrentBooking) {
              if (isToday) {
                if (startMinutes > currentMinutes) {
                  status = 'available';
                } else if (endMinutes <= currentMinutes) {
                  status = 'available';
                }
              } else {
                status = 'booked';
                nextAvailable = `Booked ${booking.startTime}-${booking.endTime}`;
              }
            }
          } else if (booking.status === 'pending' && !hasCurrentBooking && status === 'available') {
            status = 'pending';
            nextAvailable = 'Pending Approval';
          }
        });
        
        const hasApprovedBookings = statusRelevantBookings.some(b => b.status === 'approved');
        if (hasApprovedBookings && status === 'available' && isToday) {
          const futureBookings = statusRelevantBookings.filter(b => 
            b.status === 'approved' && timeToMinutes(b.startTime) > currentMinutes
          );
          if (futureBookings.length > 0) {
            nextAvailable = `Next: ${futureBookings[0].startTime}`;
          }
        }
      }
      
      return {
        ...room,
        status,
        nextAvailable,
        bookings: bookingSlots
      };
    });
  };

  const roomsWithStatus = getRoomsWithStatus();

  // Calculate progress percentage based on form completion
  useEffect(() => {
    const requiredFields = [selectedRoom, selectedDate, selectedTime, duration, attendees, purpose];
    if (user.role === 'employee') {
      requiredFields.push(manager);
    }
    
    const completedFields = requiredFields.filter(field => field && field.toString().trim() !== '').length;
    const totalFields = requiredFields.length;
    const percentage = Math.round((completedFields / totalFields) * 100);
    setProgressPercentage(percentage);
  }, [selectedRoom, selectedDate, selectedTime, duration, attendees, purpose, manager, user.role]);

  // Get progress color class based on percentage
  const getProgressColorClass = (percentage) => {
    if (percentage <= 20) return 'bookroom-progress-red';
    if (percentage <= 40) return 'bookroom-progress-orange';
    if (percentage <= 60) return 'bookroom-progress-yellow';
    if (percentage <= 80) return 'bookroom-progress-blue';
    return 'bookroom-progress-green';
  };

  // Get progress status text
  const getProgressStatusText = (percentage) => {
    if (percentage === 0) return 'Not Started';
    if (percentage <= 20) return 'Getting Started';
    if (percentage <= 40) return 'Some Progress';
    if (percentage <= 60) return 'Halfway There';
    if (percentage <= 80) return 'Almost Done';
    if (percentage < 100) return 'Nearly Complete';
    return 'Complete';
  };

  // Updated status counts logic based on requirements
  const getStatusCounts = () => {
    const totalRooms = rooms.length;
    const selectedDateToCheck = selectedDate || getTodayDate();
    const todaysBookings = getTodaysBookings();
    const userBookings = getUserBookings();
    const todaysUserBookings = userBookings.filter(booking => booking.date === selectedDateToCheck);
    
    if (user.role === 'employee') {
      // Employee dashboard - 6 cards
      const approvedBookingsToday = todaysBookings.filter(booking => booking.status === 'approved');
      const bookedRoomNames = [...new Set(approvedBookingsToday.map(booking => booking.roomName))];
      const availableRooms = totalRooms - bookedRoomNames.length;
      
      const myBookings = todaysUserBookings.filter(booking => 
        booking.status === 'approved'
      ).length;
      
      const pendingBookings = todaysUserBookings.filter(booking => 
        booking.status === 'pending'
      ).length;
      
      const cancelledBookings = todaysUserBookings.filter(booking => 
        booking.status === 'cancelled'
      ).length;
      
      const rejectedBookings = todaysUserBookings.filter(booking => 
        booking.status === 'rejected'
      ).length;
      
      return {
        totalRooms,
        availableRooms,
        myBookings,
        pendingBookings,
        cancelledBookings,
        rejectedBookings
      };
    } else {
      // Manager/HR dashboard - 4 cards
      const approvedBookingsToday = todaysBookings.filter(booking => booking.status === 'approved');
      const bookedRoomNames = [...new Set(approvedBookingsToday.map(booking => booking.roomName))];
      const availableRooms = totalRooms - bookedRoomNames.length;
      
      const myBookings = todaysUserBookings.filter(booking => 
        booking.status === 'approved'
      ).length;
      
      const cancelledBookings = todaysUserBookings.filter(booking => 
        booking.status === 'cancelled'
      ).length;
      
      return {
        totalRooms,
        availableRooms,
        myBookings,
        cancelledBookings
      };
    }
  };

  const statusCounts = getStatusCounts();

  const getEquipmentIcon = (equipment) => {
    const iconMap = {
      'projector': FiMonitor,
      '4k display': FiMonitor,
      'tv display': FiMonitor,
      'video conf': FiPhone,
      'whiteboard': FiMonitor,
      'audio system': FiMic,
      'premium audio': FiMic,
      'multiple displays': FiMonitor,
      'interactive display': FiMonitor,
      'design tools': FiMonitor,
      'catering setup': FiCoffee,
      'wifi': FiWifi
    };
    
    const key = equipment.toLowerCase();
    for (const [term, Icon] of Object.entries(iconMap)) {
      if (key.includes(term)) return Icon;
    }
    return FiMonitor;
  };

  const getFilteredRooms = () => {
    return roomsWithStatus.filter(room => {
      const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFloor = floorFilter === 'all' || room.floor === floorFilter;
      const matchesWing = wingFilter === 'all' || room.wing === wingFilter;
      return matchesSearch && matchesFloor && matchesWing;
    });
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchBookings(true);
    fetchRooms();
    if (user.role === 'employee') {
      fetchManagers();
    }
  };

  // FIXED: Enhanced form submission with better state management
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom || !selectedDate || !selectedTime || !duration || !attendees || !purpose) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (user.role === 'employee' && !manager) {
      toast.error('Please select a manager for approval');
      return;
    }

    setLoading(true);

    try {
      await fetchBookings();

      const selectedRoomObj = rooms.find(r => r.id === selectedRoom);
      const selectedRoomName = selectedRoomObj?.name;

      if (!selectedRoomName) {
        toast.error('Selected room not found. Please refresh and try again.');
        return;
      }

      // Check for booking conflicts using latest data
      const conflictInfo = getConflictingBookingInfo(selectedRoomName, selectedDate, selectedTime, duration);
      if (conflictInfo.hasConflict) {
        toast.error(
          `This time slot conflicts with an existing booking by ${conflictInfo.bookedBy}! Please select a different time.`
        );
        return;
      }

      // Calculate end time
      const startMinutes = timeToMinutes(selectedTime);
      const endMinutes = startMinutes + parseInt(duration);
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      const userInfo = {
        name: user.name || user.username || user.fullName || 'Demo User',
        email: user.email || user.userEmail || 'demo@example.com',
        employeeId: user.employeeId || user.id || user._id || 'demo-user-id',
        role: user.role || 'employee',
        department: user.department || 'General',
        phone: user.phone || ''
      };

      // Prepare the correct approval workflow data
      const bookingData = {
        room: selectedRoomName,
        roomName: selectedRoomName,
        date: selectedDate,
        time: selectedTime,
        startTime: selectedTime,
        endTime: endTime,
        duration: duration,
        attendees: parseInt(attendees),
        purpose: purpose,
        description: purpose,
        status: user.role === 'employee' ? 'pending' : 'approved',
        role: user.role,
        userInfo: userInfo,
        managerId: user.role === 'employee' ? manager : null,
        managerInfo: user.role === 'employee' && selectedManagerInfo ? {
          name: selectedManagerInfo.name,
          email: selectedManagerInfo.email,
          employeeId: selectedManagerInfo.employeeId || selectedManagerInfo._id
        } : null,
        priority: 'medium',
        urgency: 'normal',
        equipment: selectedRoomObj?.equipment || [],
        estimatedCost: `$${parseInt(attendees) * 5}`,
        attachments: []
      };

      console.log('📝 Submitting booking with approval workflow data:', {
        managerId: bookingData.managerId,
        managerInfo: bookingData.managerInfo,
        status: bookingData.status,
        roomName: bookingData.roomName
      });

      if (!token || !isOnline) {
        const mockBooking = {
          _id: `mock-${Date.now()}`,
          roomName: selectedRoomName,
          date: selectedDate,
          startTime: selectedTime,
          endTime: endTime,
          purpose: purpose,
          status: user.role === 'employee' ? 'pending' : 'approved',
          bookedBy: userInfo,
          managerId: bookingData.managerId,
          managerInfo: bookingData.managerInfo
        };
        
        setBookings(prev => [...prev, mockBooking]);
        toast.success(user.role === 'employee' ? 
          `Booking request sent to ${selectedManagerInfo?.name || 'manager'} for approval!` : 
          "Booking created successfully!"
        );
      } else {
        // FIXED: Add timeout for submission
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await axios.post(
          'http://localhost:5000/api/bookings/create',
          bookingData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000,
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        console.log('✅ Booking response:', response.data);
        
        if (user.role === 'employee') {
          toast.success(`Booking request sent to ${selectedManagerInfo?.name || 'manager'} for approval!`);
        } else {
          toast.success("Booking created successfully!");
        }
        
        // FIXED: Immediate booking refresh
        await fetchBookings();
      }
      
      // FIXED: Reset form immediately after successful submission
      setSelectedRoom('');
      setSelectedDate('');
      setSelectedTime('');
      setDuration('');
      setAttendees('');
      setPurpose('');
      setManager('');
      setSelectedManagerName('');
      setSelectedManagerInfo(null);
      setManagerSearchTerm('');
      
      setRefreshKey(prev => prev + 1);

    } catch (error) {
      console.error("❌ Booking Failed:", error);
      
      if (error.response?.status === 409) {
        toast.error(error.response.data.message || 'Time slot is already booked by another user!');
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else if (error.name === 'AbortError') {
        toast.error('Request timeout. Please try again.');
      } else {
        toast.error(error.response?.data?.message || 'Booking failed. Please try again.');
      }
    } finally {
      // FIXED: Always reset loading state
      setLoading(false);
    }
  };

  const RoomCard = ({ room }) => (
    <div 
      className={`bookroom-room-card ${selectedRoom === room.id ? 'bookroom-selected' : ''}`}
      onClick={() => setSelectedRoom(room.id)}
    >
      <div className="bookroom-room-header">
        <div className="bookroom-room-info">
          <h3 className="bookroom-room-name">{room.name}</h3>
          <p className="bookroom-room-location">{room.floor} • {room.wing}</p>
        </div>
        <div className="bookroom-room-status">
          {room.status === 'available' ? (
            <FiCheckCircle className="bookroom-status-icon bookroom-available" />
          ) : room.status === 'booked' ? (
            <FiClock className="bookroom-status-icon bookroom-booked" />
          ) : room.status === 'pending' ? (
            <FiAlertCircle className="bookroom-status-icon bookroom-pending" />
          ) : (
            <FiX className="bookroom-status-icon bookroom-rejected" />
          )}
        </div>
      </div>
      
      <div className="bookroom-room-content">
        <div className="bookroom-room-details">
          <div className="bookroom-detail-item">
            <FiUsers className="bookroom-detail-icon" />
            <span>Up to {room.capacity} people</span>
          </div>
          <div className="bookroom-detail-item">
            <FiClock className="bookroom-detail-icon" />
            <span>{room.nextAvailable}</span>
          </div>
        </div>
        
        <p className="bookroom-room-description">{room.description}</p>
        
        <div className="bookroom-room-equipment">
          <h4 className="bookroom-equipment-title">Equipment:</h4>
          <div className="bookroom-equipment-list">
            {room.equipment?.map((item, index) => {
              const IconComponent = getEquipmentIcon(item);
              return (
                <div key={index} className="bookroom-equipment-item">
                  <IconComponent className="bookroom-equipment-icon" />
                  <span className="bookroom-equipment-name">{item}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bookroom-room-availability">
          <h4 className="bookroom-availability-title">
            {selectedDate ? `Bookings for ${selectedDate}:` : "Today's Bookings:"}
          </h4>
          <div className="bookroom-booking-slots">
            {room.bookings?.length === 0 ? (
              <span className="bookroom-no-bookings">No bookings</span>
            ) : (
              room.bookings?.map((booking, index) => {
                const bookingInfo = getBookingInfo(room.name, selectedDate || getTodayDate(), booking);
                return (
                  <span 
                    key={index} 
                    className="bookroom-booking-slot"
                    data-tooltip={bookingInfo ? `Booked by: ${bookingInfo.bookedBy}\nRole: ${bookingInfo.role}\nStatus: ${bookingInfo.status.charAt(0).toUpperCase() + bookingInfo.status.slice(1)}\nPurpose: ${bookingInfo.purpose}` : ''}
                  >
                    {booking}
                  </span>
                );
              })
            )}
          </div>
        </div>
        
        {selectedRoom === room.id && (
          <div className="bookroom-selected-indicator">
            <FiCheckCircle className="bookroom-selected-icon" />
            <span>Selected</span>
          </div>
        )}
      </div>
    </div>
  );

  // Get available time slots for selected room
  const availableTimeSlots = selectedRoom && selectedDate && duration ? 
    getAvailableTimeSlots(
      rooms.find(r => r.id === selectedRoom)?.name, 
      selectedDate, 
      duration
    ) : timeSlots;

  // Get conflict info for display - only show when all fields are selected
  const getConflictMessage = () => {
    if (!selectedRoom || !selectedDate || !selectedTime || !duration) return null;
    
    const selectedRoomObj = rooms.find(r => r.id === selectedRoom);
    if (!selectedRoomObj) return null;
    
    const conflictInfo = getConflictingBookingInfo(
      selectedRoomObj.name, 
      selectedDate, 
      selectedTime, 
      duration
    );
    
    if (conflictInfo.hasConflict) {
      return {
        bookedBy: conflictInfo.bookedBy,
        timeSlot: conflictInfo.timeSlot
      };
    }
    
    return null;
  };

  const conflictMessage = getConflictMessage();

  // FIXED: Show loading only during initial load
  if (!initializationComplete) {
    return (
      <div className="bookroom-book-room">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <FiRefreshCw className="bookroom-refresh-icon bookroom-spinning" style={{ width: '2rem', height: '2rem', marginBottom: '1rem' }} />
            <p>Loading rooms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bookroom-book-room">
      <div className="bookroom-book-room-header">
        <div className="bookroom-header-content">
          <div className="bookroom-header-info">
            <FiPlus className="bookroom-header-icon" />
            <div>
              <h1 className="bookroom-book-room-title">Book a Room</h1>
              <p className="bookroom-book-room-subtitle">
                Reserve a meeting room for your team
                {!isOnline && (
                  <span className="bookroom-offline-notice">
                    {' '}<FiWifiOff className="bookroom-offline-icon" /> Offline Mode
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="bookroom-progress-container">
            <div className="bookroom-progress-info">
              <span className="bookroom-progress-label">Booking Progress</span>
              <div className="bookroom-progress-status">
                <span className="bookroom-progress-percentage">{progressPercentage}%</span>
                <span className="bookroom-progress-status-text">{getProgressStatusText(progressPercentage)}</span>
              </div>
            </div>
            <div className="bookroom-progress-bar">
              <div 
                className={`bookroom-progress-fill ${getProgressColorClass(progressPercentage)}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className={`bookroom-status-summary ${user.role === 'employee' ? 'bookroom-employee-layout' : ''}`}>
        <div className="bookroom-status-card bookroom-total">
          <div className="bookroom-status-icon-wrapper bookroom-total">
            <FiHome className="bookroom-status-summary-icon" />
          </div>
          <div className="bookroom-status-info">
            <h3 className="bookroom-status-count">{statusCounts.totalRooms}</h3>
            <p className="bookroom-status-label">Total Rooms</p>
          </div>
        </div>
        
        <div className="bookroom-status-card bookroom-available">
          <div className="bookroom-status-icon-wrapper bookroom-available">
            <FiCheckCircle className="bookroom-status-summary-icon" />
          </div>
          <div className="bookroom-status-info">
            <h3 className="bookroom-status-count">{statusCounts.availableRooms}</h3>
            <p className="bookroom-status-label">Available</p>
          </div>
        </div>
        
        {user.role === 'employee' ? (
          <>
            <div className="bookroom-status-card bookroom-my-bookings">
              <div className="bookroom-status-icon-wrapper bookroom-my-bookings">
                <FiBook className="bookroom-status-summary-icon" />
              </div>
              <div className="bookroom-status-info">
                <h3 className="bookroom-status-count">{statusCounts.myBookings}</h3>
                <p className="bookroom-status-label">My Bookings</p>
              </div>
            </div>
            
            <div className="bookroom-status-card bookroom-pending">
              <div className="bookroom-status-icon-wrapper bookroom-pending">
                <FiAlertCircle className="bookroom-status-summary-icon" />
              </div>
              <div className="bookroom-status-info">
                <h3 className="bookroom-status-count">{statusCounts.pendingBookings}</h3>
                <p className="bookroom-status-label">Pending</p>
              </div>
            </div>
            
            <div className="bookroom-status-card bookroom-cancelled">
              <div className="bookroom-status-icon-wrapper bookroom-cancelled">
                <FiSlash className="bookroom-status-summary-icon" />
              </div>
              <div className="bookroom-status-info">
                <h3 className="bookroom-status-count">{statusCounts.cancelledBookings}</h3>
                <p className="bookroom-status-label">My Canceled</p>
              </div>
            </div>
            
            <div className="bookroom-status-card bookroom-rejected">
              <div className="bookroom-status-icon-wrapper bookroom-rejected">
                <FiXCircle className="bookroom-status-summary-icon" />
              </div>
              <div className="bookroom-status-info">
                <h3 className="bookroom-status-count">{statusCounts.rejectedBookings}</h3>
                <p className="bookroom-status-label">Rejected</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bookroom-status-card bookroom-my-bookings">
              <div className="bookroom-status-icon-wrapper bookroom-my-bookings">
                <FiBook className="bookroom-status-summary-icon" />
              </div>
              <div className="bookroom-status-info">
                <h3 className="bookroom-status-count">{statusCounts.myBookings}</h3>
                <p className="bookroom-status-label">My Bookings</p>
              </div>
            </div>
            
            <div className="bookroom-status-card bookroom-cancelled">
              <div className="bookroom-status-icon-wrapper bookroom-cancelled">
                <FiSlash className="bookroom-status-summary-icon" />
              </div>
              <div className="bookroom-status-info">
                <h3 className="bookroom-status-count">{statusCounts.cancelledBookings}</h3>
                <p className="bookroom-status-label">My Cancelled</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bookroom-book-room-layout">
        {/* Room Selection with Real-time Updates */}
        <div className="bookroom-rooms-section">
          <div className="bookroom-section-header">
            <div className="bookroom-section-title-container">
              <h2 className="bookroom-section-title">Available Rooms</h2>
              {lastFetchTime && (
                <div className="bookroom-last-updated">
                  <span className="bookroom-last-updated-text">
                    Last updated: {lastFetchTime.toLocaleTimeString()}
                  </span>
                  <button 
                    onClick={handleManualRefresh}
                    className="bookroom-refresh-btn"
                    disabled={loading || roomsLoading}
                  >
                    <FiRefreshCw className={`bookroom-refresh-icon ${(loading || roomsLoading) ? 'bookroom-spinning' : ''}`} />
                  </button>
                </div>
              )}
            </div>
            <div className="bookroom-search-filters">
              <div className="bookroom-search-container">
                <FiSearch className="bookroom-search-icon" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search rooms..."
                  className="bookroom-search-input"
                />
              </div>
              
              <div className="bookroom-filter-dropdown-container">
                <button 
                  className="bookroom-filter-dropdown-button"
                  onClick={() => {
                    setShowFloorDropdown(!showFloorDropdown);
                    setShowWingDropdown(false);
                  }}
                >
                  <FiHome className="bookroom-filter-icon" />
                  <span>{floorFilter === 'all' ? 'All Floors' : floorFilter}</span>
                  <FiChevronDown className="bookroom-dropdown-arrow" />
                </button>
                {showFloorDropdown && (
                  <div className="bookroom-filter-dropdown-menu">
                    <div 
                      className="bookroom-filter-dropdown-item"
                      onClick={() => {
                        setFloorFilter('all');
                        setShowFloorDropdown(false);
                      }}
                    >
                      All Floors
                    </div>
                    <div 
                      className="bookroom-filter-dropdown-item"
                      onClick={() => {
                        setFloorFilter('Floor 1');
                        setShowFloorDropdown(false);
                      }}
                    >
                      Floor 1
                    </div>
                    <div 
                      className="bookroom-filter-dropdown-item"
                      onClick={() => {
                        setFloorFilter('Floor 2');
                        setShowFloorDropdown(false);
                      }}
                    >
                      Floor 2
                    </div>
                  </div>
                )}
              </div>

              <div className="bookroom-filter-dropdown-container">
                <button 
                  className="bookroom-filter-dropdown-button"
                  onClick={() => {
                    setShowWingDropdown(!showWingDropdown);
                    setShowFloorDropdown(false);
                  }}
                >
                  <FiMapPin className="bookroom-filter-icon" />
                  <span>{wingFilter === 'all' ? 'All Wings' : wingFilter}</span>
                  <FiChevronDown className="bookroom-dropdown-arrow" />
                </button>
                {showWingDropdown && (
                  <div className="bookroom-filter-dropdown-menu">
                    <div 
                      className="bookroom-filter-dropdown-item"
                      onClick={() => {
                        setWingFilter('all');
                        setShowWingDropdown(false);
                      }}
                    >
                      All Wings
                    </div>
                    <div 
                      className="bookroom-filter-dropdown-item"
                      onClick={() => {
                        setWingFilter('Wing A');
                        setShowWingDropdown(false);
                      }}
                    >
                      Wing A
                    </div>
                    <div 
                      className="bookroom-filter-dropdown-item"
                      onClick={() => {
                        setWingFilter('Wing B');
                        setShowWingDropdown(false);
                      }}
                    >
                      Wing B
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bookroom-rooms-grid">
            {getFilteredRooms().map((room) => (
              <RoomCard key={room.id || room._id} room={room} />
            ))}
          </div>
        </div>

        {/* Enhanced Booking Form */}
        <div className="bookroom-booking-form-section">
          <div className="bookroom-booking-form-card">
            <div className="bookroom-card-header">
              <h3 className="bookroom-form-title">
                <FiCalendar className="bookroom-form-icon" />
                Booking Details
              </h3>
              <p className="bookroom-form-subtitle">
                Fill in the details for your booking
                {!isOnline && ' (Offline mode - changes will sync when online)'}
              </p>
            </div>
            
            <div className="bookroom-card-content">
              <form onSubmit={handleSubmit} className="bookroom-booking-form">
                <div className="bookroom-form-group">
                  <label htmlFor="date" className="bookroom-required">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="bookroom-form-input"
                    required
                  />
                </div>

                <div className="bookroom-form-row">
                  <div className="bookroom-form-group">
                    <label htmlFor="time" className="bookroom-required">Start Time</label>
                    <select 
                      value={selectedTime} 
                      onChange={(e) => setSelectedTime(e.target.value)} 
                      className="bookroom-form-select"
                      required
                    >
                      <option value="">Select time</option>
                      {availableTimeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bookroom-form-group">
                    <label htmlFor="duration" className="bookroom-required">Duration</label>
                    <select 
                      value={duration} 
                      onChange={(e) => setDuration(e.target.value)} 
                      className="bookroom-form-select"
                      required
                    >
                      <option value="">Select duration</option>
                      {durations.map((dur) => (
                        <option key={dur.value} value={dur.value}>{dur.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Enhanced conflict message spanning full width - Only show when conflict exists */}
                {conflictMessage && (
                  <div className="bookroom-conflict-message">
                    <FiAlertCircle className="bookroom-conflict-icon" />
                    <span className="bookroom-conflict-text">
                      {conflictMessage.bookedBy} has already booked the {conflictMessage.timeSlot}
                    </span>
                  </div>
                )}

                <div className="bookroom-form-group">
                  <label htmlFor="attendees" className="bookroom-required">Number of Attendees</label>
                  <input
                    id="attendees"
                    type="number"
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    placeholder="Enter number of attendees"
                    min="1"
                    className="bookroom-form-input"
                    required
                  />
                </div>

                <div className="bookroom-form-group">
                  <label htmlFor="purpose" className="bookroom-required">Meeting Purpose</label>
                  <textarea
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Describe the purpose of your meeting..."
                    className="bookroom-form-textarea"
                    rows={3}
                    required
                  />
                </div>

                {/* Manager Selection using JSON data */}
                {user.role === 'employee' && (
                  <div className="bookroom-form-group">
                    <label htmlFor="manager" className="bookroom-required">
                      Select Manager for Approval
                      {managersLoading && <span className="bookroom-loading-text"> (Loading from JSON...)</span>}
                    </label>
                    <div className="bookroom-manager-search-container">
                      <div 
                        className={`bookroom-manager-search-input ${showManagerDropdown ? 'bookroom-focused' : ''}`}
                        onClick={() => setShowManagerDropdown(!showManagerDropdown)}
                      >
                        <FiUser className="bookroom-manager-search-icon" />
                        <input
                          type="text"
                          value={selectedManagerName || managerSearchTerm}
                          onChange={(e) => {
                            setManagerSearchTerm(e.target.value);
                            if (!showManagerDropdown) setShowManagerDropdown(true);
                            if (selectedManagerName) {
                              setSelectedManagerName('');
                              setManager('');
                              setSelectedManagerInfo(null);
                            }
                          }}
                          placeholder={managersLoading ? "Loading managers from JSON..." : "Search and select manager..."}
                          className="bookroom-manager-input"
                          disabled={managersLoading}
                          required
                        />
                        <button 
                          type="button"
                          className="bookroom-manager-dropdown-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowManagerDropdown(!showManagerDropdown);
                          }}
                          disabled={managersLoading}
                        >
                          {showManagerDropdown ? (
                            <FiChevronUp className="bookroom-manager-chevron" />
                          ) : (
                            <FiChevronDown className="bookroom-manager-chevron" />
                          )}
                        </button>
                      </div>
                      
                      {showManagerDropdown && !managersLoading && (
                        <div className="bookroom-manager-dropdown">
                          {getFilteredManagers().length > 0 ? (
                            getFilteredManagers().map((mgr) => (
                              <div
                                key={mgr._id || mgr.employeeId}
                                className="bookroom-manager-option"
                                onClick={() => handleManagerSelect(mgr)}
                              >
                                <div className="bookroom-manager-info">
                                  <div className="bookroom-manager-name">{mgr.name}</div>
                                  <div className="bookroom-manager-details">
                                    {mgr.email} • {mgr.employeeId} • {mgr.team || mgr.department || 'No Team'}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="bookroom-manager-no-results">
                              {managerSearchTerm.trim() ? 'No managers found matching your search' : 'No managers available'}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {managersLoading && (
                        <div className="bookroom-manager-loading">
                          <FiRefreshCw className="bookroom-manager-loading-icon bookroom-spinning" />
                          <span>Loading managers from JSON...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedRoom && (
                  <div className="bookroom-selected-room-info">
                    <h4 className="bookroom-selected-room-title">Selected Room:</h4>
                    <div className="bookroom-selected-room-details">
                      <FiMapPin className="bookroom-room-icon" />
                      <span>{rooms.find(r => r.id === selectedRoom)?.name}</span>
                    </div>
                  </div>
                )}

                <div className="bookroom-form-actions">
                  <button
                    type="submit"
                    className="bookroom-submit-btn"
                    disabled={!selectedRoom || loading || (user.role === 'employee' && managersLoading)}
                  >
                    <FiPlus className="bookroom-btn-icon" />
                    {loading ? 'Processing...' : (user.role === 'employee' ? 'Submit for Approval' : 'Book Room')}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoom('');
                      setSelectedDate('');
                      setSelectedTime('');
                      setDuration('');
                      setAttendees('');
                      setPurpose('');
                      setManager('');
                      setSelectedManagerName('');
                      setSelectedManagerInfo(null);
                      setManagerSearchTerm('');
                    }}
                    className="bookroom-reset-btn"
                  >
                    Reset Form
                  </button>
                </div>

                {user.role === 'employee' && (
                  <div className="bookroom-approval-notice">
                    <FiAlertCircle className="bookroom-notice-icon" />
                    <p className="bookroom-notice-text">
                      Your booking will be sent to the selected manager for approval. 
                      You'll be notified once it's reviewed.
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRoom;