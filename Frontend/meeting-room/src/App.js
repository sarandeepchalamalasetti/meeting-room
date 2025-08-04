import '@fortawesome/fontawesome-free/css/all.min.css';
import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from 'react-router-dom';

import Login from './Login/Login.jsx';
import Register from './Register/Register.jsx';
import Dashboard from './Dashboard/Dashboard.jsx';
import BookRoom from './BookRoom/BookRoom.jsx';
import Approval from './Approval/Approval.jsx';
import ManageBookings from './ManageBooking/ManageBookings.jsx';
import History from './History/History.jsx';
import RoomMap from './RoomMap/RoomMap.jsx';
import FullCalendar from './FullCalendar/Calendar/Calendar.jsx';
import BookingStatus from './BookingStatus/BookingStatus.jsx';

import './App.css';
import PrivateRoute from './PrivateRoute';
import Layout from './Layout/Layout';
import RoleProtectedRoute from './RoleProtectedRoute';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AppWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!sessionStorage.getItem('token'));
  const [currentView, setCurrentView] = useState(
    location.pathname === '/register' ? 'register' : 'login'
  );

  const toggleToLogin = () => {
    setCurrentView('login');
    navigate('/login');
  };

  const toggleToRegister = () => {
    setCurrentView('register');
    navigate('/register');
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate('/dashboard');
  };

  return (
    <div className="app-container">
      {(location.pathname === '/login' || location.pathname === '/register') && (
        <div
          className="toggle-buttons"
          style={{ position: 'absolute', top: '20px', right: '30px', zIndex: 1000 }}
        >
          <button
            className={`toggle-btn ${currentView === 'login' ? 'active' : ''}`}
            onClick={toggleToLogin}
          >
            <i className="fas fa-sign-in-alt"></i>
            <span>Login</span>
          </button>
          <button
            className={`toggle-btn ${currentView === 'register' ? 'active' : ''}`}
            onClick={toggleToRegister}
          >
            <i className="fas fa-user-plus"></i>
            <span>Register</span>
          </button>
        </div>
      )}

      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={<Login onToggleToRegister={toggleToRegister} onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/register"
          element={<Register onToggleToLogin={toggleToLogin} />}
        />

        {/* Private Routes with Layout */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="calendar" element={<FullCalendar />} />
          <Route path="bookroom" element={<BookRoom />} />
          <Route path="managebookings" element={<ManageBookings />} />
          <Route path="history" element={<History />} />
          <Route path="roommap" element={<RoomMap />} />

          {/* Role Protected Routes */}
          <Route
            path="approval"
            element={
              <RoleProtectedRoute allowedRoles={['manager']}>
                <Approval />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="booking-status"
            element={
              <RoleProtectedRoute allowedRoles={['employee']}>
                <BookingStatus />
              </RoleProtectedRoute>
            }
          />
        </Route>

        {/* Fallback for any unknown path */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
};

export default App;