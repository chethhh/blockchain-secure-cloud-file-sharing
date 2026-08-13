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
      height: '70px',
      backgroundColor: 'rgba(12, 14, 28, 0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 42, 133, 0.25)',
      boxShadow: '0 4px 25px rgba(0, 0, 0, 0.5)',
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
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #ff2a85, #00f0ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(255, 42, 133, 0.5)'
        }}>
          <Shield size={24} color="#ffffff" />
        </div>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 800,
          fontSize: '1.25rem',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #ffffff 0%, #00f0ff 50%, #ff2a85 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          AURA<span style={{ color: '#00f0ff', WebkitTextFillColor: '#00f0ff' }}>·IPFS</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* MetaMask Wallet Connection Button */}
        {account ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(0, 255, 170, 0.1)',
            border: '1px solid rgba(0, 255, 170, 0.4)',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            color: '#00ffaa',
            fontWeight: 700,
            boxShadow: '0 0 12px rgba(0, 255, 170, 0.2)'
          }}>
            <Wallet size={16} />
            <span>{formatWallet(account)}</span>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="btn btn-secondary btn-sm"
          >
            <Wallet size={16} />
            <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          </button>
        )}

        {/* User Info Badge */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '1.25rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff' }}>{user.name}</div>
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
