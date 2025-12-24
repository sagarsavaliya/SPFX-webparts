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
import styles from '../../styles/common.module.scss';
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

      // Calculate pending response count (tickets in Open or In Progress status)
      const pendingCount = userTickets.filter(t =>
        t.Status === 'Open' || t.Status === 'In Progress'
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
    <div style={{ padding: '24px' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
          Welcome back, {currentUser?.DisplayName}! 👋
        </h1>
        <p style={{ fontSize: '16px', color: '#94a3b8' }}>
          Here&apos;s an overview of your support tickets
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={styles.grid4} style={{ marginBottom: '32px' }}>
          <StatCard label="Total Tickets" value={stats.total} icon="📊" color="#3b82f6" />
          <StatCard label="Open" value={stats.open} icon="📂" color="#0d9488" />
          <StatCard label="In Progress" value={stats.inProgress} icon="⚙️" color="#f59e0b" />
          <StatCard label="Resolved" value={stats.resolved} icon="✅" color="#10b981" />
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.grid3} style={{ marginBottom: '32px' }}>
        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎫</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
              Create Ticket
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Submit a new support request
            </p>
            <Button onClick={() => onNavigate('/ticket/new')} size="small">
              New Ticket
            </Button>
          </div>
        </Card>

        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
              Active Tickets
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              {pendingResponseCount} ticket{pendingResponseCount !== 1 ? 's' : ''} need{pendingResponseCount === 1 ? 's' : ''} attention
            </p>
            <Button onClick={() => onNavigate('/my-tickets')} variant="secondary" size="small">
              View All
            </Button>
          </div>
        </Card>

        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📚</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
              Knowledge Base
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Find answers to common questions
            </p>
            <Button onClick={() => onNavigate('/kb')} variant="secondary" size="small">
              Browse KB
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Tickets Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'white' }}>Recent Tickets</h2>
        <Button onClick={() => onNavigate('/my-tickets')} variant="secondary" size="small">
          View All Tickets →
        </Button>
      </div>

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
              No Tickets Yet
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>
              Create your first support ticket to get started
            </p>
            <Button onClick={() => onNavigate('/ticket/new')}>Create Ticket</Button>
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
                  <th className={styles.tableHeaderCell}>Category</th>
                  <th className={styles.tableHeaderCell}>Status</th>
                  <th className={styles.tableHeaderCell}>Priority</th>
                  <th className={styles.tableHeaderCell}>Last Updated</th>
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
                        {ticket.CategoryTitle || 'N/A'}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <Badge text={ticket.Status} type="status" value={ticket.Status} />
                    </td>
                    <td className={styles.tableCell}>
                      <Badge text={ticket.Priority} type="priority" value={ticket.Priority} />
                    </td>
                    <td className={styles.tableCell}>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>
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
  );
};
