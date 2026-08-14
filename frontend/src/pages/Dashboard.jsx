import React, { useState, useEffect } from 'react';
import API from '../services/api';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

export default function Dashboard({ user }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = async (currentPage = page) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get(`/tasks?page=${currentPage}&limit=6`);
      setTasks(data.tasks);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(page);
    if (user?.role === 'ADMIN') {
      API.get('/admin/users')
        .then(res => setUsers(res.data.users || []))
        .catch(err => console.error('Failed to fetch users for admin task assignment:', err));
    }
  }, [page, user]);

  const handleCreateTask = async (taskData) => {
    try {
      const { data } = await API.post('/tasks', taskData);
      if (data.message) {
        alert(data.message);
      }
      setShowCreateForm(false);
      fetchTasks(1); // Reset to page 1
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task.');
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await API.put(`/tasks/${editingTask.id}`, taskData);
      setEditingTask(null);
      fetchTasks(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      fetchTasks(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await API.put(`/tasks/${task.id}`, { status: newStatus });
      fetchTasks(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task status.');
    }
  };

  return (
    <div className="container">
      {/* HEADER BANNER */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Welcome, {user?.name}! 👋</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Logged in as: <span className={`badge badge-${user?.role?.toLowerCase()}`}>{user?.role}</span>
          </p>
        </div>

        <button 
          onClick={() => { setEditingTask(null); setShowCreateForm(!showCreateForm); }} 
          className="btn btn-primary"
        >
          {showCreateForm ? 'Close Form' : '➕ Create Task'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* CREATE FORM */}
      {showCreateForm && (
        <TaskForm 
          currentUser={user}
          users={users}
          onSubmit={handleCreateTask} 
          onCancel={() => setShowCreateForm(false)} 
        />
      )}

      {/* EDIT FORM */}
      {editingTask && (
        <TaskForm 
          currentUser={user}
          users={users}
          initialTask={editingTask} 
          onSubmit={handleUpdateTask} 
          onCancel={() => setEditingTask(null)} 
        />
      )}

      {/* TASK LIST */}
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: '600' }}>
        {user?.role === 'ADMIN' ? 'All System Tasks (Admin View)' : 'My Tasks'}
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading tasks from MySQL...</div>
      ) : tasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          No tasks found. Click "Create Task" to get started!
        </div>
      ) : (
        <div className="grid-2">
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              currentUser={user}
              onEdit={(t) => { setShowCreateForm(false); setEditingTask(t); }} 
              onDelete={handleDeleteTask} 
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)} 
            className="btn btn-secondary"
          >
            ← Previous
          </button>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            Page <strong>{page}</strong> of {totalPages}
          </span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)} 
            className="btn btn-secondary"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
