import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TicketService } from '../../services';
import { ITicket, ITicketStats } from '../../models';
import { StatCard } from '../shared/StatCard';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';
import { Card } from '../shared/Card';
import { Footer } from '../shared/Footer';
import commonStyles from '../../styles/common.module.scss';
import styles from './UserDashboard.module.scss';
import { SLACalculator } from '../../utils/SLACalculator';

interface IUserDashboardProps {
  onNavigate: (route: string) => void;
}

/**
 * User Dashboard Component
 * Overview dashboard for end users showing stats and recent tickets
 */
export const UserDashboard: React.FC<IUserDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAppContext();
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [stats, setStats] = useState<ITicketStats | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [pendingResponseCount, setPendingResponseCount] = useState(0);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(undefined);

      // Regular users see only their own tickets - limit to recent 10 for dashboard
      const userTickets = await TicketService.getTickets({ createdByMe: true });

      // Sort by last modified date (most recent first) and take only 10
      const recentTickets = userTickets
        .sort((a, b) => new Date(b.Modified).getTime() - new Date(a.Modified).getTime())
        .slice(0, 10);

      setTickets(recentTickets);

      // Calculate pending response count (tickets in Open, In Progress, or Waiting status)
      // Waiting tickets are especially important as they need user's response
      const pendingCount = userTickets.filter(t =>
        t.Status === 'Open' || t.Status === 'In Progress' || t.Status === 'Waiting'
      ).length;
      setPendingResponseCount(pendingCount);

      // Load stats
      const ticketStats = await TicketService.getTicketStats(currentUser?.Id);
      setStats(ticketStats);

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
      setIsLoading(false);
    }
  }, [currentUser?.Id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (isLoading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
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
            Welcome back, {currentUser?.DisplayName}! 👋
          </h1>
          <p className={styles.welcomeSubtitle}>
            Here&apos;s an overview of your support tickets
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className={`${commonStyles.grid4} ${styles.statsSection}`}>
            <StatCard label="Total Tickets" value={stats.total} icon="📊" color="#3b82f6" />
            <StatCard label="Open" value={stats.open} icon="📂" color="#0d9488" />
            <StatCard label="In Progress" value={stats.inProgress} icon="⚙️" color="#f59e0b" />
            <StatCard label="Resolved" value={stats.resolved} icon="✅" color="#10b981" />
          </div>
        )}

        {/* Quick Actions */}
        <div className={`${commonStyles.grid3} ${styles.quickActionsSection}`}>
          <Card>
            <div className={styles.quickActionCard}>
              <div className={styles.quickActionIcon}>🎫</div>
              <h3 className={styles.quickActionTitle}>
                Create Ticket
              </h3>
              <p className={styles.quickActionDescription}>
                Submit a new support request
              </p>
              <Button onClick={() => onNavigate('/ticket/new')} size="small">
                New Ticket
              </Button>
            </div>
          </Card>

          <Card>
            <div className={styles.quickActionCard}>
              <div className={styles.quickActionIcon}>📋</div>
              <h3 className={styles.quickActionTitle}>
                Active Tickets
              </h3>
              <p className={styles.quickActionDescription}>
                {pendingResponseCount} ticket{pendingResponseCount !== 1 ? 's' : ''} need{pendingResponseCount === 1 ? 's' : ''} attention
              </p>
              <Button onClick={() => onNavigate('/my-tickets')} variant="secondary" size="small">
                View All
              </Button>
            </div>
          </Card>

          <Card>
            <div className={styles.quickActionCard}>
              <div className={styles.quickActionIcon}>📚</div>
              <h3 className={styles.quickActionTitle}>
                Knowledge Base
              </h3>
              <p className={styles.quickActionDescription}>
                Find answers to common questions
              </p>
              <Button onClick={() => onNavigate('/kb')} variant="secondary" size="small">
                Browse KB
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Tickets Section */}
        <div className={styles.recentTicketsHeader}>
          <h2 className={styles.recentTicketsTitle}>Recent Tickets</h2>
          <Button onClick={() => onNavigate('/my-tickets')} variant="secondary" size="small">
            View All Tickets →
          </Button>
        </div>

        {/* Tickets Table */}
        {tickets.length === 0 ? (
          <Card>
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🎫</div>
              <h3 className={styles.emptyStateTitle}>
                No Tickets Yet
              </h3>
              <p className={styles.emptyStateDescription}>
                Create your first support ticket to get started
              </p>
              <Button onClick={() => onNavigate('/ticket/new')}>Create Ticket</Button>
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
                    <th className={commonStyles.tableHeaderCell}>Category</th>
                    <th className={commonStyles.tableHeaderCell}>Status</th>
                    <th className={commonStyles.tableHeaderCell}>Priority</th>
                    <th className={commonStyles.tableHeaderCell}>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.Id} className={`${commonStyles.tableRow} ${ticket.Status === 'Waiting' ? styles.waitingRow : ''}`}>
                      <td className={commonStyles.tableCell}>
                        <span
                          className={styles.ticketNumber}
                          onClick={() => onNavigate(`/ticket/${ticket.Id}`)}
                        >
                          {ticket.TicketNumber}
                        </span>
                        {ticket.Status === 'Waiting' && (
                          <div className={styles.waitingIndicator}>
                            Needs your response
                          </div>
                        )}
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
                          {ticket.CategoryTitle || 'N/A'}
                        </span>
                      </td>
                      <td className={commonStyles.tableCell}>
                        <Badge text={ticket.Status} type="status" value={ticket.Status} />
                      </td>
                      <td className={commonStyles.tableCell}>
                        <Badge text={ticket.Priority} type="priority" value={ticket.Priority} />
                      </td>
                      <td className={commonStyles.tableCell}>
                        <span className={styles.dateText}>
                          {SLACalculator.formatRelativeTime(ticket.Created)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </div>
      <Footer />
    </div>
  );
};
