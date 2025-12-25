import * as React from 'react';
import { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage, SuccessMessage } from '../shared/ErrorMessage';
import { Button } from '../shared/Button';
import commonStyles from '../../styles/common.module.scss';
import styles from './ProvisioningPanel.module.scss';

/**
 * ProvisioningStep Component
 * Individual step in provisioning process
 */
interface IProvisioningStepProps {
  label: string;
  completed: boolean;
  inProgress: boolean;
}

const ProvisioningStep: React.FC<IProvisioningStepProps> = ({ label, completed, inProgress }) => {
  const stepClasses = [
    styles.step,
    completed ? styles.stepCompleted : inProgress ? styles.stepInProgress : styles.stepPending
  ].join(' ');

  const iconClasses = [
    styles.stepIcon,
    completed ? styles.stepIconCompleted : inProgress ? styles.stepIconInProgress : styles.stepIconPending
  ].join(' ');

  const labelClasses = [
    styles.stepLabel,
    completed ? styles.stepLabelCompleted : inProgress ? styles.stepLabelInProgress : styles.stepLabelPending
  ].join(' ');

  return (
    <div className={stepClasses}>
      <div className={iconClasses}>
        {completed ? '✓' : inProgress ? '...' : '○'}
      </div>
      <div className={labelClasses}>
        {label}
      </div>
    </div>
  );
};

/**
 * ProvisioningPanel Component
 * Displays provisioning progress and handles auto-setup
 */
export const ProvisioningPanel: React.FC = () => {
  const { provisioningStatus, isProvisioning, startProvisioning, error } = useAppContext();
  const [autoStarted, setAutoStarted] = React.useState(false);

  // Auto-start provisioning if not already provisioned
  useEffect(() => {
    if (!provisioningStatus.isProvisioned && !isProvisioning && !autoStarted && !error) {
      setAutoStarted(true);
      void startProvisioning();
    }
  }, [provisioningStatus.isProvisioned, isProvisioning, autoStarted, startProvisioning, error]);

  if (error) {
    return (
      <div className={commonStyles.helpDeskRoot}>
        <div className={commonStyles.contentWrapper}>
          <div className={styles.errorContainer}>
            <ErrorMessage message={error} onRetry={() => window.location.reload()} />
          </div>
        </div>
      </div>
    );
  }

  if (provisioningStatus.isProvisioned) {
    return null; // Don't show anything if already provisioned
  }

  return (
    <div className={commonStyles.helpDeskRoot}>
      <div className={commonStyles.contentWrapper}>
        <div className={styles.container}>
          <div className={commonStyles.card}>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerIcon}>🚀</div>
              <h1 className={styles.headerTitle}>
                Setting Up Help Desk System
              </h1>
              <p className={styles.headerSubtitle}>
                Please wait while we configure everything for you...
              </p>
            </div>

            {/* Progress Bar */}
            <div className={styles.progressSection}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${provisioningStatus.progress}%` }}
                />
              </div>
              <div className={styles.progressInfo}>
                <span className={styles.progressLabel}>{provisioningStatus.currentStep}</span>
                <span className={styles.progressPercent}>
                  {provisioningStatus.progress}%
                </span>
              </div>
            </div>

            {/* Status Steps */}
            <div className={styles.stepsSection}>
              <div className={styles.stepsList}>
                <ProvisioningStep
                  label="Creating SharePoint Groups"
                  completed={provisioningStatus.groupsCreated}
                  inProgress={provisioningStatus.progress >= 10 && provisioningStatus.progress < 20}
                />
                <ProvisioningStep
                  label="Creating SharePoint Lists"
                  completed={provisioningStatus.listsCreated}
                  inProgress={provisioningStatus.progress >= 20 && provisioningStatus.progress < 70}
                />
                <ProvisioningStep
                  label="Adding Initial Data"
                  completed={provisioningStatus.mockDataAdded}
                  inProgress={provisioningStatus.progress >= 70 && provisioningStatus.progress < 100}
                />
                <ProvisioningStep
                  label="Finalizing Setup"
                  completed={provisioningStatus.isProvisioned}
                  inProgress={provisioningStatus.progress === 100}
                />
              </div>
            </div>

            {/* Loading Spinner */}
            {isProvisioning && (
              <div className={styles.loadingSection}>
                <LoadingSpinner message="This will only take a minute..." size="medium" />
              </div>
            )}

            {/* Success Message */}
            {provisioningStatus.isProvisioned && !isProvisioning && (
              <div>
                <SuccessMessage message="Help Desk System is ready! Redirecting to dashboard..." />
                <div className={styles.successSection}>
                  <Button onClick={() => window.location.reload()}>Go to Dashboard</Button>
                </div>
              </div>
            )}

            {/* Error State */}
            {provisioningStatus.error && (
              <ErrorMessage
                message={provisioningStatus.error}
                onRetry={() => void startProvisioning()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
