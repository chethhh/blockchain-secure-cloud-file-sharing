import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FileText, Download, Share2, Trash2, ExternalLink, ShieldCheck } from 'lucide-react';

const FileCard = ({ file, onDownload, onShare, onDelete, isDownloading }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const isOwner = file.owner?._id === user?.id || file.owner === user?.id;
  const isAdmin = user?.role === 'Admin';
  const canManage = isOwner || isAdmin;

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const truncateCid = (cid) => {
    if (!cid) return '';
    return `${cid.substring(0, 8)}...${cid.substring(cid.length - 6)}`;
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          background: 'rgba(0, 240, 255, 0.12)',
          color: '#00f0ff',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <FileText size={24} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontSize: '1rem',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#ffffff'
          }} title={file.originalName}>
            {file.originalName}
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div style={{
        backgroundColor: 'rgba(10, 12, 24, 0.75)',
        borderRadius: '0.5rem',
        padding: '0.75rem 0.875rem',
        fontSize: '0.75rem',
        color: '#cbd5e1',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
        marginBottom: '1.25rem',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>IPFS CID:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#00f0ff' }}>{truncateCid(file.ipfsCid)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Blockchain ID:</span>
          <span style={{ fontWeight: 700, color: '#ff2a85' }}>#{file.blockchainFileId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Owner:</span>
          <span style={{ fontWeight: 600 }}>{file.owner?.name || 'Unknown'}</span>
        </div>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate(`/files/${file._id}`)}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
        >
          <ExternalLink size={14} />
          Details
        </button>

        <button
          onClick={() => onDownload(file)}
          disabled={isDownloading}
          className="btn btn-primary btn-sm"
          style={{ flex: 1 }}
        >
          <Download size={14} />
          Decrypt & Download
        </button>

        {canManage && (
          <>
            <button
              onClick={() => onShare(file)}
              className="btn btn-secondary btn-sm"
              title="Share file permissions on-chain"
            >
              <Share2 size={14} />
            </button>

            <button
              onClick={() => onDelete(file._id)}
              className="btn btn-danger btn-sm"
              title="Delete file"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FileCard;
