/**
 * Ticket interface representing a help desk ticket
 */
export interface ITicket {
  Id: number;
  Title: string; // Subject
  TicketNumber: string; // Calculated: "TKT-" + ID
  Description: string;
  Status: TicketStatus;
  Priority: TicketPriority;
  Impact: TicketImpact;
  Urgency: TicketUrgency;
  CategoryId?: number;
  CategoryTitle?: string;
  SubCategoryId?: number;
  SubCategoryTitle?: string;
  RequesterId?: number;
  RequesterName?: string;
  RequesterEmail?: string;
  AssignedToId?: number;
  AssignedToName?: string;
  AssignedToEmail?: string;
  Created: Date;
  Modified: Date;
  ResolvedDate?: Date;
  ClosedDate?: Date;
  SLADueDate?: Date;
  SLAStatus: SLAStatus;
  ResolutionTime?: number; // in hours
  Attachments?: boolean;
  AttachmentFiles?: IAttachment[];
  CCUsers?: string[]; // Email addresses
}

export enum TicketStatus {
  New = 'New',
  Open = 'Open',
  InProgress = 'In Progress',
  Waiting = 'Waiting',
  Resolved = 'Resolved',
  Closed = 'Closed',
  Reopened = 'Reopened'
}

export enum TicketPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum TicketImpact {
  Individual = 'Individual',
  Department = 'Department',
  Organization = 'Organization'
}

export enum TicketUrgency {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum SLAStatus {
  Met = 'Met',
  AtRisk = 'At Risk',
  Breached = 'Breached',
  Pending = 'Pending'
}

export interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
  FileSize?: number;
}

/**
 * Create ticket form data
 */
export interface ICreateTicketForm {
  Title: string;
  Description: string;
  CategoryId: number | undefined;
  SubCategoryId: number | undefined;
  Impact: TicketImpact;
  Urgency: TicketUrgency;
  CCUsers: string[];
  Attachments: File[];
}

/**
 * Ticket statistics for dashboard
 */
export interface ITicketStats {
  total: number;
  open: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  closed: number;
  overdue: number;
  slaAtRisk: number;
  highPriority: number;
  assignedToMe?: number;
}

/**
 * Ticket filter options
 */
export interface ITicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  assignedToMe?: boolean;
  createdByMe?: boolean;
  categoryId?: number;
  searchText?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
