import * as React from 'react';
import styles from '../../styles/common.module.scss';

interface ILoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Loading Spinner Component
 * Displays a spinning loader with optional message
 */
export const LoadingSpinner: React.FC<ILoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'medium'
}) => {
  const spinnerSize = size === 'small' ? '24px' : size === 'large' ? '60px' : '40px';

  return (
    <div className={styles.loadingContainer}>
      <div
        className={styles.spinner}
        style={{ width: spinnerSize, height: spinnerSize }}
      />
      {message && <div className={styles.loadingText}>{message}</div>}
    </div>
  );
};
