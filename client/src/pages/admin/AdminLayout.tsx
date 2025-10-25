import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/tournaments', label: 'Tournaments', icon: '🏆' },
    { path: '/admin/competitors', label: 'Competitors', icon: '👥' },
    { path: '/admin/judges', label: 'Judges', icon: '⚖️' },
    { path: '/admin/stations', label: 'Stations', icon: '🏪' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-content">
          <Link to="/" className="admin-logo">
            <span className="logo-icon">🏗️</span>
            <span className="logo-text">Tournament Admin</span>
          </Link>
          <div className="admin-user">
            <span className="user-role">Admin</span>
            <div className="user-avatar">A</div>
          </div>
        </div>
      </header>

      <div className="admin-main">
        <nav className="admin-sidebar">
          <div className="sidebar-header">
            <h3>Admin Panel</h3>
            <p>Tournament Management</p>
          </div>
          
          <ul className="sidebar-nav">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
