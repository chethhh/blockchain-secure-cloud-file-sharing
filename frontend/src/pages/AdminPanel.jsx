import React, { useState, useEffect } from 'react';
import { userAPI, fileAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ShieldCheck, Users, Files, UserCheck, ShieldAlert } from 'lucide-react';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, filesRes] = await Promise.all([
        userAPI.getUsers(),
        fileAPI.getFiles()
      ]);
      setUsers(usersRes.data.users || []);
      setFileCount(filesRes.data.files?.length || 0);
    } catch (err) {
      console.error('[AdminPanel Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await userAPI.updateUserRole(userId, newRole);
      alert(`Role successfully updated to ${newRole}`);
      fetchAdminData();
    } catch (err) {
      alert(`Update Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching system administration control panel..." />;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>System Admin Panel</h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Manage user accounts, assign authorization roles (RBAC), and oversee system activity
        </p>
      </div>

      {/* Stats row */}
      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{users.length}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Registered Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Files size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{fileCount}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Total System Files</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>User Authorization & Roles</h3>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>MFA Status</th>
                <th>Connected Ethereum Wallet</th>
                <th>Role (RBAC)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    {u.isEmailVerified ? (
                      <span className="badge badge-success">Verified</span>
                    ) : (
                      <span className="badge badge-warning">Pending</span>
                    )}
                  </td>
                  <td>
                    {u.walletAddress ? (
                      <code style={{ fontSize: '0.8125rem' }}>{u.walletAddress}</code>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>No Wallet Linked</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'Admin' ? 'badge-danger' : u.role === 'Editor' ? 'badge-primary' : 'badge-warning'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-control"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', width: 'auto' }}
                      value={u.role}
                      disabled={updatingId === u._id}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
