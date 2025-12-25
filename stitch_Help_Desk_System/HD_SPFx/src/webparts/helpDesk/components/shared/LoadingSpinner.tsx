import * as React from 'react';
import commonStyles from '../../styles/common.module.scss';
import styles from './LoadingSpinner.module.scss';

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
  return (
    <div className={commonStyles.loadingContainer}>
      <div className={`${styles.spinner} ${styles[size]}`} />
      {message && <div className={commonStyles.loadingText}>{message}</div>}
    </div>
  );
};
