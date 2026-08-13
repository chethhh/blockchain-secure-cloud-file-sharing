import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fileAPI } from '../services/api';
import FileCard from '../components/FileCard';
import ShareModal from '../components/ShareModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { FolderLock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyFiles = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    fetchMyFiles();
  }, []);

  const fetchMyFiles = async () => {
    setLoading(true);
    try {
      const res = await fileAPI.getFiles();
      const allFiles = res.data.files || [];
      // Filter owned files if user is non-Admin
      const owned = user?.role === 'Admin'
        ? allFiles
        : allFiles.filter(f => f.owner?._id === user?.id || f.owner === user?.id);
      setFiles(owned);
    } catch (err) {
      console.error('[MyFiles Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file) => {
    setDownloadingId(file._id);
    try {
      const response = await fileAPI.downloadFile(file._id);
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
      alert(`Download Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShareSubmit = async ({ fileId, walletAddress, userEmail }) => {
    setIsSharing(true);
    try {
      const res = await fileAPI.shareFile(fileId, { walletAddress, userEmail });
      alert(`Access Granted: ${res.data.message}`);
      setShareFile(null);
      fetchMyFiles();
    } catch (err) {
      alert(`Share Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Delete this encrypted file record?')) return;
    try {
      await fileAPI.deleteFile(fileId);
      fetchMyFiles();
    } catch (err) {
      alert(`Delete Error: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your files..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>My Encrypted Files</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Files encrypted with AES-256-GCM and stored on IPFS & Ethereum
          </p>
        </div>

        {['Admin', 'Editor'].includes(user?.role) && (
          <button onClick={() => navigate('/upload')} className="btn btn-primary">
            <Plus size={18} />
            <span>Upload File</span>
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <FolderLock size={48} style={{ marginBottom: '1rem', color: '#cbd5e1' }} />
          <h3>No Files Uploaded Yet</h3>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            You haven't uploaded any files to IPFS yet. Click 'Upload File' to get started.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}>
          {files.map((file) => (
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

export default MyFiles;
