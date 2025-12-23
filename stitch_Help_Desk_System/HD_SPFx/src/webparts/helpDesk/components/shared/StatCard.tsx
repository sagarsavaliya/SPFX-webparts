import * as React from 'react';
import styles from '../../styles/common.module.scss';

interface IStatCardProps {
  label: string;
  value: number;
  icon: string; // Fluent UI icon name or emoji
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  onClick?: () => void;
  color?: string;
  isActive?: boolean;
  style?: React.CSSProperties;
}

/**
 * StatCard Component
 * Dashboard statistic card with icon and trend
 */
export const StatCard: React.FC<IStatCardProps> = ({
  label,
  value,
  icon,
  trend,
  onClick,
  color = '#3b82f6',
  isActive = false,
  style
}) => {
  return (
    <div
      className={styles.statCard}
      onClick={onClick}
      style={{
        ...style,
        border: isActive ? `2px solid ${color}` : undefined,
        boxShadow: isActive ? `0 0 20px ${color}40` : undefined
      }}
    >
      <div className={styles.statCardHeader}>
        <div>
          <div className={styles.statCardLabel}>{label}</div>
          <div className={styles.statCardValue}>{value}</div>
          {trend && (
            <div className={styles.statCardChange}>
              <span style={{ color: trend.direction === 'up' ? '#10b981' : '#ef4444' }}>
                {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
              </span>
              <span style={{ color: '#94a3b8', marginLeft: '4px' }}>from last week</span>
            </div>
          )}
        </div>
        <div className={styles.statCardIcon} style={{ color, borderColor: `${color}40`, backgroundColor: `${color}20` }}>
          <span style={{ fontSize: '24px' }}>{icon}</span>
        </div>
      </div>
    </div>
  );
};
