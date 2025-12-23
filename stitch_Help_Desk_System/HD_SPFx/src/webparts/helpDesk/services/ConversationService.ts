import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/items/get-all';
import { SPService } from './SPService';
import { LIST_NAMES } from '../utils/Constants';
import { IConversation, ICreateConversationForm, MessageType } from '../models';

export class ConversationService {
  /**
   * Get all conversations for a ticket
   */
  public static async getConversationsByTicketId(ticketId: number): Promise<IConversation[]> {
    try {
      const sp = SPService.getSP();

      const items = await sp.web.lists.getByTitle(LIST_NAMES.CONVERSATIONS).items
        .select(
          'Id', 'TicketID/Id', 'TicketID/Title',
          'Message', 'SentBy/Id', 'SentBy/Title', 'SentBy/EMail',
          'Created', 'IsInternal', 'MessageType', 'Attachments'
        )
        .expand('TicketID', 'SentBy')
        .filter(`TicketID/Id eq ${ticketId}`)
        .orderBy('Created', true)
        .top(500)();

      return items.map(item => this.mapToConversation(item));
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  /**
   * Add a message to a ticket conversation
   */
  public static async addMessage(formData: ICreateConversationForm): Promise<IConversation> {
    try {
      const sp = SPService.getSP();
      const currentUser = await SPService.getCurrentUser();

      const messageData: any = {
        TicketIDId: formData.TicketId,
        Message: formData.Message,
        SentById: currentUser.Id,
        IsInternal: formData.IsInternal,
        MessageType: formData.IsInternal ? MessageType.Internal : MessageType.User
      };

      const result = await sp.web.lists.getByTitle(LIST_NAMES.CONVERSATIONS).items.add(messageData);

      // Add attachments if any
      if (formData.Attachments && formData.Attachments.length > 0) {
        for (const file of formData.Attachments) {
          await sp.web.lists.getByTitle(LIST_NAMES.CONVERSATIONS).items
            .getById(result.data.Id)
            .attachmentFiles.add(file.name, await file.arrayBuffer());
        }
      }

      // Get and return the created message
      return await this.getMessageById(result.data.Id);
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  /**
   * Get a single message by ID
   */
  public static async getMessageById(messageId: number): Promise<IConversation> {
    try {
      const sp = SPService.getSP();

      const item = await sp.web.lists.getByTitle(LIST_NAMES.CONVERSATIONS).items
        .getById(messageId)
        .select(
          'Id', 'TicketID/Id', 'TicketID/Title',
          'Message', 'SentBy/Id', 'SentBy/Title', 'SentBy/EMail',
          'Created', 'IsInternal', 'MessageType', 'Attachments'
        )
        .expand('TicketID', 'SentBy')();

      const message = this.mapToConversation(item);

      // Get attachments if any
      if (item.Attachments) {
        const attachments = await sp.web.lists.getByTitle(LIST_NAMES.CONVERSATIONS).items
          .getById(messageId)
          .attachmentFiles();

        message.AttachmentFiles = attachments.map(att => ({
          FileName: att.FileName,
          ServerRelativeUrl: att.ServerRelativeUrl
        }));
      }

      return message;
    } catch (error) {
      console.error('Error getting message:', error);
      throw error;
    }
  }

  /**
   * Get latest conversations (for polling/real-time updates)
   */
  public static async getLatestConversations(
    ticketId: number,
    sinceDate: Date
  ): Promise<IConversation[]> {
    try {
      const sp = SPService.getSP();

      const isoDate = sinceDate.toISOString();

      const items = await sp.web.lists.getByTitle(LIST_NAMES.CONVERSATIONS).items
        .select(
          'Id', 'TicketID/Id', 'TicketID/Title',
          'Message', 'SentBy/Id', 'SentBy/Title', 'SentBy/EMail',
          'Created', 'IsInternal', 'MessageType', 'Attachments'
        )
        .expand('TicketID', 'SentBy')
        .filter(`TicketID/Id eq ${ticketId} and Created gt datetime'${isoDate}'`)
        .orderBy('Created', true)
        .top(50)();

      return items.map(item => this.mapToConversation(item));
    } catch (error) {
      console.error('Error getting latest conversations:', error);
      return []; // Return empty array on error for polling scenarios
    }
  }

  /**
   * Delete a message (only by sender or admin)
   */
  public static async deleteMessage(messageId: number): Promise<void> {
    try {
      const sp = SPService.getSP();

      await sp.web.lists.getByTitle(LIST_NAMES.CONVERSATIONS).items
        .getById(messageId)
        .delete();

      console.log('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for a ticket
   */
  public static async getUnreadCount(ticketId: number, lastReadDate: Date): Promise<number> {
    try {
      const sp = SPService.getSP();

      const isoDate = lastReadDate.toISOString();

      const items = await sp.web.lists.getByTitle(LIST_NAMES.CONVERSATIONS).items
        .select('Id')
        .filter(`TicketID/Id eq ${ticketId} and Created gt datetime'${isoDate}'`)
        .top(100)();

      return items.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Get total unread conversations count for a technician/user
   * Returns count of tickets with new messages
   */
  public static async getUnreadConversationsCount(userId: number): Promise<number> {
    try {
      // For simplicity, we'll return 0 for now
      // In a real implementation, you would track read/unread status per user
      // This could be done via a separate tracking list or by adding a field to conversations
      return 0;
    } catch (error) {
      console.error('Error getting unread conversations count:', error);
      return 0;
    }
  }

  /**
   * Map SharePoint item to IConversation
   */
  private static mapToConversation(item: any): IConversation {
    return {
      Id: item.Id,
      TicketId: item.TicketID?.Id || 0,
      TicketNumber: item.TicketID?.Title ? `TKT-${String(item.TicketID.Id).padStart(5, '0')}` : '',
      Message: item.Message || '',
      SentById: item.SentBy?.Id,
      SentByName: item.SentBy?.Title,
      SentByEmail: item.SentBy?.EMail,
      SentDate: new Date(item.Created),
      IsInternal: item.IsInternal || false,
      MessageType: item.MessageType || MessageType.User,
      Attachments: item.Attachments
    };
  }
}
