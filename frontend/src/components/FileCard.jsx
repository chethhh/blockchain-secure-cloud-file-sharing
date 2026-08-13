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
          width: '42px',
          height: '42px',
          borderRadius: '8px',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <FileText size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#0f172a'
          }} title={file.originalName}>
            {file.originalName}
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '0.375rem',
        padding: '0.625rem 0.75rem',
        fontSize: '0.75rem',
        color: '#475569',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>IPFS CID:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{truncateCid(file.ipfsCid)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Blockchain ID:</span>
          <span style={{ fontWeight: 600, color: '#2563eb' }}>#{file.blockchainFileId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Owner:</span>
          <span>{file.owner?.name || 'Unknown'}</span>
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
