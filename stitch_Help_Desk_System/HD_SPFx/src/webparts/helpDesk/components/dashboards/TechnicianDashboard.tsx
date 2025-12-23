import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TicketService, ConversationService } from '../../services';
import { ITicket, TicketStatus } from '../../models';
import { StatCard } from '../shared/StatCard';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';
import { Card } from '../shared/Card';
import { AssignTicketModal } from '../modals/AssignTicketModal';
import styles from '../../styles/common.module.scss';
import { SLACalculator } from '../../utils/SLACalculator';

interface ITechnicianDashboardProps {
  onNavigate: (route: string) => void;
}

type TicketFilter = 'assignedToMe' | 'open' | 'inProgress' | 'resolved';

/**
 * Technician Dashboard Component
 * Dashboard for technicians showing assigned tickets and stats
 */
export const TechnicianDashboard: React.FC<ITechnicianDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAppContext();
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [allTickets, setAllTickets] = useState<ITicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [assignModalTicket, setAssignModalTicket] = useState<ITicket | null>(null);
  const [activeFilter, setActiveFilter] = useState<TicketFilter>('assignedToMe');
  const [unreadConversations, setUnreadConversations] = useState<number>(0);

  // Stats
  const [stats, setStats] = useState({
    assignedToMe: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(undefined);

      // Load all tickets for filtering
      const allTicketsData = await TicketService.getTickets();
      setAllTickets(allTicketsData);

      // Calculate stats
      const myTickets = allTicketsData.filter(t => t.AssignedToId === currentUser?.Id);
      const newStats = {
        assignedToMe: myTickets.length,
        open: allTicketsData.filter(t => t.Status === 'Open' || t.Status === 'New').length,
        inProgress: allTicketsData.filter(t => t.Status === 'In Progress').length,
        resolved: allTicketsData.filter(t => t.Status === 'Resolved' || t.Status === 'Closed').length
      };
      setStats(newStats);

      // Apply default filter (assigned to me)
      applyFilter('assignedToMe', allTicketsData);

      // Get unread conversations count
      try {
        const conversations = await ConversationService.getUnreadConversationsCount(currentUser?.Id || 0);
        setUnreadConversations(conversations);
      } catch (convError) {
        console.log('Could not load unread conversations:', convError);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
      setIsLoading(false);
    }
  }, [currentUser?.Id]);

  const applyFilter = (filter: TicketFilter, ticketsData?: ITicket[]): void => {
    const dataToFilter = ticketsData || allTickets;
    let filtered: ITicket[] = [];

    switch (filter) {
      case 'assignedToMe':
        filtered = dataToFilter.filter(t => t.AssignedToId === currentUser?.Id);
        break;
      case 'open':
        filtered = dataToFilter.filter(t => t.Status === 'Open' || t.Status === 'New');
        break;
      case 'inProgress':
        filtered = dataToFilter.filter(t => t.Status === 'In Progress');
        break;
      case 'resolved':
        filtered = dataToFilter.filter(t => t.Status === 'Resolved' || t.Status === 'Closed');
        break;
    }

    setTickets(filtered);
    setActiveFilter(filter);
  };

  const handleStatusChange = async (ticketId: number, newStatus: TicketStatus): Promise<void> => {
    try {
      await TicketService.updateTicketStatus(ticketId, newStatus);
      await loadData(); // Reload to update stats and list
    } catch (err) {
      console.error('Error updating ticket status:', err);
      alert('Failed to update ticket status. Please try again.');
    }
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (isLoading) {
    return <LoadingSpinner message="Loading technician dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
          Technician Dashboard 🛠️
        </h1>
        <p style={{ fontSize: '16px', color: '#94a3b8' }}>
          Welcome {currentUser?.DisplayName}! Manage and resolve support tickets
        </p>
      </div>

      {/* Stats Cards */}
      <div className={styles.grid4} style={{ marginBottom: '32px' }}>
        <div onClick={() => applyFilter('assignedToMe')} style={{ cursor: 'pointer' }}>
          <StatCard
            label="Assigned to Me"
            value={stats.assignedToMe}
            icon="👤"
            color="#3b82f6"
            isActive={activeFilter === 'assignedToMe'}
          />
        </div>
        <div onClick={() => applyFilter('open')} style={{ cursor: 'pointer' }}>
          <StatCard
            label="Open Tickets"
            value={stats.open}
            icon="📂"
            color="#0d9488"
            isActive={activeFilter === 'open'}
          />
        </div>
        <div onClick={() => applyFilter('inProgress')} style={{ cursor: 'pointer' }}>
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon="⚙️"
            color="#f59e0b"
            isActive={activeFilter === 'inProgress'}
          />
        </div>
        <div onClick={() => applyFilter('resolved')} style={{ cursor: 'pointer' }}>
          <StatCard
            label="Resolved"
            value={stats.resolved}
            icon="✅"
            color="#10b981"
            isActive={activeFilter === 'resolved'}
          />
        </div>
      </div>

      {/* Notifications */}
      {unreadConversations > 0 && (
        <Card style={{ marginBottom: '24px', backgroundColor: '#1e3a8a', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>💬</span>
              <div>
                <div style={{ fontWeight: 600, color: 'white' }}>
                  You have {unreadConversations} unread conversation{unreadConversations > 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                  Click on tickets to view and respond
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'white' }}>
          {activeFilter === 'assignedToMe' && 'My Assigned Tickets'}
          {activeFilter === 'open' && 'Open Tickets'}
          {activeFilter === 'inProgress' && 'In Progress Tickets'}
          {activeFilter === 'resolved' && 'Resolved Tickets'}
        </h2>
      </div>

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
              No Tickets Found
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              No tickets match the selected filter
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th className={styles.tableHeaderCell}>Ticket #</th>
                  <th className={styles.tableHeaderCell}>Subject</th>
                  <th className={styles.tableHeaderCell}>Requester</th>
                  <th className={styles.tableHeaderCell}>Priority</th>
                  <th className={styles.tableHeaderCell}>Status</th>
                  <th className={styles.tableHeaderCell}>SLA</th>
                  <th className={styles.tableHeaderCell}>Created</th>
                  <th className={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.Id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <span
                        style={{ fontWeight: 600, color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => onNavigate(`/ticket/${ticket.Id}`)}
                      >
                        {ticket.TicketNumber}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <div style={{ maxWidth: '300px' }} title={`${ticket.Title}\n\n${ticket.Description?.replace(/<[^>]*>/g, '')}`}>
                        <div style={{ fontWeight: 500, color: 'white', marginBottom: '4px' }}>
                          {ticket.Title}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#94a3b8',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {ticket.Description?.replace(/<[^>]*>/g, '').substring(0, 60)}...
                        </div>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                        {ticket.RequesterName || 'N/A'}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <Badge text={ticket.Priority} type="priority" value={ticket.Priority} />
                    </td>
                    <td className={styles.tableCell}>
                      <select
                        value={ticket.Status}
                        onChange={(e) => handleStatusChange(ticket.Id, e.target.value as TicketStatus)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #334155',
                          backgroundColor: '#1e293b',
                          color: 'white',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="New">New</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Waiting">Waiting</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td className={styles.tableCell}>
                      <Badge text={ticket.SLAStatus || 'Pending'} type="sla" value={ticket.SLAStatus || 'Pending'} />
                    </td>
                    <td className={styles.tableCell}>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                        {SLACalculator.formatRelativeTime(ticket.Created)}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setAssignModalTicket(ticket)}
                      >
                        Reassign
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Assign Ticket Modal */}
      {assignModalTicket && (
        <AssignTicketModal
          ticketId={assignModalTicket.Id}
          ticketTitle={assignModalTicket.Title}
          currentAssigneeId={assignModalTicket.AssignedToId}
          currentAssigneeName={assignModalTicket.AssignedToName}
          onClose={() => setAssignModalTicket(null)}
          onAssigned={() => {
            setAssignModalTicket(null);
            void loadData();
          }}
        />
      )}
    </div>
  );
};
