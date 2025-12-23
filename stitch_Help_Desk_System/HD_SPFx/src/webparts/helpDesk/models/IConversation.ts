/**
 * Conversation/Message interface for ticket conversations
 */
export interface IConversation {
  Id: number;
  TicketId: number;
  TicketNumber?: string;
  Message: string; // Rich HTML content
  SentById?: number;
  SentByName?: string;
  SentByEmail?: string;
  SentByPhotoUrl?: string;
  SentDate: Date;
  IsInternal: boolean; // Internal note vs public message
  MessageType: MessageType;
  Attachments?: boolean;
  AttachmentFiles?: IMessageAttachment[];
}

export enum MessageType {
  User = 'User',
  Technician = 'Technician',
  System = 'System', // Auto-generated messages (ticket created, assigned, etc.)
  Internal = 'Internal' // Internal notes (only visible to technicians/managers)
}

export interface IMessageAttachment {
  FileName: string;
  ServerRelativeUrl: string;
  FileSize?: number;
}

/**
 * Conversation create form
 */
export interface ICreateConversationForm {
  TicketId: number;
  Message: string;
  IsInternal: boolean;
  Attachments?: File[];
}
