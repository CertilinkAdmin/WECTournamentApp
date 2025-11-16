import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <AppHeader />

      <main className="admin-content-full">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
