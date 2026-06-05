import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ChitFundAdminLayout.css';

const ChitFundAdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('chitfund_admin_token');
    const email = localStorage.getItem('chitfund_admin_email');
    
    if (!token) {
      navigate('/chitadmin');
    } else {
      setAdminEmail(email || 'Admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('chitfund_admin_token');
    localStorage.removeItem('chitfund_admin_email');
    navigate('/chitadmin');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⬛', path: '/chitdashboard' },
    { id: 'groups', label: 'Groups', icon: '👥', path: '/chitdashboard?page=groups' },
    { id: 'members', label: 'Members', icon: '👤', path: '/chitdashboard?page=members', badge: '6' },
    { id: 'cycles', label: 'Cycles', icon: '🔄', path: '/chitdashboard?page=cycles', badge: '3' },
    { id: 'workflow', label: 'New Chit Draw', icon: '🏆', path: '/chitdashboard?page=workflow' },
    { id: 'payout', label: 'Payout', icon: '💰', path: '/chitdashboard?page=payout' },
    { id: 'reminders', label: 'Reminders', icon: '🔔', path: '/chitdashboard?page=reminders', badge: '2', badgeColor: 'red' },
    { id: 'smslog', label: 'SMS Log', icon: '💬', path: '/chitdashboard?page=smslog' },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.includes('chitdashboard');
  };

  return (
    <div className="chitfund-admin-wrapper">
      {/* Sidebar */}
      <aside className={`chitfund-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="chitfund-sidebar-logo">
          <div className="logo-mark">
            Sirivaram<br />
            <span>Chit Fund</span>
          </div>
          <div className="logo-sub">Admin Panel</div>
        </div>

        <div className="chitfund-sidebar-nav">
          <div className="sidebar-section">Main</div>
          {menuItems.slice(0, 1).map((item) => (
            <div
              key={item.id}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </div>
          ))}

          <div className="sidebar-section">Manage</div>
          {menuItems.slice(1, 4).map((item) => (
            <div
              key={item.id}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </div>
          ))}

          <div className="sidebar-section">Workflow</div>
          {menuItems.slice(4, 7).map((item) => (
            <div
              key={item.id}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && item.badge && (
                <span className={`nav-badge ${item.badgeColor ? `badge-${item.badgeColor}` : ''}`}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}

          <div className="sidebar-section">Reports</div>
          {menuItems.slice(7).map((item) => (
            <div
              key={item.id}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </div>
          ))}
        </div>

        <div className="chitfund-sidebar-footer">
          <div className="admin-chip">
            <div className="admin-avatar">
              {adminEmail.charAt(0).toUpperCase()}A
            </div>
            {sidebarOpen && (
              <div>
                <div className="admin-name">Sirivaram Admin</div>
                <div className="admin-role">Administrator</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="chitfund-main">
        {/* Topbar */}
        <div className="chitfund-topbar">
          <div className="topbar-left">
            <button
              className="toggle-sidebar-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <div>
              <div className="topbar-title">Chit Fund Admin</div>
              <div className="topbar-sub">Manage your chit fund operations</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Content */}
        <div className="chitfund-content">
          {children}
        </div>

        {/* Footer */}
        <div className="chitfund-footer">
          <p>© 2026 Sirivaram Chit Fund Admin • All rights reserved</p>
        </div>
      </div>
    </div>
  );
};

export default ChitFundAdminLayout;
