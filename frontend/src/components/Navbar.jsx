import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        🛡️ TaskShield <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 400 }}>Week 6</span>
      </Link>

      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            {user.role === 'ADMIN' && (
              <Link to="/admin" className="nav-link">
                Admin Panel <span className="badge badge-admin">ADMIN</span>
              </Link>
            )}
            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              Hi, <strong>{user.name}</strong>
            </span>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
