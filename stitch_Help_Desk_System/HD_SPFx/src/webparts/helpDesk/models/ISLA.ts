/**
 * SLA Configuration interface
 */
export interface ISLAConfig {
  Id: number;
  Priority: string; // Low, Medium, High, Critical
  Impact: string; // Individual, Department, Organization
  ResponseTimeHours: number;
  ResolutionTimeHours: number;
  WorkingHoursStart: number; // e.g., 9 (9 AM)
  WorkingHoursEnd: number; // e.g., 17 (5 PM)
  ExcludeWeekends: boolean;
}

/**
 * SLA calculation result
 */
export interface ISLACalculation {
  slaConfig: ISLAConfig;
  ticketCreatedDate: Date;
  ticketResolvedDate?: Date;
  slaDueDate: Date;
  timeElapsed: number; // in hours
  timeRemaining: number; // in hours
  percentageUsed: number; // 0-100
  status: 'Met' | 'At Risk' | 'Breached' | 'Pending';
  isOverdue: boolean;
  businessHoursElapsed: number; // Working hours only
  businessHoursRemaining: number; // Working hours only
}

/**
 * SLA Timer display
 */
export interface ISLATimer {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  displayText: string; // e.g., "2d 5h 30m"
  colorClass: string; // CSS class for color coding
  isOverdue: boolean;
}

/**
 * Working hours configuration
 */
export interface IWorkingHours {
  startHour: number; // 0-23
  endHour: number; // 0-23
  workingDays: number[]; // 1-7 (Monday-Sunday)
  excludeWeekends: boolean;
  holidays?: Date[]; // Optional: Company holidays
}

/**
 * Technician performance metrics
 */
export interface ITechnicianPerformance {
  technicianId: number;
  technicianName: string;
  totalTicketsAssigned: number;
  ticketsResolved: number;
  ticketsInProgress: number;
  averageResolutionTime: number; // in hours
  slaCompliance: number; // percentage
  slaMetCount: number;
  slaBreachedCount: number;
  customerSatisfaction?: number; // Optional rating
}
