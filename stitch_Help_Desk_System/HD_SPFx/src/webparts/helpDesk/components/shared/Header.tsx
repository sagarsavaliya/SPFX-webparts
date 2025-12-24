import * as React from 'react';
import { useAppContext } from '../../context/AppContext';
import { UserRole } from '../../models';
import commonStyles from '../../styles/common.module.scss';
import styles from './Header.module.scss';

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
      { label: 'Dashboard', route: '/dashboard' }
    ];

    // Only show "My Tickets" for regular users (not Manager/Admin/Technician)
    // Managers, Admins, and Technicians see all tickets in their dashboards
    if (currentUser.Role === UserRole.User) {
      items.push({ label: 'My Tickets', route: '/my-tickets' });
    }

    items.push(
      { label: 'Knowledge Base', route: '/kb' },
      { label: 'FAQs', route: '/faq' }
    );

    return items;
  }, [currentUser]);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <span>🎫</span>
          </div>
          <div className={styles.logoText}>
            <div className={styles.logoTitle}>
              Help Desk
            </div>
            <div className={styles.logoSubtitle}>
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
      <div className={styles.rightSection}>
        {/* Search */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search KB articles..."
            className={`${commonStyles.input} ${styles.searchInput}`}
          />
          <span className={styles.searchIcon}>
            🔍
          </span>
        </div>

        {/* Notifications */}
        <button className={styles.notificationButton} aria-label="Notifications">
          <span>🔔</span>
          <span className={styles.notificationBadge} />
        </button>

        {/* Divider */}
        <div className={styles.divider} />

        {/* User */}
        {currentUser && (
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {currentUser.DisplayName}
              </div>
              <div className={styles.userRole}>
                {currentUser.Role}
              </div>
            </div>
            <div className={styles.userAvatar}>
              {currentUser.DisplayName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
