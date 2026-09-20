import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import owlMascot from '../../assets/owl-mascot.png';
import { useAuth } from '../../hooks/useAuth';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Auto-close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="app-container">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="mobile-header-brand">
          <img
            src={owlMascot}
            alt="Owl Mascot"
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        <div className="mobile-header-user" title={user?.name || ''}>
          <span className="user-avatar-badge">{initials}</span>
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      <div
        className={`sidebar-backdrop ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="main-wrapper">
        <Outlet />
      </main>
    </div>
  );
};

