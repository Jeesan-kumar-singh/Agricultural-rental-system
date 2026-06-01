import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export const Header = () => {
  const { user, isAuthenticated, logout, isFarmer, isOwner } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <Link to="/" className="logo-section" onClick={() => setMobileMenuOpen(false)}>
          <span className="logo-icon">🚜</span>
          <span className="logo-text">Agri<span className="accent-text">Rent</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link to="/" className="nav-link">Catalog</Link>
          
          {isAuthenticated && isFarmer && (
            <Link to="/farmer-dashboard" className="nav-link">My Rentals</Link>
          )}

          {isAuthenticated && isOwner && (
            <Link to="/admin-dashboard" className="nav-link">Owner Dashboard</Link>
          )}

          {isAuthenticated ? (
            <div className="user-nav-group">
              <span className="user-welcome">
                Hello, <strong className="user-role-text">{user.name}</strong>
                <span className="role-tag">{user.role}</span>
              </span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
            </div>
          ) : (
            <div className="auth-nav-group">
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Join us</Link>
            </div>
          )}
        </nav>

        {/* Mobile menu trigger */}
        <button 
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`} 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <div className="mobile-nav-panel">
          <nav className="mobile-nav">
            <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Catalog</Link>
            
            {isAuthenticated && isFarmer && (
              <Link to="/farmer-dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>My Rentals</Link>
            )}

            {isAuthenticated && isOwner && (
              <Link to="/admin-dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Owner Dashboard</Link>
            )}

            {isAuthenticated ? (
              <div className="mobile-user-section">
                <div className="mobile-user-details">
                  <span className="mobile-user-name">{user.name}</span>
                  <span className="mobile-user-role">{user.role}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary full-width">Logout</button>
              </div>
            ) : (
              <div className="mobile-auth-section">
                <Link to="/login" className="btn btn-secondary full-width" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link to="/register" className="btn btn-primary full-width" onClick={() => setMobileMenuOpen(false)}>Join us</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
