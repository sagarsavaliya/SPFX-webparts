import * as React from 'react';
import styles from './Footer.module.scss';

/**
 * Footer Component
 * Displays Akshara Technologies branding with logo and link
 */
export const Footer: React.FC = () => {
  return (
    <div className={styles.footer}>
      <a
        href="https://aksharatech.com"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.footerLink}
        aria-label="Made by Akshara Technologies"
      >
        <div className={styles.footerContent}>

          <span className={styles.footerText}>
            © 2025 Akshara Technologies. All rights reserved.
          </span>
        </div>
      </a>
    </div>
  );
};
