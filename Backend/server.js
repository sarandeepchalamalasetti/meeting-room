const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const roomRoutes = require('./routes/roomRoutes');
const historyRoutes = require('./routes/historyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api', authRoutes);
app.use('/api/auth', authRoutes);        // Auth routes like /api/auth/login
app.use('/api/bookings', bookingRoutes); // ✅ ENHANCED: Booking routes with filter support
app.use('/api/rooms', roomRoutes);       // ✅ ENHANCED: Room routes with filter support
app.use('/api/history', historyRoutes);  // History routes like /api/history
app.use('/api/notifications', notificationRoutes); // Notification routes

// Health check
app.get('/', (req, res) => {
  res.send("Backend is running!");
});

// ✅ ENHANCED: Updated health check endpoint with filtering system
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Meeting Room Booking API with Enhanced Filtering System',
    timestamp: new Date().toISOString(),
    version: '31.0.0',
    endpoints: {
      rooms: '/api/rooms',
      roomStats: '/api/rooms/statistics',
      roomHeatmap: '/api/rooms/heatmap',
      roomUtilization: '/api/rooms/utilization',
      bookings: '/api/bookings',
      bookingStatistics: '/api/bookings/statistics',
      upcomingBookings: '/api/bookings/upcoming',
      userStats: '/api/bookings/my-stats',
      notifications: '/api/notifications'
    },
    features: {
      dashboardFiltering: {
        periodFilter: 'Today, This Week, This Month, 3 Months, 6 Months, 1 Year',
        dateFilter: 'Custom date selection with calendar picker',
        mutualExclusive: 'Only one filter active at a time',
        midnightReset: 'Automatic reset to zero at 00:00 for current day views',
        liveData: 'Real-time data from backend with no mock data'
      },
      componentSupport: [
        'Status - Role-based statistics with filter support',
        'RoomUtilization - User priority sorting with filter support', 
        'UpcomingBookings - Enhanced status system with filter support',
        'BookingSummary - Heatmap and statistics with filter support',
        'ChartSwitcher - Bar and pie charts with filter support',
        'BarChart - Weekly trends with filter labels',
        'DoughnutChart - Overview stats with filter labels'
      ],
      backendEnhancements: {
        bookingController: 'Enhanced with date range filtering for all endpoints',
        roomController: 'Enhanced with date range filtering for statistics and utilization',
        dateFiltering: 'Supports both single date and date range queries',
        queryOptimization: 'Efficient MongoDB queries with proper indexing'
      }
    },
    filteringLogic: {
      periodFilter: {
        today: 'Shows data for current date only',
        thisWeek: 'Shows data for current week (Sunday to Saturday)', 
        thisMonth: 'Shows data for current month',
        longTerm: '3 months, 6 months, 1 year ranges supported'
      },
      dateFilter: {
        customDate: 'Shows data for selected specific date',
        clearable: 'Can clear date to return to period filter',
        validation: 'Prevents selection of past dates for bookings'
      },
      midnightBehavior: {
        automatic: 'Components auto-reset at midnight for current day views',
        preservation: 'Historical data preserved when using filters',
        realTime: 'Live updates every 30-60 seconds'
      }
    },
    statusCardLogic: {
      manager: {
        totalBookings: 'Rooms booked by this manager (filtered by date range)',
        available: 'Total active rooms available for booking',
        approved: 'Requests this manager has approved (filtered)',
        pending: 'Requests waiting for this manager approval (filtered)',
        rejected: 'Requests this manager has rejected (filtered)'
      },
      hr: {
        totalBookings: 'Rooms booked by this HR user (filtered)',
        available: 'Total active rooms available for booking',
        cancelled: 'Bookings this HR user has cancelled (filtered)'
      },
      employee: {
        totalRequests: 'All booking requests made by employee (filtered)',
        available: 'Total active rooms available for booking',
        approved: 'Employee requests that were approved (filtered)',
        pending: 'Employee requests waiting for approval (filtered)',
        rejected: 'Employee requests that were rejected (filtered)'
      }
    },
    enhancedFeatures: {
      roomUtilization: 'Fixed unique users calculation with filter support',
      upcomingBookings: 'Enhanced status system with real-time updates and filtering',
      bookingStatistics: 'Role-based booking statistics with date range filtering',
      uniqueUsersCounting: 'Fixed: One user = 1 in denominator',
      sorting: 'User priority first, then percentage high-to-low',
      display: 'Top 5 visible, remaining scrollable'
    },
    technicalImplementation: {
      frontend: 'React JSX with CSS styling (no TypeScript or Tailwind)',
      backend: 'Node.js with Express and MongoDB',
      authentication: 'JWT-based with role management',
      realTimeUpdates: 'Polling-based refresh system',
      errorHandling: 'Graceful fallbacks for all components',
      responsive: 'Mobile-friendly design with breakpoints',
      filtering: 'Comprehensive date range filtering across all endpoints'
    },
    bugFixes: {
      v31: 'Added comprehensive filtering system with midnight reset functionality',
      v30: 'Added real-time statistics API with role-based data filtering',
      v29: 'Enhanced status calculation with real-time progress tracking',
      v27: 'Fixed unique users calculation - one user now shows as 1 in denominator instead of 2'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 V31: Server started on port ${PORT} with Enhanced Filtering System`);
  console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🏢 Room Statistics: http://localhost:${PORT}/api/rooms/statistics`);
  console.log(`📊 Room Utilization: http://localhost:${PORT}/api/rooms/utilization`);
  console.log(`📅 Booking Statistics: http://localhost:${PORT}/api/bookings/statistics`);
  console.log(`🔄 Upcoming Bookings: http://localhost:${PORT}/api/bookings/upcoming`);
  console.log(`📈 User Stats: http://localhost:${PORT}/api/bookings/my-stats`);
  console.log(`✅ V31 NEW FEATURES:`);
  console.log(`   🎯 Dashboard Filtering: Period + Date filters with mutual exclusion`);
  console.log(`   🕛 Midnight Reset: Auto-reset to zero at 00:00 for current day views`);
  console.log(`   📱 Live Data: Real-time updates with no mock data`);
  console.log(`   🔧 Backend Support: All endpoints enhanced with filter parameters`);
  console.log(`   📊 Filter Types: today, this_week, this_month, 3_months, 6_months, 1_year, custom_date`);
  console.log(`   🎛️ Mutual Exclusion: Only one filter active at a time (period OR date)`);
  console.log(`   🔄 Auto Refresh: Components refresh every 30-60 seconds`);
  console.log(`   📋 Role Support: Manager, HR, Employee with different data views`);
});