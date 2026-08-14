import React from 'react';

export default function TaskCard({ task, onEdit, onDelete, onToggleComplete, currentUser }) {
  const isOwner = currentUser && (currentUser.id === task.userId || currentUser.role === 'ADMIN');

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f8fafc' }}>{task.title}</h3>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status.replace('_', ' ')}</span>
          <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
        </div>
      </div>

      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
        {task.description || 'No description provided.'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8rem', color: '#64748b' }}>
        <span>Assigned to: <strong style={{ color: '#cbd5e1' }}>{task.user ? `${task.user.name} (${task.user.email})` : `User #${task.userId}`}</strong></span>
        
        {isOwner && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => onToggleComplete(task)} 
              className={`btn ${task.status === 'COMPLETED' ? 'btn-secondary' : 'btn-primary'}`} 
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            >
              {task.status === 'COMPLETED' ? '↩ Reopen' : '✓ Mark Done'}
            </button>
            <button onClick={() => onEdit(task)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
              Edit
            </button>
            <button onClick={() => onDelete(task.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
