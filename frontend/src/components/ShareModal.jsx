import React, { useState } from 'react';
import { X, Share2, Wallet, Mail } from 'lucide-react';

const ShareModal = ({ file, isOpen, onClose, onShareSubmit, isSubmitting }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [userEmail, setUserEmail] = useState('');

  if (!isOpen || !file) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!walletAddress && !userEmail) {
      alert('Please enter either a Target Wallet Address or Target User Email');
      return;
    }
    onShareSubmit({ fileId: file._id, walletAddress, userEmail });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Share2 size={20} color="#2563eb" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Grant On-Chain Access</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{
          backgroundColor: '#eff6ff',
          padding: '0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.8125rem',
          color: '#1e40af',
          marginBottom: '1rem'
        }}>
          Sharing file: <strong>{file.originalName}</strong> (Blockchain ID: #{file.blockchainFileId})
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Target Ethereum Wallet Address (0x...)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="0x1234...5678"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', margin: '0.5rem 0' }}>— OR —</div>

          <div className="form-group">
            <label>Target User Registered Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Granting Access...' : 'Grant Access on Blockchain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareModal;
