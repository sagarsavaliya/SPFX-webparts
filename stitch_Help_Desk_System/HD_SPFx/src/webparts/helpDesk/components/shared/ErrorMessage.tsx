import * as React from 'react';
import styles from '../../styles/common.module.scss';

interface IErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Error Message Component
 * Displays error messages with optional retry button
 */
export const ErrorMessage: React.FC<IErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className={styles.errorMessage}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <strong>Error:</strong> {message}
        </div>
        {onRetry && (
          <button
            className={styles.buttonSecondary}
            onClick={onRetry}
            style={{ flexShrink: 0 }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

interface ISuccessMessageProps {
  message: string;
}

/**
 * Success Message Component
 */
export const SuccessMessage: React.FC<ISuccessMessageProps> = ({ message }) => {
  return (
    <div className={styles.successMessage}>
      <strong>Success:</strong> {message}
    </div>
  );
};
