import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { WalletContext } from '../context/WalletContext';
import { User, Wallet, Mail, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const { account, connectWallet, isConnecting, walletError } = useContext(WalletContext);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>User Profile</h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Account settings and linked Ethereum wallet verification
        </p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 700
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{user?.name}</h2>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{user?.email}</div>
            <span className={`badge ${user?.role === 'Admin' ? 'badge-danger' : user?.role === 'Editor' ? 'badge-primary' : 'badge-warning'}`} style={{ marginTop: '0.375rem' }}>
              {user?.role} Role
            </span>
          </div>
        </div>

        {/* Profile Details List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={20} color="#64748b" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Email Verification Status</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MFA One-Time Password Verification</div>
              </div>
            </div>
            {user?.isEmailVerified ? (
              <span className="badge badge-success" style={{ gap: '0.25rem' }}>
                <CheckCircle2 size={14} /> Verified
              </span>
            ) : (
              <span className="badge badge-warning">Unverified</span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Wallet size={20} color="#64748b" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Connected Ethereum Wallet</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MetaMask EIP-191 Verified Wallet Address</div>
              </div>
            </div>
            {account ? (
              <code style={{ fontSize: '0.8125rem', padding: '0.25rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                {account}
              </code>
            ) : (
              <button onClick={connectWallet} disabled={isConnecting} className="btn btn-primary btn-sm">
                Connect MetaMask
              </button>
            )}
          </div>
        </div>

        {walletError && (
          <div className="alert alert-danger" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{walletError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
