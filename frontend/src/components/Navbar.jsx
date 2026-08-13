import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { WalletContext } from '../context/WalletContext';
import { Shield, Wallet, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { account, connectWallet, isConnecting } = useContext(WalletContext);

  const formatWallet = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header style={{
      height: '74px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '2px solid #ffe5ec',
      boxShadow: '0 4px 20px rgba(255, 117, 151, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff7597, #ff4d6d)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(255, 117, 151, 0.3)',
          fontSize: '1.5rem'
        }}>
          🐱
        </div>
        <span style={{
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 700,
          fontSize: '1.35rem',
          color: '#22223b'
        }}>
          MEOW<span style={{ color: '#ff4d6d' }}>·IPFS 🐾</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* MetaMask Wallet Connection Button */}
        {account ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.5rem 1.125rem',
            backgroundColor: '#e8fccf',
            border: '2px solid #b7efc5',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            color: '#2b9348',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(43, 147, 72, 0.15)'
          }}>
            <Wallet size={16} />
            <span>🐾 {formatWallet(account)}</span>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="btn btn-secondary btn-sm"
          >
            <Wallet size={16} />
            <span>{isConnecting ? 'Connecting...' : 'Connect Wallet 🐾'}</span>
          </button>
        )}

        {/* User Info Badge */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '2px solid #ffe5ec', paddingLeft: '1.25rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#22223b' }}>😸 {user.name}</div>
              <span className={`badge ${user.role === 'Admin' ? 'badge-danger' : user.role === 'Editor' ? 'badge-primary' : 'badge-warning'}`}>
                {user.role}
              </span>
            </div>
            <button onClick={logout} className="btn btn-secondary btn-sm" title="Log out" style={{ padding: '0.5rem' }}>
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
