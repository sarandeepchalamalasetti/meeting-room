import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import './Layout.css'; // Styling is handled here

const Layout = () => {
  return (
    <div className="layout-wrapper">
  <Sidebar />
  <div className="layout-main-area">
    <Header />
    <main className="layout-main">
      <Outlet />
    </main>
  </div>
</div>

  );
};

export default Layout;
