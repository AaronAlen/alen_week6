import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, activityRes] = await Promise.all([
        API.get('/admin/users'),
        API.get('/admin/activity')
      ]);

      setUsers(usersRes.data.users);
      setStats(activityRes.data.stats || []);
      setRecentLogs(activityRes.data.recentLogs || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access denied or error fetching admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { data } = await API.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(data.message || `User role updated to ${newRole}.`);
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const { data } = await API.delete(`/admin/users/${userId}`);
      toast.success(data.message || 'User deleted successfully.');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const [showCleanModal, setShowCleanModal] = useState(false);

  const handleCleanDatabases = async () => {
    setCleaning(true);
    try {
      const { data } = await API.post('/admin/clean-databases');
      toast.success(data.message || 'Both databases cleaned successfully!');
      setShowCleanModal(false);
      await fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clean databases.');
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', paddingTop: '3rem' }}>Loading Admin Portal & MongoDB Aggregations...</div>;
  }

  return (
    <div className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>👑 Admin Dashboard</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>User Role Management (MySQL) & Audit Analytics (MongoDB Aggregations)</p>
        </div>
        <button
          onClick={() => setShowCleanModal(true)}
          disabled={cleaning}
          className="btn btn-danger"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', fontSize: '0.9rem', fontWeight: '600' }}
        >
          🗑️ {cleaning ? 'Cleaning Databases...' : 'Clean Both Databases'}
        </button>
      </div>



      {/* STATS OVERVIEW */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-num">{users.length}</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Users (MySQL)</div>
        </div>
        {stats.map(s => (
          <div key={s._id} className="stat-card">
            <div className="stat-num" style={{ color: '#818cf8' }}>{s.count}</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{s._id}</div>
          </div>
        ))}
      </div>

      {/* USER MANAGEMENT (MySQL) */}
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Users Management (MySQL)</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="form-control"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="btn btn-danger" 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUDIT LOGS (MongoDB Aggregated View) */}
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Recent Activity & Audit Logs (MongoDB Collection)
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User ID</th>
                <th>Action</th>
                <th>Details Payload</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8' }}>No activity logged yet. Perform actions to see event listeners in action!</td></tr>
              ) : (
                recentLogs.map(log => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>User #{log.userId}</td>
                    <td><span className="badge badge-in_progress">{log.action}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOM CONFIRMATION MODAL (Replaces browser default alert) */}
      {showCleanModal && (
        <div className="modal-overlay" onClick={() => !cleaning && setShowCleanModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-badge">⚠️</div>
              <div>
                <h3 className="modal-title">Clean Both Databases?</h3>
                <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: '500' }}>Irreversible Reset</span>
              </div>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to clean both <strong>MySQL</strong> (TiDB Cloud) and <strong>MongoDB</strong> (Atlas)?</p>
              
              <ul className="modal-checklist">
                <li><span>🗑️</span> All tasks will be permanently deleted</li>
                <li><span>📜</span> All activity & audit logs will be cleared</li>
                <li><span>👥</span> Other test users will be deleted</li>
                <li><span>🛡️</span> Your current Admin session will be preserved</li>
              </ul>

              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                Both databases will be reset to a clean state ready for new tasks and testing.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={cleaning}
                onClick={() => setShowCleanModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={cleaning}
                onClick={handleCleanDatabases}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {cleaning ? 'Cleaning Databases...' : '🗑️ Yes, Clean Both Databases'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

