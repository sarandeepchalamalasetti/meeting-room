import React from 'react'
import './RecentActivity.css'
const RecentActivity = () => {
  return (
     <div className="content-card">
          <div className="content-header">
            <h3 className="content-title">
              <svg className="content-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Recent Activity
            </h3>
          </div>
          <div className="content-body">
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon-container">
                  <svg className="status-icon status-icon-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="activity-details">
                  <p className="activity-action">Booking approved</p>
                  <div className="activity-meta">
                    <span className="activity-room">Conference A</span>
                    <span className="activity-time">5 min ago</span>
                  </div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon-container">
                  <svg className="status-icon status-icon-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="activity-details">
                  <p className="activity-action">New booking request</p>
                  <div className="activity-meta">
                    <span className="activity-room">Meeting B</span>
                    <span className="activity-time">12 min ago</span>
                  </div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon-container">
                  <svg className="status-icon status-icon-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="activity-details">
                  <p className="activity-action">Booking cancelled</p>
                  <div className="activity-meta">
                    <span className="activity-room">Training C</span>
                    <span className="activity-time">25 min ago</span>
                  </div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon-container">
                  <svg className="status-icon status-icon-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="activity-details">
                  <p className="activity-action">Booking completed</p>
                  <div className="activity-meta">
                    <span className="activity-room">Board Room</span>
                    <span className="activity-time">1 hour ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  )
}

export default RecentActivity