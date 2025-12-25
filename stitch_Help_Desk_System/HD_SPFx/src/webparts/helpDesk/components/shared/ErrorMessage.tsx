import * as React from 'react';
import commonStyles from '../../styles/common.module.scss';
import styles from './ErrorMessage.module.scss';

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
    <div className={commonStyles.errorMessage}>
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <strong>Error:</strong> {message}
        </div>
        {onRetry && (
          <button
            className={`${commonStyles.buttonSecondary} ${styles.errorRetryButton}`}
            onClick={onRetry}
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
