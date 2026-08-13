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
    gap: '0.875rem',
    padding: '0.875rem 1.125rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    color: isActive ? '#ffffff' : '#94a3b8',
    background: isActive ? 'linear-gradient(135deg, rgba(255, 42, 133, 0.25) 0%, rgba(0, 240, 255, 0.15) 100%)' : 'transparent',
    border: isActive ? '1px solid rgba(255, 42, 133, 0.4)' : '1px solid transparent',
    boxShadow: isActive ? '0 0 15px rgba(255, 42, 133, 0.25)' : 'none',
    textDecoration: 'none',
    marginBottom: '0.375rem',
    transition: 'all 0.25s ease'
  });

  return (
    <aside style={{
      width: '250px',
      backgroundColor: 'rgba(10, 12, 24, 0.95)',
      borderRight: '1px solid rgba(255, 42, 133, 0.2)',
      padding: '1.75rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem'
    }}>
      <div style={{
        fontSize: '0.75rem',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        color: '#00f0ff',
        padding: '0 0.75rem 0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        Cyber Protocol
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
          <div style={{
            fontSize: '0.75rem',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            color: '#ff2a85',
            padding: '1.25rem 0.75rem 0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
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
