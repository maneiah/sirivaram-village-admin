import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChitFundAuth.css';

const ChitFundLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock authentication
      if (email && password.length >= 6) {
        localStorage.setItem('chitfund_admin_token', 'token_' + Date.now());
        localStorage.setItem('chitfund_admin_email', email);
        navigate('/chitdashboard');
      } else {
        setError('Invalid email or password');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="chitfund-login-wrapper">
      <div className="chitfund-login-container">
        <div className="chitfund-login-card">
          <div className="chitfund-login-header">
            <div className="chitfund-login-logo">
              <span className="logo-icon">💰</span>
            </div>
            <h1 className="chitfund-login-title">Sirivaram Chit Fund</h1>
            <p className="chitfund-login-subtitle">Admin Portal</p>
          </div>

          <form onSubmit={handleLogin} className="chitfund-login-form">
            {error && <div className="chitfund-login-error">{error}</div>}

            <div className="chitfund-form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="admin@sirivaram.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="chitfund-form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="chitfund-login-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login to Dashboard'}
            </button>

            <div className="chitfund-login-footer">
              <p>Demo credentials: any email + password (6+ chars)</p>
            </div>
          </form>
        </div>

        <div className="chitfund-login-background">
          <div className="chitfund-shape chitfund-shape-1"></div>
          <div className="chitfund-shape chitfund-shape-2"></div>
          <div className="chitfund-shape chitfund-shape-3"></div>
        </div>
      </div>
    </div>
  );
};

export default ChitFundLogin;
