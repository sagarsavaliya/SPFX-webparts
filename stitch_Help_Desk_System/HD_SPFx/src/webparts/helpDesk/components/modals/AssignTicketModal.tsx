import * as React from 'react';
import { useState, useEffect } from 'react';
import { UserService, TicketService } from '../../services';
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';

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
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#1e293b',
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          width: '90%',
          maxWidth: '500px',
          border: '1px solid #334155'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'white', margin: 0 }}>
            Assign Ticket
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 8px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Ticket Info */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>
              Ticket:
            </p>
            <p style={{ fontSize: '16px', color: 'white', fontWeight: 500 }}>
              {ticketTitle}
            </p>
            {currentAssigneeName && (
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
                Currently assigned to: <span style={{ color: '#3b82f6' }}>{currentAssigneeName}</span>
              </p>
            )}
          </div>

          {isLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <LoadingSpinner message="Loading technicians..." />
            </div>
          ) : (
            <>
              {/* Technician Dropdown */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="technician"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'white',
                    marginBottom: '8px'
                  }}
                >
                  Assign to Technician *
                </label>
                <select
                  id="technician"
                  value={selectedUserId || ''}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value ? Number(e.target.value) : undefined);
                    setError(undefined);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
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
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    marginBottom: '20px'
                  }}
                >
                  <p style={{ fontSize: '14px', color: '#ef4444', margin: 0 }}>
                    {error}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
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
