import * as React from 'react';
import styles from './StatCard.module.scss';

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
 * Uses CSS Custom Properties for dynamic color theming
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
  // Helper function to convert hex color to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Dynamic CSS custom properties for theming
  const customProps = {
    '--accent-color': color,
    '--accent-shadow': hexToRgba(color, 0.25),
    '--icon-color': color,
    '--icon-border-color': hexToRgba(color, 0.25),
    '--icon-bg-color': hexToRgba(color, 0.13),
    ...style
  } as React.CSSProperties;

  return (
    <div
      className={`${styles.statCard} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      style={customProps}
    >
      <div className={styles.statCardHeader}>
        <div className={styles.statCardContent}>
          <div className={styles.statCardLabel}>{label}</div>
          <div className={styles.statCardValue}>{value}</div>
          {trend && (
            <div className={styles.statCardChange}>
              <span className={trend.direction === 'up' ? styles.trendUp : styles.trendDown}>
                {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
              </span>
              <span className={styles.trendLabel}>from last week</span>
            </div>
          )}
        </div>
        <div className={styles.statCardIcon}>
          <span>{icon}</span>
        </div>
      </div>
    </div>
  );
};
