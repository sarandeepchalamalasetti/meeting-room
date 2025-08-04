import React, { useState, useEffect } from 'react'
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth
} from 'date-fns'
import './CalenderandTime.css'

const CalenderandTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month'

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const renderDays = () => {
    const days = [];

    if (viewMode === 'day') {
      days.push(
        <div className="calendar-day today" key="today">
          {format(currentDate, 'EEEE, MMM d')}
        </div>
      );
    }

    else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });

      for (let day = start; day <= end; day = addDays(day, 1)) {
        days.push(
          <div
            className={`calendar-day ${
              isSameDay(day, new Date()) ? 'today' : ''
            }`}
            key={day}
          >
            {format(day, 'd')}
          </div>
        );
      }
    }

    else if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });

      for (let day = start; day <= end; day = addDays(day, 1)) {
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, currentDate);
        days.push(
          <div
            className={`calendar-day ${isToday ? 'today' : ''} ${
              !isCurrentMonth ? 'other-month' : ''
            }`}
            key={day}
          >
            {format(day, 'd')}
          </div>
        );
      }
    }

    return days;
  };

  const goPrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
  };

  const goNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">
          <svg className="chart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          Calendar & Time
        </h3>
        <div className="current-time">
          <svg className="time-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="time-display">{format(currentTime, 'hh:mm:ss a')}</span>
        </div>
      </div>
      <div className="chart-content">
        <div className="calendar-container">
          {/* View Modes */}
          <div className="view-modes">
            {['day', 'week', 'month'].map((mode) => (
              <button
                key={mode}
                className={`view-button ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Calendar Header */}
          <div className="calendar-header">
            <button className="calendar-nav-button" onClick={goPrev}>
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h4 className="calendar-month">
              {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
            </h4>
            <button className="calendar-nav-button" onClick={goNext}>
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>

          {/* Calendar Days Header */}
          {(viewMode === 'week' || viewMode === 'month') && (
            <div className="calendar-days-header">
              <div className="calendar-day-header">Sun</div>
              <div className="calendar-day-header">Mon</div>
              <div className="calendar-day-header">Tue</div>
              <div className="calendar-day-header">Wed</div>
              <div className="calendar-day-header">Thu</div>
              <div className="calendar-day-header">Fri</div>
              <div className="calendar-day-header">Sat</div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="calendar-grid">
            {renderDays()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalenderandTime
