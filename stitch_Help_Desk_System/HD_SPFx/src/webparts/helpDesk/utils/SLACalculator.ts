import {
  addHours,
  differenceInMinutes,
  differenceInHours,
  isWeekend,
  addDays,
  setHours,
  setMinutes,
  isAfter,
  isBefore,
  format
} from 'date-fns';
import {
  ISLAConfig,
  ISLACalculation,
  ISLATimer,
  IWorkingHours
} from '../models';
import { SLA_DEFAULTS } from './Constants';

export class SLACalculator {
  /**
   * Calculate SLA due date based on ticket creation time and SLA config
   */
  public static calculateSLADueDate(
    createdDate: Date,
    slaConfig: ISLAConfig
  ): Date {
    const resolutionHours = slaConfig.ResolutionTimeHours;
    const workingHours: IWorkingHours = {
      startHour: slaConfig.WorkingHoursStart || SLA_DEFAULTS.WORKING_HOURS_START,
      endHour: slaConfig.WorkingHoursEnd || SLA_DEFAULTS.WORKING_HOURS_END,
      workingDays: SLA_DEFAULTS.WORKING_DAYS,
      excludeWeekends: slaConfig.ExcludeWeekends
    };

    return this.addBusinessHours(createdDate, resolutionHours, workingHours);
  }

  /**
   * Add business hours to a date
   */
  public static addBusinessHours(
    startDate: Date,
    hoursToAdd: number,
    workingHours: IWorkingHours
  ): Date {
    let currentDate = new Date(startDate);
    let hoursRemaining = hoursToAdd;

    while (hoursRemaining > 0) {
      // Skip weekends if configured
      if (workingHours.excludeWeekends && isWeekend(currentDate)) {
        currentDate = addDays(currentDate, 1);
        currentDate = setHours(currentDate, workingHours.startHour);
        currentDate = setMinutes(currentDate, 0);
        continue;
      }

      const currentHour = currentDate.getHours();

      // If before working hours, jump to start of working hours
      if (currentHour < workingHours.startHour) {
        currentDate = setHours(currentDate, workingHours.startHour);
        currentDate = setMinutes(currentDate, 0);
        continue;
      }

      // If after working hours, jump to next day start
      if (currentHour >= workingHours.endHour) {
        currentDate = addDays(currentDate, 1);
        currentDate = setHours(currentDate, workingHours.startHour);
        currentDate = setMinutes(currentDate, 0);
        continue;
      }

      // Calculate hours available today
      const endOfDay = setHours(setMinutes(new Date(currentDate), 0), workingHours.endHour);
      const hoursAvailableToday = differenceInHours(endOfDay, currentDate);

      if (hoursRemaining <= hoursAvailableToday) {
        // Can finish within today
        currentDate = addHours(currentDate, hoursRemaining);
        hoursRemaining = 0;
      } else {
        // Move to next working day
        hoursRemaining -= hoursAvailableToday;
        currentDate = addDays(currentDate, 1);
        currentDate = setHours(currentDate, workingHours.startHour);
        currentDate = setMinutes(currentDate, 0);
      }
    }

    return currentDate;
  }

  /**
   * Calculate business hours between two dates
   */
  public static calculateBusinessHours(
    startDate: Date,
    endDate: Date,
    workingHours: IWorkingHours
  ): number {
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    let totalHours = 0;

    while (isBefore(currentDate, end)) {
      // Skip weekends if configured
      if (workingHours.excludeWeekends && isWeekend(currentDate)) {
        currentDate = addDays(currentDate, 1);
        currentDate = setHours(currentDate, workingHours.startHour);
        currentDate = setMinutes(currentDate, 0);
        continue;
      }

      const currentHour = currentDate.getHours();

      // Skip non-working hours
      if (currentHour < workingHours.startHour) {
        currentDate = setHours(currentDate, workingHours.startHour);
        currentDate = setMinutes(currentDate, 0);
        continue;
      }

      if (currentHour >= workingHours.endHour) {
        currentDate = addDays(currentDate, 1);
        currentDate = setHours(currentDate, workingHours.startHour);
        currentDate = setMinutes(currentDate, 0);
        continue;
      }

      // Calculate hours for this working period
      const endOfDay = setHours(setMinutes(new Date(currentDate), 0), workingHours.endHour);
      const periodEnd = isBefore(end, endOfDay) ? end : endOfDay;

      const hoursThisPeriod = differenceInMinutes(periodEnd, currentDate) / 60;
      totalHours += hoursThisPeriod;

      if (isBefore(end, endOfDay)) {
        break;
      }

      // Move to next working day
      currentDate = addDays(currentDate, 1);
      currentDate = setHours(currentDate, workingHours.startHour);
      currentDate = setMinutes(currentDate, 0);
    }

    return totalHours;
  }

  /**
   * Calculate SLA status and timing information
   */
  public static calculateSLAStatus(
    ticket: {
      Created: Date;
      ResolvedDate?: Date;
      SLADueDate?: Date;
    },
    slaConfig: ISLAConfig
  ): ISLACalculation {
    const createdDate = new Date(ticket.Created);
    const resolvedDate = ticket.ResolvedDate ? new Date(ticket.ResolvedDate) : undefined;
    const slaDueDate = ticket.SLADueDate ? new Date(ticket.SLADueDate) :
      this.calculateSLADueDate(createdDate, slaConfig);

    const workingHours: IWorkingHours = {
      startHour: slaConfig.WorkingHoursStart || SLA_DEFAULTS.WORKING_HOURS_START,
      endHour: slaConfig.WorkingHoursEnd || SLA_DEFAULTS.WORKING_HOURS_END,
      workingDays: SLA_DEFAULTS.WORKING_DAYS,
      excludeWeekends: slaConfig.ExcludeWeekends
    };

    const now = new Date();
    const referenceDate = resolvedDate || now;

    // Calculate time elapsed
    const businessHoursElapsed = this.calculateBusinessHours(
      createdDate,
      referenceDate,
      workingHours
    );

    // Calculate time remaining
    const businessHoursRemaining = resolvedDate ? 0 :
      this.calculateBusinessHours(now, slaDueDate, workingHours);

    // Calculate total SLA time
    const totalSLAHours = slaConfig.ResolutionTimeHours;

    // Calculate percentage used
    const percentageUsed = (businessHoursElapsed / totalSLAHours) * 100;

    // Determine status
    let status: 'Met' | 'At Risk' | 'Breached' | 'Pending' = 'Pending';
    let isOverdue = false;

    if (resolvedDate) {
      // Ticket is resolved
      status = isBefore(resolvedDate, slaDueDate) || resolvedDate.getTime() === slaDueDate.getTime()
        ? 'Met'
        : 'Breached';
    } else {
      // Ticket is still open
      if (isAfter(now, slaDueDate)) {
        status = 'Breached';
        isOverdue = true;
      } else if (percentageUsed >= (SLA_DEFAULTS.CRITICAL_THRESHOLD * 100)) {
        status = 'At Risk';
      } else if (percentageUsed >= (SLA_DEFAULTS.AT_RISK_THRESHOLD * 100)) {
        status = 'At Risk';
      } else {
        status = 'Pending';
      }
    }

    return {
      slaConfig,
      ticketCreatedDate: createdDate,
      ticketResolvedDate: resolvedDate,
      slaDueDate,
      timeElapsed: differenceInHours(referenceDate, createdDate),
      timeRemaining: differenceInHours(slaDueDate, now),
      percentageUsed: Math.min(percentageUsed, 100),
      status,
      isOverdue,
      businessHoursElapsed,
      businessHoursRemaining: Math.max(businessHoursRemaining, 0)
    };
  }

  /**
   * Format SLA time remaining as a timer display
   */
  public static formatSLATimer(slaCalculation: ISLACalculation): ISLATimer {
    const totalHours = slaCalculation.businessHoursRemaining;

    if (totalHours <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalHours: 0,
        displayText: 'Overdue',
        colorClass: 'text-red-500',
        isOverdue: true
      };
    }

    const days = Math.floor(totalHours / 24);
    const hours = Math.floor(totalHours % 24);
    const minutes = Math.floor((totalHours * 60) % 60);

    let displayText = '';
    if (days > 0) {
      displayText = `${days}d ${hours}h`;
    } else if (hours > 0) {
      displayText = `${hours}h ${minutes}m`;
    } else {
      displayText = `${minutes}m`;
    }

    // Determine color based on percentage
    let colorClass = 'text-green-400';
    if (slaCalculation.percentageUsed >= 90) {
      colorClass = 'text-red-500';
    } else if (slaCalculation.percentageUsed >= 75) {
      colorClass = 'text-orange-400';
    } else if (slaCalculation.percentageUsed >= 50) {
      colorClass = 'text-yellow-400';
    }

    return {
      days,
      hours,
      minutes,
      seconds: 0,
      totalHours,
      displayText,
      colorClass,
      isOverdue: false
    };
  }

  /**
   * Format date for display
   */
  public static formatDate(date: Date): string {
    return format(date, 'MMM dd, yyyy hh:mm a');
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  public static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMinutes = differenceInMinutes(now, date);

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Calculate priority based on impact and urgency matrix
   */
  public static calculatePriority(impact: string, urgency: string): string {
    const priorityMatrix: { [key: string]: { [key: string]: string } } = {
      Low: {
        Low: 'Low',
        Medium: 'Low',
        High: 'Medium',
        Critical: 'Medium'
      },
      Medium: {
        Low: 'Low',
        Medium: 'Medium',
        High: 'High',
        Critical: 'High'
      },
      High: {
        Low: 'Medium',
        Medium: 'High',
        High: 'High',
        Critical: 'Critical'
      },
      Critical: {
        Low: 'Medium',
        Medium: 'High',
        High: 'Critical',
        Critical: 'Critical'
      }
    };

    return priorityMatrix[impact]?.[urgency] || 'Medium';
  }

  /**
   * Format SLA time remaining for table display
   * Returns a simple string showing time remaining or completion time
   */
  public static formatSLATimeForTable(ticket: {
    Created: Date;
    ResolvedDate?: Date;
    SLADueDate?: Date;
    Status: string;
    ResolutionTime?: number;
  }): string {
    // If ticket is resolved or closed, show completion time
    if (ticket.Status === 'Resolved' || ticket.Status === 'Closed') {
      if (ticket.ResolutionTime) {
        const hours = Math.floor(ticket.ResolutionTime);
        const minutes = Math.round((ticket.ResolutionTime - hours) * 60);

        if (hours === 0) {
          return `${minutes}m`;
        } else if (hours < 24) {
          return `${hours}h ${minutes}m`;
        } else {
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          return `${days}d ${remainingHours}h`;
        }
      }
      return 'N/A';
    }

    // For open tickets, show time remaining
    if (!ticket.SLADueDate) {
      return 'N/A';
    }

    const now = new Date();
    const slaDueDate = new Date(ticket.SLADueDate);
    const diffMinutes = differenceInMinutes(slaDueDate, now);

    // If overdue
    if (diffMinutes <= 0) {
      const overdueMinutes = Math.abs(diffMinutes);
      const hours = Math.floor(overdueMinutes / 60);
      const minutes = overdueMinutes % 60;

      if (hours === 0) {
        return `-${minutes}m`;
      } else if (hours < 24) {
        return `-${hours}h ${minutes}m`;
      } else {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `-${days}d ${remainingHours}h`;
      }
    }

    // Time remaining
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours === 0) {
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h ${minutes}m`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
  }
}
