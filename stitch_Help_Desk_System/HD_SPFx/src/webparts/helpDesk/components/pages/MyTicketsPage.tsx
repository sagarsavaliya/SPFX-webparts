import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { TicketService } from '../../services';
import { ITicket } from '../../models';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';
import { Card } from '../shared/Card';
import commonStyles from '../../styles/common.module.scss';
import styles from './MyTicketsPage.module.scss';
import { SLACalculator } from '../../utils/SLACalculator';

interface IMyTicketsPageProps {
  onNavigate: (route: string) => void;
}

type StatusFilter = 'All' | 'Open' | 'In Progress' | 'Waiting' | 'Resolved' | 'Closed';
type PriorityFilter = 'All' | 'Low' | 'Medium' | 'High' | 'Critical';

/**
 * My Tickets Page Component
 * Complete ticket management interface with filtering and search
 */
export const MyTicketsPage: React.FC<IMyTicketsPageProps> = ({ onNavigate }) => {
  const [allTickets, setAllTickets] = useState<ITicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<ITicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTickets = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(undefined);

      // Load all user's tickets
      const userTickets = await TicketService.getTickets({ createdByMe: true });

      // Sort by last modified date (most recent first)
      const sortedTickets = userTickets.sort(
        (a, b) => new Date(b.Modified).getTime() - new Date(a.Modified).getTime()
      );

      setAllTickets(sortedTickets);
      setFilteredTickets(sortedTickets);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError('Failed to load tickets. Please try again.');
      setIsLoading(false);
    }
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = [...allTickets];

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(ticket => ticket.Status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'All') {
      filtered = filtered.filter(ticket => ticket.Priority === priorityFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.TicketNumber?.toLowerCase().includes(query) ||
        ticket.Title?.toLowerCase().includes(query) ||
        ticket.Description?.toLowerCase().includes(query) ||
        ticket.CategoryTitle?.toLowerCase().includes(query)
      );
    }

    setFilteredTickets(filtered);
  }, [allTickets, statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    loadTickets().catch(err => console.error('Failed to load tickets:', err));
  }, [loadTickets]);

  const resetFilters = (): void => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setSearchQuery('');
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your tickets..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadTickets} />;
  }

  const hasActiveFilters = statusFilter !== 'All' || priorityFilter !== 'All' || searchQuery.trim() !== '';

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.pageTitle}>
            My Tickets
          </h1>
          <Button onClick={() => onNavigate('/ticket/new')}>
            + Create New Ticket
          </Button>
        </div>
        <p className={styles.pageSubtitle}>
          Manage all your support tickets in one place
        </p>
      </div>

      {/* Filters Section */}
      <Card className={styles.filtersCard}>
        <div>
          <div className={styles.filtersRow}>
            {/* Search */}
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>
                Search
              </label>
              <input
                type="text"
                placeholder="Search by ticket #, subject, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${commonStyles.input} ${styles.fullWidth}`}
              />
            </div>

            {/* Status Filter */}
            <div className={styles.filterFieldNarrow}>
              <label className={styles.filterLabel}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className={`${commonStyles.select} ${styles.fullWidth}`}
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting">Waiting</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className={styles.filterFieldNarrow}>
              <label className={styles.filterLabel}>
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className={`${commonStyles.select} ${styles.fullWidth}`}
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <div className={styles.filterFieldAuto}>
                <Button onClick={resetFilters} variant="secondary" size="small">
                  Reset Filters
                </Button>
              </div>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className={styles.filtersSummary}>
              <div className={styles.filtersRow}>
                <span className={styles.filtersSummaryLabel}>Active filters:</span>
                {statusFilter !== 'All' && (
                  <span className={styles.filterTag}>
                    Status: {statusFilter}
                    <span
                      onClick={() => setStatusFilter('All')}
                      className={styles.filterTagRemove}
                    >
                      ×
                    </span>
                  </span>
                )}
                {priorityFilter !== 'All' && (
                  <span className={styles.filterTag}>
                    Priority: {priorityFilter}
                    <span
                      onClick={() => setPriorityFilter('All')}
                      className={styles.filterTagRemove}
                    >
                      ×
                    </span>
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className={styles.filterTag}>
                    Search: &quot;{searchQuery}&quot;
                    <span
                      onClick={() => setSearchQuery('')}
                      className={styles.filterTagRemove}
                    >
                      ×
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Count */}
      <div className={styles.resultsHeader}>
        <p className={styles.resultsCount}>
          {filteredTickets.length === allTickets.length
            ? `Showing all ${filteredTickets.length} ticket${filteredTickets.length !== 1 ? 's' : ''}`
            : `Showing ${filteredTickets.length} of ${allTickets.length} ticket${allTickets.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Tickets Table */}
      {filteredTickets.length === 0 ? (
        <Card>
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              {hasActiveFilters ? '🔍' : '🎫'}
            </div>
            <h3 className={styles.emptyStateTitle}>
              {hasActiveFilters ? 'No Tickets Found' : 'No Tickets Yet'}
            </h3>
            <p className={styles.emptyStateDescription}>
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results'
                : 'Create your first support ticket to get started'
              }
            </p>
            {hasActiveFilters ? (
              <Button onClick={resetFilters} variant="secondary">
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => onNavigate('/ticket/new')}>
                Create Ticket
              </Button>
            )}
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
                  <th className={commonStyles.tableHeaderCell}>Assigned To</th>
                  <th className={commonStyles.tableHeaderCell}>Last Updated</th>
                  <th className={commonStyles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
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
                      <span className={styles.assignedText}>
                        {ticket.AssignedToName || 'Unassigned'}
                      </span>
                    </td>
                    <td className={commonStyles.tableCell}>
                      <span className={styles.dateText}>
                        {SLACalculator.formatRelativeTime(ticket.Modified)}
                      </span>
                    </td>
                    <td className={commonStyles.tableCell}>
                      <Button
                        onClick={() => onNavigate(`/ticket/${ticket.Id}`)}
                        variant="secondary"
                        size="small"
                      >
                        View
                      </Button>
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
