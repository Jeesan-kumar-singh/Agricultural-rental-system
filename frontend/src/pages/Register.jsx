import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // Shares the layout styling of Auth pages

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('farmer'); // Default role: farmer
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setError('Please complete all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await register(name, email, password, role);
      setSuccess('Account created successfully! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create an account.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card card">
        <div className="auth-header">
          <span className="auth-logo">🌱</span>
          <h2>Join AgriRent</h2>
          <p>Optimize your farm operations today</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jeesan Singh"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jeesan@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose secure password"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">I want to...</label>
            <div className="role-selector-grid">
              <div 
                className={`role-option ${role === 'farmer' ? 'selected' : ''}`}
                onClick={() => setRole('farmer')}
              >
                <span className="role-emoji">🌾</span>
                <span className="role-title">Rent Tools</span>
                <span className="role-desc">I am a Farmer</span>
              </div>

              <div 
                className={`role-option ${role === 'owner' ? 'selected' : ''}`}
                onClick={() => setRole('owner')}
              >
                <span className="role-emoji">🚜</span>
                <span className="role-title">List Tools</span>
                <span className="role-desc">I own Equipment</span>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Login</Link></p>
        </div>
      </div>
    </div>
  );
};
