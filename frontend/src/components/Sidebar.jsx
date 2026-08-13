import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderLock,
  Share2,
  UploadCloud,
  Activity,
  User,
  ShieldCheck
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: isActive ? '#2563eb' : '#64748b',
    backgroundColor: isActive ? '#eff6ff' : 'transparent',
    textDecoration: 'none',
    marginBottom: '0.25rem'
  });

  return (
    <aside style={{
      width: '240px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem'
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', padding: '0 0.5rem 0.5rem', textTransform: 'uppercase' }}>
        Main Navigation
      </div>

      <NavLink to="/dashboard" style={linkStyle}>
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </NavLink>

      <NavLink to="/my-files" style={linkStyle}>
        <FolderLock size={18} />
        <span>My Files</span>
      </NavLink>

      <NavLink to="/shared-files" style={linkStyle}>
        <Share2 size={18} />
        <span>Shared Files</span>
      </NavLink>

      {user && ['Admin', 'Editor'].includes(user.role) && (
        <NavLink to="/upload" style={linkStyle}>
          <UploadCloud size={18} />
          <span>Upload File</span>
        </NavLink>
      )}

      <NavLink to="/activity" style={linkStyle}>
        <Activity size={18} />
        <span>Activity Logs</span>
      </NavLink>

      <NavLink to="/profile" style={linkStyle}>
        <User size={18} />
        <span>Profile</span>
      </NavLink>

      {user && user.role === 'Admin' && (
        <>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', padding: '1rem 0.5rem 0.5rem', textTransform: 'uppercase' }}>
            Admin Control
          </div>
          <NavLink to="/admin" style={linkStyle}>
            <ShieldCheck size={18} />
            <span>Admin Panel</span>
          </NavLink>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
