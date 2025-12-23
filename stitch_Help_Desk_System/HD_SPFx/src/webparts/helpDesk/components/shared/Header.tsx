import * as React from 'react';
import { useAppContext } from '../../context/AppContext';
import styles from '../../styles/common.module.scss';

interface IHeaderProps {
  onNavigate?: (route: string) => void;
  currentRoute?: string;
}

/**
 * Header Component
 * Main navigation header with user profile
 */
export const Header: React.FC<IHeaderProps> = ({ onNavigate, currentRoute = '/dashboard' }) => {
  const { currentUser } = useAppContext();

  const navItems = React.useMemo(() => {
    if (!currentUser) return [];

    const items = [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'My Tickets', route: '/my-tickets' },
      { label: 'Knowledge Base', route: '/kb' },
      { label: 'FAQs', route: '/faq' }
    ];

    return items;
  }, [currentUser]);

  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              background: 'linear-gradient(to bottom right, #3b82f6, #0d9488)',
              color: 'white',
              boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)'
            }}
          >
            <span style={{ fontSize: '20px' }}>🎫</span>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              Help Desk
            </div>
            <div
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#0d9488',
                fontWeight: 600
              }}
            >
              Enterprise Portal
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <a
              key={item.route}
              href={`#${item.route}`}
              className={`${styles.navLink} ${currentRoute === item.route ? styles.active : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.(item.route);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'none' }}>
          <input
            type="text"
            placeholder="Search KB articles..."
            className={styles.input}
            style={{ width: '240px', height: '36px', paddingLeft: '36px', fontSize: '13px' }}
          />
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8'
            }}
          >
            🔍
          </span>
        </div>

        {/* Notifications */}
        <button
          style={{
            position: 'relative',
            borderRadius: '50%',
            padding: '8px',
            color: '#94a3b8',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <span style={{ fontSize: '20px' }}>🔔</span>
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444',
              border: '2px solid #1e293b'
            }}
          />
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '32px', background: '#475569' }} />

        {/* User */}
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                {currentUser.DisplayName}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {currentUser.Role}
              </div>
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
                border: '1px solid #475569',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              {currentUser.DisplayName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
