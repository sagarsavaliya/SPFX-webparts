/**
 * Central export for all models
 */

// Ticket models
export * from './ITicket';

// Category models
export * from './ICategory';

// Conversation models
export * from './IConversation';

// User models
export * from './IUser';

// Knowledge Base models
export * from './IKnowledgeBase';

// FAQ models
export * from './IFAQ';

// SLA models
export * from './ISLA';

/**
 * Common interfaces
 */

/**
 * API response wrapper
 */
export interface IAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Provisioning status
 */
export interface IProvisioningStatus {
  isProvisioned: boolean;
  listsCreated: boolean;
  groupsCreated: boolean;
  mockDataAdded: boolean;
  error?: string;
  progress: number; // 0-100
  currentStep: string;
}

/**
 * App state for context
 */
export interface IAppState {
  isLoading: boolean;
  error: string | undefined;
  currentUser: ICurrentUser | undefined;
  provisioningStatus: IProvisioningStatus;
}

/**
 * Common props for components
 */
export interface IBaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
}

import { ICurrentUser } from './IUser';
