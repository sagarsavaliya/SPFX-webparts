import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TicketService } from '../../services';
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

interface IManagerDashboardProps {
  onNavigate: (route: string) => void;
}

type TicketFilter = 'all' | 'unassigned' | 'slaAtRisk' | 'open' | 'resolved';

/**
 * Manager Dashboard Component
 * Dashboard for managers with comprehensive oversight and analytics
 */
export const ManagerDashboard: React.FC<IManagerDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAppContext();
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [allTickets, setAllTickets] = useState<ITicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [assignModalTicket, setAssignModalTicket] = useState<ITicket | null>(null);
  const [activeFilter, setActiveFilter] = useState<TicketFilter>('all');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unassigned: 0,
    slaAtRisk: 0,
    open: 0,
    resolved: 0
  });

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(undefined);

      // Load all tickets
      const allTicketsData = await TicketService.getTickets();
      setAllTickets(allTicketsData);

      // Calculate stats
      const newStats = {
        total: allTicketsData.length,
        unassigned: allTicketsData.filter(t => !t.AssignedToId).length,
        slaAtRisk: allTicketsData.filter(t => t.SLAStatus === 'At Risk' || t.SLAStatus === 'Breached').length,
        open: allTicketsData.filter(t => t.Status === 'Open' || t.Status === 'New' || t.Status === 'In Progress').length,
        resolved: allTicketsData.filter(t => t.Status === 'Resolved' || t.Status === 'Closed').length
      };
      setStats(newStats);

      // Apply default filter (all tickets)
      applyFilter('all', allTicketsData);

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
      setIsLoading(false);
    }
  }, []);

  const applyFilter = (filter: TicketFilter, ticketsData?: ITicket[]): void => {
    const dataToFilter = ticketsData || allTickets;
    let filtered: ITicket[] = [];

    switch (filter) {
      case 'all':
        filtered = dataToFilter;
        break;
      case 'unassigned':
        filtered = dataToFilter.filter(t => !t.AssignedToId);
        break;
      case 'slaAtRisk':
        filtered = dataToFilter.filter(t => t.SLAStatus === 'At Risk' || t.SLAStatus === 'Breached');
        break;
      case 'open':
        filtered = dataToFilter.filter(t => t.Status === 'Open' || t.Status === 'New' || t.Status === 'In Progress');
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
      await loadData();
    } catch (err) {
      console.error('Error updating ticket status:', err);
      alert('Failed to update ticket status. Please try again.');
    }
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (isLoading) {
    return <LoadingSpinner message="Loading manager dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
          Manager Dashboard 📊
        </h1>
        <p style={{ fontSize: '16px', color: '#94a3b8' }}>
          Welcome {currentUser?.DisplayName}! Complete oversight of help desk operations
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div onClick={() => applyFilter('all')} style={{ cursor: 'pointer' }}>
          <StatCard
            label="Total Tickets"
            value={stats.total}
            icon="📊"
            color="#3b82f6"
            isActive={activeFilter === 'all'}
          />
        </div>
        <div onClick={() => applyFilter('unassigned')} style={{ cursor: 'pointer' }}>
          <StatCard
            label="Unassigned"
            value={stats.unassigned}
            icon="⚠️"
            color="#ef4444"
            isActive={activeFilter === 'unassigned'}
          />
        </div>
        <div onClick={() => applyFilter('slaAtRisk')} style={{ cursor: 'pointer' }}>
          <StatCard
            label="SLA At Risk"
            value={stats.slaAtRisk}
            icon="🔥"
            color="#f59e0b"
            isActive={activeFilter === 'slaAtRisk'}
          />
        </div>
        <div onClick={() => applyFilter('open')} style={{ cursor: 'pointer' }}>
          <StatCard
            label="Active"
            value={stats.open}
            icon="📂"
            color="#0d9488"
            isActive={activeFilter === 'open'}
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

      {/* Alert for unassigned or SLA at risk tickets */}
      {(stats.unassigned > 0 || stats.slaAtRisk > 0) && (
        <Card style={{ marginBottom: '24px', backgroundColor: '#7f1d1d', borderLeft: '4px solid #ef4444' }}>
          <div style={{ padding: '12px' }}>
            <div style={{ fontWeight: 600, color: 'white', marginBottom: '8px', fontSize: '16px' }}>
              ⚠️ Action Required
            </div>
            <div style={{ fontSize: '14px', color: '#fca5a5' }}>
              {stats.unassigned > 0 && `${stats.unassigned} unassigned ticket(s) need attention. `}
              {stats.slaAtRisk > 0 && `${stats.slaAtRisk} ticket(s) are at risk of SLA breach.`}
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
          {activeFilter === 'all' && 'All Tickets'}
          {activeFilter === 'unassigned' && 'Unassigned Tickets'}
          {activeFilter === 'slaAtRisk' && 'SLA At Risk Tickets'}
          {activeFilter === 'open' && 'Active Tickets'}
          {activeFilter === 'resolved' && 'Resolved Tickets'}
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={() => onNavigate('/kb')}>
            📚 Knowledge Base
          </Button>
          <Button onClick={() => onNavigate('/ticket/new')}>
            + Create Ticket
          </Button>
        </div>
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
                  <th className={styles.tableHeaderCell}>Assigned To</th>
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
                      <span style={{ fontSize: '13px', color: ticket.AssignedToName ? '#94a3b8' : '#ef4444' }}>
                        {ticket.AssignedToName || 'Unassigned'}
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
                        variant="primary"
                        size="small"
                        onClick={() => setAssignModalTicket(ticket)}
                      >
                        {ticket.AssignedToId ? 'Reassign' : 'Assign'}
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
