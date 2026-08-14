import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { WalletContext } from '../context/WalletContext';
import { fileAPI, activityAPI } from '../services/api';
import FileCard from '../components/FileCard';
import ShareModal from '../components/ShareModal';
import LoadingSpinner from '../components/LoadingSpinner';
import DemoOne from '../components/ui/demo';
import { Files, HardDrive, Share2, Activity, Wallet, UploadCloud, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { account, connectWallet } = useContext(WalletContext);
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  // Share Modal State
  const [shareFile, setShareFile] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [filesRes, sharedRes, activityRes] = await Promise.all([
        fileAPI.getFiles(),
        fileAPI.getSharedFiles(),
        activityAPI.getActivityLogs()
      ]);

      setFiles(filesRes.data.files || []);
      setSharedFiles(sharedRes.data.files || []);
      setActivities(activityRes.data.logs || []);
    } catch (err) {
      console.error('[Dashboard Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file) => {
    setDownloadingId(file._id);
    try {
      const response = await fileAPI.downloadFile(file._id);
      
      // Create browser download blob link
      const blob = new Blob([response.data], { type: file.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to download and decrypt file';
      alert(`[Decryption / Access Error] ${msg}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShareSubmit = async ({ fileId, walletAddress, userEmail }) => {
    setIsSharing(true);
    setShareStatus(null);
    try {
      const res = await fileAPI.shareFile(fileId, { walletAddress, userEmail });
      alert(`Success: ${res.data.message}`);
      setShareFile(null);
      fetchDashboardData();
    } catch (err) {
      alert(`Share Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file from the system?')) return;
    try {
      await fileAPI.deleteFile(fileId);
      fetchDashboardData();
    } catch (err) {
      alert(`Delete Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching dashboard analytics..." />;

  const myFilesCount = files.filter(f => f.owner?._id === user?.id || f.owner === user?.id).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>Dashboard Overview</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Welcome back, {user?.name}! Role: <strong style={{ color: '#2563eb' }}>{user?.role}</strong>
          </p>
        </div>

        {['Admin', 'Editor'].includes(user?.role) && (
          <button onClick={() => navigate('/upload')} className="btn btn-primary">
            <UploadCloud size={18} />
            <span>Upload New Encrypted File</span>
          </button>
        )}
      </div>

      {/* Wallet Connection Warning Banner */}
      {!account && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: '0.5rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          color: '#b45309'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={24} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>MetaMask Wallet Not Connected</div>
              <div style={{ fontSize: '0.8125rem' }}>
                To send smart contract transactions and verify blockchain permissions, please connect your wallet.
              </div>
            </div>
          </div>
          <button onClick={connectWallet} className="btn btn-secondary btn-sm" style={{ borderColor: '#fde68a' }}>
            <Wallet size={16} />
            <span>Connect Wallet</span>
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-icon"><Files size={24} /></div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{files.length}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Accessible Files</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <HardDrive size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{myFilesCount}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>My Uploads</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Share2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{sharedFiles.length}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Shared With Me</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f1f5f9', color: '#475569' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activities.length}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Audit Log Actions</div>
          </div>
        </div>
      </div>

      {/* Featured Media Showcase (3D Coverflow Carousel) */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ marginBottom: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>✨ Featured Cloud Media Showcase 🐾</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Drag or use arrow keys to rotate through 3D Coverflow slides</p>
          </div>
        </div>
        <DemoOne />
      </div>

      {/* Recent Files Grid */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent Files</h3>
          <button onClick={() => navigate('/my-files')} className="btn btn-secondary btn-sm">View All</button>
        </div>

        {files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            No encrypted files found in the system yet.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            {files.slice(0, 6).map((file) => (
              <FileCard
                key={file._id}
                file={file}
                onDownload={handleDownload}
                onShare={(f) => setShareFile(f)}
                onDelete={handleDelete}
                isDownloading={downloadingId === file._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* On-Chain Share Modal */}
      <ShareModal
        file={shareFile}
        isOpen={!!shareFile}
        onClose={() => setShareFile(null)}
        onShareSubmit={handleShareSubmit}
        isSubmitting={isSharing}
      />
    </div>
  );
};

export default Dashboard;
