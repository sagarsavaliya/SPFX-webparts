import * as React from 'react';
import commonStyles from '../../styles/common.module.scss';
import styles from './Card.module.scss';

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
      className={`${commonStyles.card} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};
