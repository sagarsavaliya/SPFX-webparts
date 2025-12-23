import * as React from 'react';
import styles from '../../styles/common.module.scss';

interface ICardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Card Component
 * Glass panel container with hover effects
 */
export const Card: React.FC<ICardProps> = ({ children, className = '', onClick, style }) => {
  return (
    <div
      className={`${styles.card} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      {children}
    </div>
  );
};
