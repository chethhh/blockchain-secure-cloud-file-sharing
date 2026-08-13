import React, { useState, useEffect } from 'react';
import { activityAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Activity, ExternalLink } from 'lucide-react';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await activityAPI.getActivityLogs();
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('[ActivityLogs Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTxHash = (hash) => {
    if (!hash) return '-';
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}`;
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'FILE_UPLOADED': return 'badge-primary';
      case 'FILE_ACCESSED': return 'badge-success';
      case 'ACCESS_GRANTED': return 'badge-warning';
      case 'ACCESS_REVOKED': return 'badge-danger';
      case 'WALLET_CONNECTED': return 'badge-success';
      default: return 'badge-primary';
    }
  };

  if (loading) return <LoadingSpinner message="Fetching system audit logs..." />;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>System Activity Logs</h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Tamper-evident activity trail for authentications, file uploads, permissions, and downloads
        </p>
      </div>

      <div className="card">
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            No activity logs recorded yet.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Associated File</th>
                  <th>Wallet Address</th>
                  <th>Transaction Hash</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.user?.name || 'System / Guest'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.user?.email || '-'}</div>
                    </td>
                    <td>
                      {log.file ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{log.file.originalName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: #{log.file.blockchainFileId}</div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {log.walletAddress ? (
                        <code style={{ fontSize: '0.75rem' }}>
                          {log.walletAddress.substring(0, 8)}...{log.walletAddress.substring(log.walletAddress.length - 4)}
                        </code>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {log.transactionHash ? (
                        <code style={{ fontSize: '0.75rem', color: '#2563eb' }}>
                          {formatTxHash(log.transactionHash)}
                        </code>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
