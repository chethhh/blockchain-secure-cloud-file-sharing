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
      height: '64px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Shield size={28} color="#2563eb" />
        <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#0f172a' }}>
          SecureCloud <span style={{ color: '#2563eb' }}>IPFS</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* MetaMask Wallet Connection Button */}
        {account ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.75rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#16a34a',
            fontWeight: 500
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
            <span>{isConnecting ? 'Connecting...' : 'Connect MetaMask'}</span>
          </button>
        )}

        {/* User Info Badge */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{user.name}</div>
              <span className={`badge ${user.role === 'Admin' ? 'badge-danger' : user.role === 'Editor' ? 'badge-primary' : 'badge-warning'}`}>
                {user.role}
              </span>
            </div>
            <button onClick={logout} className="btn btn-secondary btn-sm" title="Log out">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
