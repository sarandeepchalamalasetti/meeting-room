import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Plus,
  CheckSquare,
  Settings,
  Clock,
  MapPin,
  Calendar,
  Info
} from 'lucide-react';
import leftArrow from '../asserts/left.svg';
import rightArrow from '../asserts/right.svg';
import './Sidebar.css';

const Sidebar = () => {
  const role = sessionStorage.getItem('role');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <span className="ispace-logo-wrapper-sidebar">
        {!isCollapsed && (
          <>
            <span className="i-letter">i</span>
            <span className="space-text-black">Space</span>
          </>
        )}
        <img
          className="ispace-logo-img"
          src="data:image/png;base64,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"
          alt="iSpace Logo"
        />
      </span>

      <nav className="nav-menu">
        <NavLink to="/dashboard" className="nav-item">
          <span className="nav-icon">
            <LayoutDashboard size={18} />
          </span>
          {!isCollapsed && "Dashboard"}
        </NavLink>

        <NavLink to="/bookroom" className="nav-item">
          <span className="nav-icon">
            <Plus size={18} />
          </span>
          {!isCollapsed && "Book Room"}
        </NavLink>

        <NavLink to="/calendar" className="nav-item">
          <span className="nav-icon">
            <Calendar size={18} />
          </span>
          {!isCollapsed && "Calendar"}
        </NavLink>

        {/* Role-based conditional rendering */}
        {role === 'manager' && (
          <NavLink to="/approval" className="nav-item">
            <span className="nav-icon">
              <CheckSquare size={18} />
            </span>
            {!isCollapsed && "Approvals"}
          </NavLink>
        )}

        {role === 'employee' && (
          <NavLink to="/booking-status" className="nav-item">
            <span className="nav-icon">
              <Info size={18} />
            </span>
            {!isCollapsed && "Booking Status"}
          </NavLink>
        )}

        {/* HR will not see anything in this spot */}

        <NavLink to="/managebookings" className="nav-item">
          <span className="nav-icon">
            <Settings size={18} />
          </span>
          {!isCollapsed && "Manage Bookings"}
        </NavLink>

        <NavLink to="/history" className="nav-item">
          <span className="nav-icon">
            <Clock size={18} />
          </span>
          {!isCollapsed && "History"}
        </NavLink>

        <NavLink to="/roommap" className="nav-item">
          <span className="nav-icon">
            <MapPin size={18} />
          </span>
          {!isCollapsed && "Room Map"}
        </NavLink>
      </nav>

      <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
        <img
          src={isCollapsed ? rightArrow : leftArrow}
          alt={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="toggle-icon"
        />
      </button>
    </div>
  );
};

export default Sidebar;
