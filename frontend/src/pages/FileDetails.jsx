import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fileAPI } from '../services/api';
import ShareModal from '../components/ShareModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { FileText, Download, Share2, Trash2, ArrowLeft, ShieldCheck, User, UserX, Clock, ExternalLink } from 'lucide-react';

const FileDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [file, setFile] = useState(null);
  const [accessList, setAccessList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    fetchFileDetails();
  }, [id]);

  const fetchFileDetails = async () => {
    setLoading(true);
    try {
      const res = await fileAPI.getFileById(id);
      setFile(res.data.file);
      setAccessList(res.data.accessList || []);
    } catch (err) {
      console.error('[FileDetails Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fileAPI.downloadFile(id);
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
      alert(`Download/Decryption Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleShareSubmit = async ({ fileId, walletAddress, userEmail }) => {
    setIsSharing(true);
    try {
      const res = await fileAPI.shareFile(fileId, { walletAddress, userEmail });
      alert(`On-Chain Access Granted! TxHash: ${res.data.transactionHash}`);
      setIsShareModalOpen(false);
      fetchFileDetails();
    } catch (err) {
      alert(`Share Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevoke = async (walletAddress) => {
    if (!window.confirm(`Revoke smart contract access for wallet address ${walletAddress}?`)) return;
    try {
      const res = await fileAPI.revokeAccess(id, walletAddress);
      alert(`On-Chain Access Revoked! TxHash: ${res.data.transactionHash}`);
      fetchFileDetails();
    } catch (err) {
      alert(`Revoke Error: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) return <LoadingSpinner message="Querying IPFS & Ethereum contract details..." />;
  if (!file) return <div className="alert alert-danger">File not found</div>;

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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate('/my-files')} className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        Back to Files
      </button>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={30} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{file.originalName}</h2>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                {formatSize(file.size)} • Uploaded on {new Date(file.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleDownload} disabled={downloading} className="btn btn-primary">
              <Download size={18} />
              <span>{downloading ? 'Decrypting...' : 'Download & Decrypt'}</span>
            </button>

            {canManage && (
              <button onClick={() => setIsShareModalOpen(true)} className="btn btn-secondary">
                <Share2 size={18} />
                <span>Grant Access</span>
              </button>
            )}
          </div>
        </div>

        {/* Technical Architecture Specs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          backgroundColor: '#f8fafc',
          padding: '1.25rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>IPFS CONTENT IDENTIFIER (CID)</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563eb', marginTop: '0.25rem', wordBreak: 'break-all' }}>
              {file.ipfsCid}
            </div>
          </div>

          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>SMART CONTRACT FILE ID</div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#0f172a', marginTop: '0.25rem' }}>
              #{file.blockchainFileId}
            </div>
          </div>

          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>ENCRYPTION METHOD</div>
            <div style={{ fontWeight: 600, color: '#16a34a', marginTop: '0.25rem' }}>
              AES-256-GCM (Envelope Encrypted)
            </div>
          </div>

          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>OWNER WALLET ADDRESS</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>
              {file.ownerWallet}
            </div>
          </div>
        </div>

        {/* Access Permissions Section */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="#2563eb" />
            Ethereum On-Chain Authorized Wallets
          </h3>

          {accessList.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: '0.5rem' }}>
              No third-party wallet addresses have been granted access to this file yet.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Granted User</th>
                    <th>Ethereum Wallet Address</th>
                    <th>Granted Date</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {accessList.map((access) => (
                    <tr key={access._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{access.user?.name || 'External User'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{access.user?.email || 'N/A'}</div>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8125rem' }}>{access.walletAddress}</code>
                      </td>
                      <td>{new Date(access.createdAt).toLocaleDateString()}</td>
                      {canManage && (
                        <td>
                          <button
                            onClick={() => handleRevoke(access.walletAddress)}
                            className="btn btn-danger btn-sm"
                            title="Revoke access on Ethereum contract"
                          >
                            <UserX size={14} />
                            <span>Revoke On-Chain</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ShareModal
        file={file}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShareSubmit={handleShareSubmit}
        isSubmitting={isSharing}
      />
    </div>
  );
};

export default FileDetails;
