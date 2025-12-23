/**
 * Application constants
 */

import { TicketPriority } from '../models/ITicket';

// SharePoint List Names
export const LIST_NAMES = {
  TICKETS: 'HelpDesk_Tickets',
  CATEGORIES: 'HelpDesk_Categories',
  SUB_CATEGORIES: 'HelpDesk_SubCategories',
  CONVERSATIONS: 'HelpDesk_Conversations',
  KNOWLEDGE_BASE: 'HelpDesk_KnowledgeBase',
  FAQS: 'HelpDesk_FAQs',
  SLA_CONFIG: 'HelpDesk_SLAConfig'
};

// SharePoint Group Names
export const GROUP_NAMES = {
  USERS: 'HelpDesk_Users',
  TECHNICIANS: 'HelpDesk_Technicians',
  MANAGERS: 'HelpDesk_Managers'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  PROVISIONING_STATUS: 'helpdesk_provisioning_status',
  USER_PREFERENCES: 'helpdesk_user_preferences',
  LAST_SYNC: 'helpdesk_last_sync'
};

// SLA Configuration Defaults
export const SLA_DEFAULTS = {
  WORKING_HOURS_START: 9, // 9 AM
  WORKING_HOURS_END: 17, // 5 PM
  EXCLUDE_WEEKENDS: true,
  WORKING_DAYS: [1, 2, 3, 4, 5], // Monday to Friday
  AT_RISK_THRESHOLD: 0.75, // 75% of SLA time used
  CRITICAL_THRESHOLD: 0.90 // 90% of SLA time used
};

// Polling Intervals (milliseconds)
export const POLLING_INTERVALS = {
  CONVERSATIONS: 10000, // 10 seconds for conversation updates
  TICKETS: 30000, // 30 seconds for ticket list updates
  SLA_TIMER: 60000 // 1 minute for SLA timer updates
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  DASHBOARD_PAGE_SIZE: 10,
  KB_PAGE_SIZE: 15
};

// File Upload
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10485760, // 10 MB
  ALLOWED_EXTENSIONS: [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar'
  ],
  MAX_FILES: 5
};

// Routes
export const ROUTES = {
  DASHBOARD: '/dashboard',
  CREATE_TICKET: '/ticket/new',
  VIEW_TICKET: '/ticket/:id',
  MY_TICKETS: '/my-tickets',
  KNOWLEDGE_BASE: '/kb',
  KB_ARTICLE: '/kb/:id',
  FAQ: '/faq',
  SETTINGS: '/settings'
};

// Priority Configuration
export const PRIORITY_CONFIG = {
  Low: {
    color: '#94a3b8', // slate
    bgColor: '#1e293b',
    label: 'Low'
  },
  Medium: {
    color: '#3b82f6', // blue
    bgColor: '#1e3a8a',
    label: 'Medium'
  },
  High: {
    color: '#f59e0b', // amber
    bgColor: '#78350f',
    label: 'High'
  },
  Critical: {
    color: '#ef4444', // red
    bgColor: '#7f1d1d',
    label: 'Critical'
  }
};

// Status Configuration
export const STATUS_CONFIG = {
  New: {
    color: '#3b82f6', // blue
    bgColor: '#1e3a8a',
    label: 'New',
    icon: 'new_releases'
  },
  Open: {
    color: '#0d9488', // teal
    bgColor: '#134e4a',
    label: 'Open',
    icon: 'inbox'
  },
  'In Progress': {
    color: '#f59e0b', // amber
    bgColor: '#78350f',
    label: 'In Progress',
    icon: 'pending'
  },
  Waiting: {
    color: '#8b5cf6', // violet
    bgColor: '#4c1d95',
    label: 'Waiting',
    icon: 'schedule'
  },
  Resolved: {
    color: '#10b981', // green
    bgColor: '#064e3b',
    label: 'Resolved',
    icon: 'check_circle'
  },
  Closed: {
    color: '#6b7280', // gray
    bgColor: '#1f2937',
    label: 'Closed',
    icon: 'cancel'
  },
  Reopened: {
    color: '#dc2626', // red
    bgColor: '#7f1d1d',
    label: 'Reopened',
    icon: 'restart_alt'
  }
};

// Impact-Urgency to Priority Matrix
export const PRIORITY_MATRIX: { [key: string]: { [key: string]: TicketPriority } } = {
  Individual: {
    Low: TicketPriority.Low,
    Medium: TicketPriority.Low,
    High: TicketPriority.Medium,
    Critical: TicketPriority.Medium
  },
  Department: {
    Low: TicketPriority.Low,
    Medium: TicketPriority.Medium,
    High: TicketPriority.High,
    Critical: TicketPriority.High
  },
  Organization: {
    Low: TicketPriority.Medium,
    Medium: TicketPriority.High,
    High: TicketPriority.High,
    Critical: TicketPriority.Critical
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  PERMISSION: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested item was not found.',
  VALIDATION: 'Please check your input and try again.',
  FILE_SIZE: `File size exceeds ${FILE_UPLOAD.MAX_FILE_SIZE / 1024 / 1024} MB limit.`,
  FILE_TYPE: 'File type not allowed.',
  PROVISIONING_FAILED: 'Failed to set up Help Desk. Please contact administrator.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  TICKET_CREATED: 'Ticket created successfully!',
  TICKET_UPDATED: 'Ticket updated successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  PROVISIONING_COMPLETE: 'Help Desk setup completed successfully!'
};

// Default Categories for Provisioning
export const DEFAULT_CATEGORIES = [
  { Title: 'Hardware', Description: 'Computer, laptop, printer, and other hardware issues', SLAHours: 24 },
  { Title: 'Software', Description: 'Application and software related issues', SLAHours: 16 },
  { Title: 'Network', Description: 'Internet, WiFi, and network connectivity issues', SLAHours: 8 },
  { Title: 'Email', Description: 'Email and Outlook related issues', SLAHours: 12 },
  { Title: 'Access', Description: 'Permission and access related requests', SLAHours: 4 },
  { Title: 'Other', Description: 'Other general inquiries', SLAHours: 48 }
];

// Default Sub-Categories
export const DEFAULT_SUB_CATEGORIES = [
  // Hardware
  { Title: 'Desktop/Laptop', Category: 'Hardware' },
  { Title: 'Printer/Scanner', Category: 'Hardware' },
  { Title: 'Monitor', Category: 'Hardware' },
  { Title: 'Keyboard/Mouse', Category: 'Hardware' },
  // Software
  { Title: 'Microsoft Office', Category: 'Software' },
  { Title: 'Windows OS', Category: 'Software' },
  { Title: 'Antivirus', Category: 'Software' },
  { Title: 'Other Applications', Category: 'Software' },
  // Network
  { Title: 'Internet Connection', Category: 'Network' },
  { Title: 'WiFi Issues', Category: 'Network' },
  { Title: 'VPN Access', Category: 'Network' },
  // Email
  { Title: 'Cannot Send/Receive', Category: 'Email' },
  { Title: 'Password Reset', Category: 'Email' },
  { Title: 'Configuration', Category: 'Email' },
  // Access
  { Title: 'Folder Access', Category: 'Access' },
  { Title: 'Application Access', Category: 'Access' },
  { Title: 'SharePoint Access', Category: 'Access' }
];

// Default SLA Configuration
export const DEFAULT_SLA_CONFIG = [
  // Critical Priority
  { Priority: 'Critical', Impact: 'Organization', ResponseTimeHours: 1, ResolutionTimeHours: 4 },
  { Priority: 'Critical', Impact: 'Department', ResponseTimeHours: 2, ResolutionTimeHours: 8 },
  { Priority: 'Critical', Impact: 'Individual', ResponseTimeHours: 4, ResolutionTimeHours: 12 },
  // High Priority
  { Priority: 'High', Impact: 'Organization', ResponseTimeHours: 2, ResolutionTimeHours: 8 },
  { Priority: 'High', Impact: 'Department', ResponseTimeHours: 4, ResolutionTimeHours: 16 },
  { Priority: 'High', Impact: 'Individual', ResponseTimeHours: 8, ResolutionTimeHours: 24 },
  // Medium Priority
  { Priority: 'Medium', Impact: 'Organization', ResponseTimeHours: 4, ResolutionTimeHours: 16 },
  { Priority: 'Medium', Impact: 'Department', ResponseTimeHours: 8, ResolutionTimeHours: 24 },
  { Priority: 'Medium', Impact: 'Individual', ResponseTimeHours: 12, ResolutionTimeHours: 48 },
  // Low Priority
  { Priority: 'Low', Impact: 'Organization', ResponseTimeHours: 8, ResolutionTimeHours: 48 },
  { Priority: 'Low', Impact: 'Department', ResponseTimeHours: 24, ResolutionTimeHours: 72 },
  { Priority: 'Low', Impact: 'Individual', ResponseTimeHours: 48, ResolutionTimeHours: 120 }
];
