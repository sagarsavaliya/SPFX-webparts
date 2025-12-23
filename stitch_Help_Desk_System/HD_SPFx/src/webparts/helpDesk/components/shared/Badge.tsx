import * as React from 'react';
import styles from '../../styles/common.module.scss';
import { TicketStatus, TicketPriority } from '../../models';

interface IBadgeProps {
  text: string;
  type: 'status' | 'priority' | 'sla';
  value: TicketStatus | TicketPriority | string;
}

/**
 * Badge Component
 * Status and priority badges with color coding
 */
export const Badge: React.FC<IBadgeProps> = ({ text, type, value }) => {
  const getBadgeClass = (): string => {
    if (type === 'status') {
      switch (value) {
        case TicketStatus.New:
          return styles.badgeNew;
        case TicketStatus.Open:
          return styles.badgeOpen;
        case TicketStatus.InProgress:
          return styles.badgeInProgress;
        case TicketStatus.Resolved:
          return styles.badgeResolved;
        case TicketStatus.Closed:
          return styles.badgeClosed;
        default:
          return styles.badge;
      }
    } else if (type === 'priority') {
      switch (value) {
        case TicketPriority.Low:
          return styles.badgeLow;
        case TicketPriority.Medium:
          return styles.badgeMedium;
        case TicketPriority.High:
          return styles.badgeHigh;
        case TicketPriority.Critical:
          return styles.badgeCritical;
        default:
          return styles.badge;
      }
    } else {
      // SLA Status
      switch (value) {
        case 'Met':
          return styles.badgeResolved;
        case 'At Risk':
          return styles.badgeInProgress;
        case 'Breached':
          return styles.badgeCritical;
        case 'Pending':
        default:
          return styles.badge;
      }
    }
  };

  return <span className={getBadgeClass()}>{text}</span>;
};
