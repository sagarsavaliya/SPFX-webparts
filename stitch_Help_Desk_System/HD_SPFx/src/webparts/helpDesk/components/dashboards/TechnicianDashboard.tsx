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
import { Footer } from '../shared/Footer';
import { AssignTicketModal } from '../modals/AssignTicketModal';
import commonStyles from '../../styles/common.module.scss';
import styles from './TechnicianDashboard.module.scss';
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
    <div>
      <div className={styles.dashboard}>
        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>
            Technician Dashboard 🛠️
          </h1>
          <p className={styles.welcomeSubtitle}>
            Welcome {currentUser?.DisplayName}! Manage and resolve support tickets
          </p>
        </div>

        {/* Stats Cards */}
        <div className={styles.filterGrid}>
          <div onClick={() => applyFilter('assignedToMe')} className={styles.filterCard}>
            <StatCard
              label="Assigned to Me"
              value={stats.assignedToMe}
              icon="👤"
              color="#3b82f6"
              isActive={activeFilter === 'assignedToMe'}
            />
          </div>
          <div onClick={() => applyFilter('open')} className={styles.filterCard}>
            <StatCard
              label="Open Tickets"
              value={stats.open}
              icon="📂"
              color="#0d9488"
              isActive={activeFilter === 'open'}
            />
          </div>
          <div onClick={() => applyFilter('inProgress')} className={styles.filterCard}>
            <StatCard
              label="In Progress"
              value={stats.inProgress}
              icon="⚙️"
              color="#f59e0b"
              isActive={activeFilter === 'inProgress'}
            />
          </div>
          <div onClick={() => applyFilter('resolved')} className={styles.filterCard}>
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
          <Card className={styles.notificationBanner}>
            <div className={styles.notificationContent}>
              <div className={styles.notificationLeft}>
                <span className={styles.notificationIcon}>💬</span>
                <div>
                  <div className={styles.notificationTitle}>
                    You have {unreadConversations} unread conversation{unreadConversations > 1 ? 's' : ''}
                  </div>
                  <div className={styles.notificationDescription}>
                    Click on tickets to view and respond
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Action Bar */}
        <div className={styles.filtersSection}>
          <h2 className={styles.filtersTitle}>
            {activeFilter === 'assignedToMe' && 'My Assigned Tickets'}
            {activeFilter === 'open' && 'Open Tickets'}
            {activeFilter === 'inProgress' && 'In Progress Tickets'}
            {activeFilter === 'resolved' && 'Resolved Tickets'}
          </h2>
        </div>

        {/* Tickets Table */}
        {tickets.length === 0 ? (
          <Card>
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🎫</div>
              <h3 className={styles.emptyStateTitle}>
                No Tickets Found
              </h3>
              <p className={styles.emptyStateDescription}>
                No tickets match the selected filter
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className={styles.tableContainer}>
              <table className={commonStyles.table}>
                <thead className={commonStyles.tableHeader}>
                  <tr>
                    <th className={commonStyles.tableHeaderCell}>Ticket #</th>
                    <th className={commonStyles.tableHeaderCell}>Subject</th>
                    <th className={commonStyles.tableHeaderCell}>Requester</th>
                    <th className={commonStyles.tableHeaderCell}>Priority</th>
                    <th className={commonStyles.tableHeaderCell}>Status</th>
                    <th className={commonStyles.tableHeaderCell}>SLA</th>
                    <th className={commonStyles.tableHeaderCell}>Created</th>
                    <th className={commonStyles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.Id} className={commonStyles.tableRow}>
                      <td className={commonStyles.tableCell}>
                        <span
                          className={styles.ticketNumber}
                          onClick={() => onNavigate(`/ticket/${ticket.Id}`)}
                        >
                          {ticket.TicketNumber}
                        </span>
                      </td>
                      <td className={commonStyles.tableCell}>
                        <div className={styles.subjectCell} title={`${ticket.Title}\n\n${ticket.Description?.replace(/<[^>]*>/g, '')}`}>
                          <div className={styles.subjectTitle}>
                            {ticket.Title}
                          </div>
                          <div className={styles.subjectDescription}>
                            {ticket.Description?.replace(/<[^>]*>/g, '').substring(0, 60)}...
                          </div>
                        </div>
                      </td>
                      <td className={commonStyles.tableCell}>
                        <span className={styles.categoryText}>
                          {ticket.RequesterName || 'N/A'}
                        </span>
                      </td>
                      <td className={commonStyles.tableCell}>
                        <Badge text={ticket.Priority} type="priority" value={ticket.Priority} />
                      </td>
                      <td className={commonStyles.tableCell}>
                        <select
                          value={ticket.Status}
                          onChange={(e) => handleStatusChange(ticket.Id, e.target.value as TicketStatus)}
                          className={styles.statusSelect}
                        >
                          <option value="New">New</option>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Waiting">Waiting</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className={commonStyles.tableCell}>
                        <Badge text={ticket.SLAStatus || 'Pending'} type="sla" value={ticket.SLAStatus || 'Pending'} />
                      </td>
                      <td className={commonStyles.tableCell}>
                        <span className={styles.dateText}>
                          {SLACalculator.formatRelativeTime(ticket.Created)}
                        </span>
                      </td>
                      <td className={commonStyles.tableCell}>
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
      <Footer />
    </div>
  );
};
