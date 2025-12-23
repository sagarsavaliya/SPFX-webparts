import * as React from 'react';
import { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage, SuccessMessage } from '../shared/ErrorMessage';
import { Button } from '../shared/Button';
import styles from '../../styles/common.module.scss';

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
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: inProgress ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.5)',
        borderRadius: '8px',
        border: `1px solid ${
          completed ? '#10b981' : inProgress ? '#3b82f6' : 'rgba(71, 85, 105, 0.5)'
        }`,
        transition: 'all 0.3s'
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: completed ? '#10b981' : inProgress ? '#3b82f6' : '#334155',
          color: 'white',
          fontSize: '14px',
          fontWeight: 600,
          flexShrink: 0
        }}
      >
        {completed ? '✓' : inProgress ? '...' : '○'}
      </div>
      <div style={{ flex: 1, fontSize: '14px', color: completed ? '#10b981' : 'white', fontWeight: 500 }}>
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
      <div className={styles.helpDeskRoot}>
        <div className={styles.contentWrapper}>
          <div style={{ maxWidth: '600px', margin: '60px auto', padding: '20px' }}>
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
    <div className={styles.helpDeskRoot}>
      <div className={styles.contentWrapper}>
        <div style={{ maxWidth: '700px', margin: '60px auto', padding: '20px' }}>
          <div className={styles.card}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                Setting Up Help Desk System
              </h1>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                Please wait while we configure everything for you...
              </p>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '32px' }}>
              <div
                style={{
                  width: '100%',
                  height: '12px',
                  background: '#1e293b',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid #334155'
                }}
              >
                <div
                  style={{
                    width: `${provisioningStatus.progress}%`,
                    height: '100%',
                    background: 'linear-gradient(to right, #3b82f6, #0d9488)',
                    transition: 'width 0.5s ease',
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  fontSize: '13px'
                }}
              >
                <span style={{ color: '#94a3b8' }}>{provisioningStatus.currentStep}</span>
                <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                  {provisioningStatus.progress}%
                </span>
              </div>
            </div>

            {/* Status Steps */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              <div style={{ textAlign: 'center' }}>
                <LoadingSpinner message="This will only take a minute..." size="medium" />
              </div>
            )}

            {/* Success Message */}
            {provisioningStatus.isProvisioned && !isProvisioning && (
              <div>
                <SuccessMessage message="Help Desk System is ready! Redirecting to dashboard..." />
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
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
