import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { TicketService } from '../../services';
import { ITicket } from '../../models';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';
import { Card } from '../shared/Card';
import styles from '../../styles/common.module.scss';
import { SLACalculator } from '../../utils/SLACalculator';

interface IMyTicketsPageProps {
  onNavigate: (route: string) => void;
}

type StatusFilter = 'All' | 'Open' | 'In Progress' | 'Resolved' | 'Closed';
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
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>
            My Tickets
          </h1>
          <Button onClick={() => onNavigate('/ticket/new')}>
            + Create New Ticket
          </Button>
        </div>
        <p style={{ fontSize: '16px', color: '#94a3b8' }}>
          Manage all your support tickets in one place
        </p>
      </div>

      {/* Filters Section */}
      <Card style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'end' }}>
            {/* Search */}
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '8px' }}>
                Search
              </label>
              <input
                type="text"
                placeholder="Search by ticket #, subject, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.input}
                style={{ width: '100%' }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ flex: '0 1 180px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '8px' }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className={styles.select}
                style={{ width: '100%' }}
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div style={{ flex: '0 1 180px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '8px' }}>
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className={styles.select}
                style={{ width: '100%' }}
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
              <div style={{ flex: '0 1 auto' }}>
                <Button onClick={resetFilters} variant="secondary" size="small">
                  Reset Filters
                </Button>
              </div>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Active filters:</span>
                {statusFilter !== 'All' && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'white'
                  }}>
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter('All')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </span>
                )}
                {priorityFilter !== 'All' && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'white'
                  }}>
                    Priority: {priorityFilter}
                    <button
                      onClick={() => setPriorityFilter('All')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchQuery.trim() && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'white'
                  }}>
                    Search: &quot;{searchQuery}&quot;
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Count */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>
          {filteredTickets.length === allTickets.length
            ? `Showing all ${filteredTickets.length} ticket${filteredTickets.length !== 1 ? 's' : ''}`
            : `Showing ${filteredTickets.length} of ${allTickets.length} ticket${allTickets.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Tickets Table */}
      {filteredTickets.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {hasActiveFilters ? '🔍' : '🎫'}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
              {hasActiveFilters ? 'No Tickets Found' : 'No Tickets Yet'}
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>
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
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th className={styles.tableHeaderCell}>Ticket #</th>
                  <th className={styles.tableHeaderCell}>Subject</th>
                  <th className={styles.tableHeaderCell}>Category</th>
                  <th className={styles.tableHeaderCell}>Status</th>
                  <th className={styles.tableHeaderCell}>Priority</th>
                  <th className={styles.tableHeaderCell}>Assigned To</th>
                  <th className={styles.tableHeaderCell}>Last Updated</th>
                  <th className={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
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
                        {ticket.AssignedToName || 'Unassigned'}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                        {SLACalculator.formatRelativeTime(ticket.Modified)}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
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
