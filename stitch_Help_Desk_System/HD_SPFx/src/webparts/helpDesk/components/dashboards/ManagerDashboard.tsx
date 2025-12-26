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
import { Footer } from '../shared/Footer';
import { AssignTicketModal } from '../modals/AssignTicketModal';
import commonStyles from '../../styles/common.module.scss';
import styles from './ManagerDashboard.module.scss';
import { SLACalculator } from '../../utils/SLACalculator';

interface IManagerDashboardProps {
  onNavigate: (route: string) => void;
}

type TicketFilter = 'all' | 'unassigned' | 'slaAtRisk' | 'open' | 'resolved';

interface ITechnicianPerformance {
  technicianId: number;
  technicianName: string;
  activeTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  slaCompliance: number;
}

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
  const [technicianPerformance, setTechnicianPerformance] = useState<ITechnicianPerformance[]>([]);

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

      // Calculate technician performance
      const performanceMap = new Map<number, ITechnicianPerformance>();

      allTicketsData.forEach(ticket => {
        if (ticket.AssignedToId && ticket.AssignedToName) {
          if (!performanceMap.has(ticket.AssignedToId)) {
            performanceMap.set(ticket.AssignedToId, {
              technicianId: ticket.AssignedToId,
              technicianName: ticket.AssignedToName,
              activeTickets: 0,
              resolvedTickets: 0,
              avgResolutionTime: 0,
              slaCompliance: 0
            });
          }

          const perf = performanceMap.get(ticket.AssignedToId)!;

          // Count active tickets
          if (ticket.Status !== 'Resolved' && ticket.Status !== 'Closed') {
            perf.activeTickets++;
          }

          // Count resolved tickets
          if (ticket.Status === 'Resolved' || ticket.Status === 'Closed') {
            perf.resolvedTickets++;
          }
        }
      });

      // Calculate average resolution time and SLA compliance
      performanceMap.forEach((perf) => {
        const technicianTickets = allTicketsData.filter(
          t => t.AssignedToId === perf.technicianId && (t.Status === 'Resolved' || t.Status === 'Closed')
        );

        if (technicianTickets.length > 0) {
          // Average resolution time
          const totalResolutionTime = technicianTickets.reduce(
            (sum, t) => sum + (t.ResolutionTime || 0),
            0
          );
          perf.avgResolutionTime = totalResolutionTime / technicianTickets.length;

          // SLA compliance rate
          const metSLA = technicianTickets.filter(
            t => t.SLAStatus === 'Met' || (t.ResolvedDate && t.SLADueDate && t.ResolvedDate <= t.SLADueDate)
          ).length;
          perf.slaCompliance = (metSLA / technicianTickets.length) * 100;
        }
      });

      const performanceArray: ITechnicianPerformance[] = [];
      performanceMap.forEach(perf => performanceArray.push(perf));
      performanceArray.sort((a, b) => b.resolvedTickets - a.resolvedTickets);

      setTechnicianPerformance(performanceArray);

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

  return (<div>
    <div className={styles.dashboard}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <h1 className={styles.welcomeTitle}>
          Manager Dashboard 📊
        </h1>
        <p className={styles.welcomeSubtitle}>
          Welcome {currentUser?.DisplayName}! Complete oversight of help desk operations
        </p>
      </div>

      {/* Stats Cards */}
      <div className={styles.filterGrid}>
        <div onClick={() => applyFilter('all')} className={styles.filterCard}>
          <StatCard
            label="Total Tickets"
            value={stats.total}
            icon="📊"
            color="#3b82f6"
            isActive={activeFilter === 'all'}
          />
        </div>
        <div onClick={() => applyFilter('unassigned')} className={styles.filterCard}>
          <StatCard
            label="Unassigned"
            value={stats.unassigned}
            icon="⚠️"
            color="#ef4444"
            isActive={activeFilter === 'unassigned'}
          />
        </div>
        <div onClick={() => applyFilter('slaAtRisk')} className={styles.filterCard}>
          <StatCard
            label="SLA At Risk"
            value={stats.slaAtRisk}
            icon="🔥"
            color="#f59e0b"
            isActive={activeFilter === 'slaAtRisk'}
          />
        </div>
        <div onClick={() => applyFilter('open')} className={styles.filterCard}>
          <StatCard
            label="Active"
            value={stats.open}
            icon="📂"
            color="#0d9488"
            isActive={activeFilter === 'open'}
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

      {/* Team Performance Analytics */}
      {technicianPerformance.length > 0 && (
        <Card className={styles.performanceCard}>
          <div className={styles.performanceHeader}>
            <h2 className={styles.performanceTitle}>
              👥 Team Performance
            </h2>
            <p className={styles.performanceSubtitle}>
              Overview of technician productivity and efficiency
            </p>
          </div>

          <div className={styles.performanceGrid}>
            {technicianPerformance.slice(0, 5).map((perf) => (
              <div key={perf.technicianId} className={styles.performanceItem}>
                <div className={styles.performanceItemHeader}>
                  <div className={styles.technicianAvatar}>
                    {perf.technicianName.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.technicianInfo}>
                    <div className={styles.technicianName}>
                      {perf.technicianName}
                    </div>
                    <div className={styles.technicianStats}>
                      {perf.activeTickets} active • {perf.resolvedTickets} resolved
                    </div>
                  </div>
                </div>

                <div className={styles.performanceMetrics}>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Avg. Resolution</span>
                    <span className={styles.metricValue}>
                      {perf.avgResolutionTime > 0
                        ? `${Math.round(perf.avgResolutionTime)}h`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>SLA Compliance</span>
                    <span className={`${styles.metricValue} ${perf.slaCompliance >= 90
                        ? styles.complianceHigh
                        : perf.slaCompliance >= 75
                          ? styles.complianceMedium
                          : styles.complianceLow
                      }`}>
                      {perf.resolvedTickets > 0
                        ? `${Math.round(perf.slaCompliance)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Alert for unassigned or SLA at risk tickets */}
      {(stats.unassigned > 0 || stats.slaAtRisk > 0) && (
        <Card className={styles.alertBanner}>
          <div className={styles.alertContent}>
            <div className={styles.alertTitle}>
              ⚠️ Action Required
            </div>
            <div className={styles.alertDescription}>
              {stats.unassigned > 0 && `${stats.unassigned} unassigned ticket(s) need attention. `}
              {stats.slaAtRisk > 0 && `${stats.slaAtRisk} ticket(s) are at risk of SLA breach.`}
            </div>
          </div>
        </Card>
      )}

      {/* Action Bar */}
      <div className={styles.filtersSection}>
        <h2 className={styles.filtersTitle}>
          {activeFilter === 'all' && 'All Tickets'}
          {activeFilter === 'unassigned' && 'Unassigned Tickets'}
          {activeFilter === 'slaAtRisk' && 'SLA At Risk Tickets'}
          {activeFilter === 'open' && 'Active Tickets'}
          {activeFilter === 'resolved' && 'Resolved Tickets'}
        </h2>
        <div className={styles.filterActions}>
          <Button onClick={() => onNavigate('/ticket/new')}>
            + Create Ticket
          </Button>
        </div>
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
                  <th className={commonStyles.tableHeaderCell}>Assigned To</th>
                  <th className={commonStyles.tableHeaderCell}>Priority</th>
                  <th className={commonStyles.tableHeaderCell}>Status</th>
                  <th className={commonStyles.tableHeaderCell}>SLA Status</th>
                  <th className={commonStyles.tableHeaderCell}>Time</th>
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
                      <span className={ticket.AssignedToName ? styles.assignedText : styles.unassignedText}>
                        {ticket.AssignedToName || 'Unassigned'}
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
                      <span className={`${styles.slaTimeText} ${(ticket.Status === 'Resolved' || ticket.Status === 'Closed')
                          ? styles.completedTime
                          : ticket.SLAStatus === 'Breached'
                            ? styles.breachedTime
                            : ticket.SLAStatus === 'At Risk'
                              ? styles.atRiskTime
                              : styles.normalTime
                        }`}>
                        {SLACalculator.formatSLATimeForTable({
                          Created: ticket.Created,
                          ResolvedDate: ticket.ResolvedDate,
                          SLADueDate: ticket.SLADueDate,
                          Status: ticket.Status,
                          ResolutionTime: ticket.ResolutionTime
                        })}
                      </span>
                    </td>
                    <td className={commonStyles.tableCell}>
                      <span className={styles.dateText}>
                        {SLACalculator.formatRelativeTime(ticket.Created)}
                      </span>
                    </td>
                    <td className={commonStyles.tableCell}>
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => setAssignModalTicket(ticket)}
                        disabled={ticket.Status === 'Closed' || ticket.Status === 'Resolved'}
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
    <Footer />
  </div>
  );
};
