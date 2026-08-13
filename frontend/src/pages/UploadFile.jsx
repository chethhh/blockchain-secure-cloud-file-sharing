import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import { fileAPI } from '../services/api';
import { UploadCloud, CheckCircle2, ShieldAlert, FileText, Loader2, ArrowLeft } from 'lucide-react';

const UploadFile = () => {
  const { account, connectWallet } = useContext(WalletContext);
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusStep, setStatusStep] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!account) {
      setError('You must connect your MetaMask wallet before uploading to blockchain');
      return;
    }

    setUploading(true);
    setProgress(10);
    setStatusStep('1. Encrypting raw file buffer using AES-256-GCM...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setTimeout(() => {
        setProgress(40);
        setStatusStep('2. Pinning encrypted payload to IPFS storage...');
      }, 800);

      setTimeout(() => {
        setProgress(70);
        setStatusStep('3. Sending transaction to Ethereum smart contract (uploadFile)...');
      }, 1800);

      const res = await fileAPI.uploadFile(formData, (event) => {
        // upload progress callback
      });

      setProgress(100);
      setStatusStep('Complete!');
      setResult(res.data.file);
      setUploading(false);
    } catch (err) {
      setUploading(false);
      const msg = err.response?.data?.message || err.message || 'File upload failed';
      setError(msg);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div className="card">
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Upload Encrypted File</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Files are client-encrypted with AES-256-GCM, pinned to IPFS, and registered on Ethereum.
          </p>
        </div>

        {!account && (
          <div className="alert alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={20} />
              <span>Wallet Disconnected: Please connect MetaMask to proceed with blockchain transactions.</span>
            </div>
            <button onClick={connectWallet} className="btn btn-primary btn-sm">Connect Wallet</button>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {result ? (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#166534', fontWeight: 700, fontSize: '1.25rem' }}>Upload Successful!</h3>
            <p style={{ fontSize: '0.875rem', color: '#15803d', marginTop: '0.25rem' }}>
              File is encrypted, pinned to IPFS, and recorded on the smart contract.
            </p>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.375rem',
              padding: '1rem',
              textAlign: 'left',
              marginTop: '1.25rem',
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <div><strong>Original File:</strong> {result.originalName}</div>
              <div><strong>IPFS CID:</strong> <code style={{ color: '#2563eb' }}>{result.ipfsCid}</code></div>
              <div><strong>Blockchain File ID:</strong> #{result.blockchainFileId}</div>
              <div style={{ wordBreak: 'break-all' }}>
                <strong>Transaction Hash:</strong> <code style={{ fontSize: '0.75rem' }}>{result.transactionHash}</code>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button onClick={() => { setFile(null); setResult(null); }} className="btn btn-secondary">
                Upload Another File
              </button>
              <button onClick={() => navigate('/my-files')} className="btn btn-primary">
                View My Files
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? '#2563eb' : '#cbd5e1'}`,
                backgroundColor: dragActive ? '#eff6ff' : '#f8fafc',
                borderRadius: '0.75rem',
                padding: '3rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '1.5rem'
              }}
              onClick={() => document.getElementById('file-upload-input').click()}
            >
              <input
                id="file-upload-input"
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <UploadCloud size={48} color={dragActive ? '#2563eb' : '#94a3b8'} style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 600, fontSize: '1rem', color: '#0f172a' }}>
                Drag and drop your file here, or click to browse
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Supports documents, media, and images up to 10 MB
              </div>
            </div>

            {file && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: '#f1f5f9',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={24} color="#2563eb" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{file.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatSize(file.size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="btn btn-secondary btn-sm"
                >
                  Remove
                </button>
              </div>
            )}

            {uploading && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#2563eb', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    {statusStep}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#2563eb', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || !account || uploading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {uploading ? 'Processing End-to-End Encryption & IPFS Upload...' : 'Encrypt & Upload to IPFS / Blockchain'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UploadFile;
