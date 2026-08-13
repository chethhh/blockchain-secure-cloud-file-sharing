import React, { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import FileCard from '../components/FileCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Share2 } from 'lucide-react';

const SharedFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchSharedFiles();
  }, []);

  const fetchSharedFiles = async () => {
    setLoading(true);
    try {
      const res = await fileAPI.getSharedFiles();
      setFiles(res.data.files || []);
    } catch (err) {
      console.error('[SharedFiles Error]', err);
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
      alert(`Access Denied: ${err.response?.data?.message || err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Checking blockchain shared permissions..." />;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>Files Shared With Me</h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Files where your wallet address was granted permission on the Ethereum smart contract
        </p>
      </div>

      {files.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <Share2 size={48} style={{ marginBottom: '1rem', color: '#cbd5e1' }} />
          <h3>No Shared Files Found</h3>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            No one has granted your Ethereum wallet address access to any files yet.
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
              onShare={() => {}}
              onDelete={() => {}}
              isDownloading={downloadingId === file._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedFiles;
