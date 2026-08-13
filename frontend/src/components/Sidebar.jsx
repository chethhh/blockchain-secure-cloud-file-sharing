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
    padding: '0.875rem 1.25rem',
    borderRadius: '9999px',
    fontSize: '0.9375rem',
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 700,
    color: isActive ? '#ff4d6d' : '#4a4e69',
    background: isActive ? '#fff0f5' : 'transparent',
    border: isActive ? '2px solid #ffccd5' : '2px solid transparent',
    boxShadow: isActive ? '0 4px 15px rgba(255, 117, 151, 0.15)' : 'none',
    textDecoration: 'none',
    marginBottom: '0.375rem',
    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
  });

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#ffffff',
      borderRight: '2px solid #ffe5ec',
      padding: '2rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem'
    }}>
      <div style={{
        fontSize: '0.75rem',
        fontFamily: "'Fredoka', sans-serif",
        fontWeight: 700,
        color: '#ff7597',
        padding: '0 0.875rem 0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }}>
        🐾 Cat Navigation
      </div>

      <NavLink to="/dashboard" style={linkStyle}>
        <LayoutDashboard size={18} />
        <span>Dashboard 🐱</span>
      </NavLink>

      <NavLink to="/my-files" style={linkStyle}>
        <FolderLock size={18} />
        <span>My Cat Files</span>
      </NavLink>

      <NavLink to="/shared-files" style={linkStyle}>
        <Share2 size={18} />
        <span>Shared Paws</span>
      </NavLink>

      {user && ['Admin', 'Editor'].includes(user.role) && (
        <NavLink to="/upload" style={linkStyle}>
          <UploadCloud size={18} />
          <span>Upload File 🐾</span>
        </NavLink>
      )}

      <NavLink to="/activity" style={linkStyle}>
        <Activity size={18} />
        <span>Meow Logs</span>
      </NavLink>

      <NavLink to="/profile" style={linkStyle}>
        <User size={18} />
        <span>Cat Profile</span>
      </NavLink>

      {user && user.role === 'Admin' && (
        <>
          <div style={{
            fontSize: '0.75rem',
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 700,
            color: '#c9184a',
            padding: '1.25rem 0.875rem 0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            👑 Admin Controls
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
