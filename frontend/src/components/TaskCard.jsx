import React from 'react';

export default function TaskCard({ task, onEdit, onDelete, onToggleComplete, currentUser }) {
  const isOwner = currentUser && (currentUser.id === task.userId || currentUser.role === 'ADMIN');

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* HEADER: Title & Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f8fafc', wordBreak: 'break-word', overflowWrap: 'anywhere', minWidth: 0, margin: 0, flex: 1 }}>
          {task.title}
        </h3>
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status.replace('_', ' ')}</span>
          <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
        </div>
      </div>

      {/* DESCRIPTION */}
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', flex: 1 }}>
        {task.description || 'No description provided.'}
      </p>

      {/* FOOTER: Assignee Details & Action Buttons */}
      <div style={{ marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
        <div style={{ minWidth: 0, wordBreak: 'break-word', flex: '1 1 180px' }}>
          <span>Assigned to: </span>
          <strong style={{ color: '#cbd5e1' }}>{task.user ? task.user.name : `User #${task.userId}`}</strong>
          {task.user?.email && (
            <div style={{ color: '#64748b', fontSize: '0.75rem', wordBreak: 'break-all', marginTop: '0.15rem' }}>
              {task.user.email}
            </div>
          )}
        </div>
        
        {isOwner && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginLeft: 'auto' }}>
            <button 
              onClick={() => onToggleComplete(task)} 
              className={`btn ${task.status === 'COMPLETED' ? 'btn-secondary' : 'btn-primary'}`} 
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
            >
              {task.status === 'COMPLETED' ? '↩ Reopen' : '✓ Mark Done'}
            </button>
            <button onClick={() => onEdit(task)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
              Edit
            </button>
            <button onClick={() => onDelete(task.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
