import React, { useState, useEffect } from 'react';

export default function TaskForm({ initialTask, onSubmit, onCancel, currentUser, users = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedUserId, setAssignedUserId] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setStatus(initialTask.status || 'PENDING');
      setPriority(initialTask.priority || 'MEDIUM');
      setAssignedUserId(initialTask.userId || currentUser?.id || '');
    } else {
      setAssignedUserId(currentUser?.id || '');
    }
  }, [initialTask, currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, description, status, priority, assignedUserId });
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
        {initialTask ? '✏️ Edit Task' : '➕ Create New Task'}
      </h3>

      <div className="form-group">
        <label>Task Title *</label>
        <input
          type="text"
          className="form-control"
          placeholder="e.g. Implement MySQL Indexing"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          className="form-control"
          placeholder="Add details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {currentUser?.role === 'ADMIN' && (
        <div className="form-group">
          <label>Assign To (Admin Privilege)</label>
          <select 
            className="form-control" 
            value={assignedUserId} 
            onChange={(e) => setAssignedUserId(e.target.value)}
          >
            <option value={currentUser.id}>Myself ({currentUser.name})</option>
            {!initialTask && (
              <option value="ALL">🌐 All Users (Assign to Everyone)</option>
            )}
            {users
              .filter(u => u.id !== currentUser.id)
              .map(u => (
                <option key={u.id} value={u.id}>
                  User #{u.id} - {u.name} ({u.email})
                </option>
              ))}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Status</label>
          <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="form-group">
          <label>Priority</label>
          <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {initialTask ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
