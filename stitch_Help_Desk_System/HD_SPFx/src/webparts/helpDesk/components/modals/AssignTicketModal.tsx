import * as React from 'react';
import { useState, useEffect } from 'react';
import { UserService, TicketService } from '../../services';
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import styles from './AssignTicketModal.module.scss';

interface IAssignTicketModalProps {
  ticketId: number;
  ticketTitle: string;
  currentAssigneeId?: number;
  currentAssigneeName?: string;
  onClose: () => void;
  onAssigned: () => void;
}

/**
 * AssignTicketModal Component
 * Modal for assigning tickets to technicians
 */
export const AssignTicketModal: React.FC<IAssignTicketModalProps> = ({
  ticketId,
  ticketTitle,
  currentAssigneeId,
  currentAssigneeName,
  onClose,
  onAssigned
}) => {
  const [technicians, setTechnicians] = useState<Array<{ Id: number; DisplayName: string; Email: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(currentAssigneeId);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadTechnicians = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const techs = await UserService.getTechnicians();
        setTechnicians(techs);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading technicians:', err);
        setError('Failed to load technicians');
        setIsLoading(false);
      }
    };

    void loadTechnicians();
  }, []);

  const handleAssign = async (): Promise<void> => {
    if (!selectedUserId) {
      setError('Please select a technician');
      return;
    }

    try {
      setIsAssigning(true);
      setError(undefined);

      await TicketService.assignTicket(ticketId, selectedUserId);
      onAssigned();
    } catch (err) {
      console.error('Error assigning ticket:', err);
      setError('Failed to assign ticket. Please try again.');
      setIsAssigning(false);
    }
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div className={styles.modalBackdrop} onClick={onClose} />

      {/* Modal Content */}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Assign Ticket
          </h2>
          <button onClick={onClose} className={styles.modalCloseButton}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Ticket Info */}
          <div className={styles.ticketInfo}>
            <p className={styles.ticketInfoLabel}>
              Ticket:
            </p>
            <p className={styles.ticketInfoTitle}>
              {ticketTitle}
            </p>
            {currentAssigneeName && (
              <p className={styles.currentAssignee}>
                Currently assigned to: <span className={styles.assigneeName}>{currentAssigneeName}</span>
              </p>
            )}
          </div>

          {isLoading ? (
            <div className={styles.loadingContainer}>
              <LoadingSpinner message="Loading technicians..." />
            </div>
          ) : (
            <>
              {/* Technician Dropdown */}
              <div className={styles.formField}>
                <label htmlFor="technician" className={styles.formLabel}>
                  Assign to Technician *
                </label>
                <select
                  id="technician"
                  value={selectedUserId || ''}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value ? Number(e.target.value) : undefined);
                    setError(undefined);
                  }}
                  className={styles.formSelect}
                >
                  <option value="">-- Select a technician --</option>
                  {technicians.map((tech) => (
                    <option key={tech.Id} value={tech.Id}>
                      {tech.DisplayName} ({tech.Email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Error Message */}
              {error && (
                <div className={styles.errorMessage}>
                  <p className={styles.errorText}>
                    {error}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isLoading || isAssigning || !selectedUserId}>
            {isAssigning ? 'Assigning...' : 'Assign Ticket'}
          </Button>
        </div>
      </div>
    </>
  );
};
