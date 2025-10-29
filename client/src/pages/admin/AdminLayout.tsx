import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-content">
          <Link to="/" className="admin-logo">
            <span className="logo-icon">🏗️</span>
            <span className="logo-text">Tournament Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="admin-user">
              <span className="user-role">Admin</span>
              <div className="user-avatar">A</div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="admin-content-full">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
