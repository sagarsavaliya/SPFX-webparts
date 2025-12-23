import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/items/get-all';
import '@pnp/sp/attachments';
import { IItemAddResult } from '@pnp/sp/items';
import { SPService } from './SPService';
import { LIST_NAMES, PRIORITY_MATRIX } from '../utils/Constants';
import {
  ITicket,
  ICreateTicketForm,
  ITicketStats,
  ITicketFilters,
  ICategory,
  ISubCategory,
  TicketStatus,
  TicketPriority,
  SLAStatus
} from '../models';
import { SLACalculator } from '../utils/SLACalculator';

export class TicketService {
  /**
   * Get all tickets with optional filters
   */
  public static async getTickets(filters?: ITicketFilters): Promise<ITicket[]> {
    try {
      const sp = SPService.getSP();

      // Try with full expansion first
      try {
        let query = sp.web.lists.getByTitle(LIST_NAMES.TICKETS).items
          .select(
            'Id', 'Title', 'Description', 'Status', 'Priority', 'Impact', 'Urgency',
            'Category/Id', 'Category/Title',
            'SubCategory/Id', 'SubCategory/Title',
            'Requester/Id', 'Requester/Title', 'Requester/EMail',
            'AssignedTo/Id', 'AssignedTo/Title', 'AssignedTo/EMail',
            'CCUsers/Id', 'CCUsers/Title', 'CCUsers/EMail',
            'Created', 'Modified', 'ResolvedDate', 'SLADueDate', 'SLAStatus',
            'ResolutionTime', 'Attachments'
          )
          .expand('Category', 'SubCategory', 'Requester', 'AssignedTo', 'CCUsers')
          .orderBy('Created', false)
          .top(500);

        // Apply filters
        if (filters) {
          if (filters.status && filters.status.length > 0) {
            const statusFilter = filters.status.map(s => `Status eq '${s}'`).join(' or ');
            query = query.filter(statusFilter);
          }

          if (filters.priority && filters.priority.length > 0) {
            const priorityFilter = filters.priority.map(p => `Priority eq '${p}'`).join(' or ');
            query = query.filter(priorityFilter);
          }

          if (filters.assignedToMe) {
            const currentUser = await SPService.getCurrentUser();
            query = query.filter(`AssignedTo/Id eq ${currentUser.Id}`);
          }

          if (filters.createdByMe) {
            const currentUser = await SPService.getCurrentUser();
            query = query.filter(`Requester/Id eq ${currentUser.Id}`);
          }

          if (filters.categoryId) {
            query = query.filter(`Category/Id eq ${filters.categoryId}`);
          }

          if (filters.searchText) {
            const searchFilter = `(substringof('${filters.searchText}', Title) or substringof('${filters.searchText}', Description))`;
            query = query.filter(searchFilter);
          }
        }

        const items = await query();
        return items.map(item => this.mapToTicket(item));

      } catch (lookupError: any) {
        // If lookup fields are not ready yet (right after provisioning), fallback to basic query
        console.warn('Lookup fields not ready, falling back to basic query:', lookupError.message);

        // Fallback to basic query without lookup expansions
        let basicQuery = sp.web.lists.getByTitle(LIST_NAMES.TICKETS).items
          .select(
            'Id', 'Title', 'Description', 'Status', 'Priority', 'Impact', 'Urgency',
            'Created', 'Modified', 'ResolvedDate', 'SLADueDate', 'SLAStatus',
            'ResolutionTime', 'Attachments'
          )
          .orderBy('Created', false)
          .top(500);

        // Apply basic filters (without lookup-based filters)
        if (filters) {
          if (filters.status && filters.status.length > 0) {
            const statusFilter = filters.status.map(s => `Status eq '${s}'`).join(' or ');
            basicQuery = basicQuery.filter(statusFilter);
          }

          if (filters.priority && filters.priority.length > 0) {
            const priorityFilter = filters.priority.map(p => `Priority eq '${p}'`).join(' or ');
            basicQuery = basicQuery.filter(priorityFilter);
          }

          if (filters.searchText) {
            const searchFilter = `(substringof('${filters.searchText}', Title) or substringof('${filters.searchText}', Description))`;
            basicQuery = basicQuery.filter(searchFilter);
          }
        }

        const items = await basicQuery();
        return items.map(item => this.mapToTicket(item));
      }
    } catch (error) {
      console.error('Error getting tickets:', error);
      throw error;
    }
  }

  /**
   * Get ticket by ID
   */
  public static async getTicketById(ticketId: number): Promise<ITicket> {
    try {
      const sp = SPService.getSP();
      const item = await sp.web.lists.getByTitle(LIST_NAMES.TICKETS).items
        .getById(ticketId)
        .select(
          'Id', 'Title', 'Description', 'Status', 'Priority', 'Impact', 'Urgency',
          'Category/Id', 'Category/Title',
          'SubCategory/Id', 'SubCategory/Title',
          'Requester/Id', 'Requester/Title', 'Requester/EMail',
          'AssignedTo/Id', 'AssignedTo/Title', 'AssignedTo/EMail',
          'CCUsers/Id', 'CCUsers/Title', 'CCUsers/EMail',
          'Created', 'Modified', 'ResolvedDate', 'SLADueDate', 'SLAStatus',
          'ResolutionTime', 'Attachments'
        )
        .expand('Category', 'SubCategory', 'Requester', 'AssignedTo', 'CCUsers')();

      const ticket = this.mapToTicket(item);

      // Get attachments if any
      if (item.Attachments) {
        const attachments = await sp.web.lists.getByTitle(LIST_NAMES.TICKETS).items
          .getById(ticketId)
          .attachmentFiles();

        ticket.AttachmentFiles = attachments.map(att => ({
          FileName: att.FileName,
          ServerRelativeUrl: att.ServerRelativeUrl
        }));
      }

      return ticket;
    } catch (error) {
      console.error('Error getting ticket:', error);
      throw error;
    }
  }

  /**
   * Create a new ticket
   */
  public static async createTicket(formData: ICreateTicketForm, files?: File[]): Promise<ITicket> {
    try {
      const sp = SPService.getSP();
      const currentUser = await SPService.getCurrentUser();

      // Calculate priority based on impact and urgency
      const priority = PRIORITY_MATRIX[formData.Impact][formData.Urgency];

      // Get SLA config for this priority/impact combination
      const slaConfig = await this.getSLAConfig(priority, formData.Impact);

      // Calculate SLA due date
      const slaDueDate = slaConfig ? SLACalculator.calculateSLADueDate(new Date(), slaConfig) : null;

      // Resolve CC users from emails to user IDs
      let ccUserIds: number[] = [];
      if (formData.CCUsers && formData.CCUsers.length > 0) {
        try {
          const userPromises = formData.CCUsers.map(async (email) => {
            try {
              const user = await sp.web.siteUsers.getByEmail(email.trim())();
              return user.Id;
            } catch (e) {
              console.warn(`Could not find user with email: ${email}`);
              return null;
            }
          });
          const resolvedIds = await Promise.all(userPromises);
          ccUserIds = resolvedIds.filter(id => id !== null) as number[];
        } catch (e) {
          console.error('Error resolving CC users:', e);
        }
      }

      // Prepare ticket data
      const ticketData: any = {
        Title: formData.Title,
        Description: formData.Description,
        Status: TicketStatus.New,
        Priority: priority,
        Impact: formData.Impact,
        Urgency: formData.Urgency,
        RequesterId: currentUser.Id,
        SLAStatus: SLAStatus.Pending
      };

      // Add CC users if any were resolved
      if (ccUserIds.length > 0) {
        ticketData.CCUsersId = ccUserIds;
      }

      if (formData.CategoryId) {
        ticketData.CategoryId = formData.CategoryId;
      }

      if (formData.SubCategoryId) {
        ticketData.SubCategoryId = formData.SubCategoryId;
      }

      if (slaDueDate) {
        ticketData.SLADueDate = slaDueDate;
      }

      // Add ticket
      const result: IItemAddResult = await sp.web.lists.getByTitle(LIST_NAMES.TICKETS).items.add(ticketData);

      // Add attachments if any
      if (files && files.length > 0) {
        for (const file of files) {
          await sp.web.lists.getByTitle(LIST_NAMES.TICKETS).items
            .getById(result.data.Id)
            .attachmentFiles.add(file.name, await file.arrayBuffer());
        }
      }

      // Create system message in conversations
      await this.createSystemMessage(result.data.Id, `Ticket created by ${currentUser.Title}`);

      // Get and return the created ticket
      return await this.getTicketById(result.data.Id);
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  /**
   * Update only the ticket status
   */
  public static async updateTicketStatus(ticketId: number, status: TicketStatus): Promise<void> {
    return this.updateTicket(ticketId, { Status: status });
  }

  /**
   * Update ticket
   */
  public static async updateTicket(ticketId: number, updates: Partial<ITicket>): Promise<void> {
    try {
      const sp = SPService.getSP();

      const updateData: any = {};

      if (updates.Title) updateData.Title = updates.Title;
      if (updates.Description) updateData.Description = updates.Description;
      if (updates.Status) updateData.Status = updates.Status;
      if (updates.Priority) updateData.Priority = updates.Priority;
      if (updates.Impact) updateData.Impact = updates.Impact;
      if (updates.Urgency) updateData.Urgency = updates.Urgency;
      if (updates.CategoryId) updateData.CategoryId = updates.CategoryId;
      if (updates.SubCategoryId) updateData.SubCategoryId = updates.SubCategoryId;
      if (updates.AssignedToId) updateData.AssignedToId = updates.AssignedToId;
      if (updates.SLAStatus) updateData.SLAStatus = updates.SLAStatus;
      if (updates.ResolvedDate) updateData.ResolvedDate = updates.ResolvedDate;

      // If status is being set to Resolved, calculate resolution time
      if (updates.Status === TicketStatus.Resolved && !updates.ResolvedDate) {
        const ticket = await this.getTicketById(ticketId);
        const now = new Date();
        updateData.ResolvedDate = now;

        // Calculate resolution time in hours
        const resolutionTime = (now.getTime() - new Date(ticket.Created).getTime()) / (1000 * 60 * 60);
        updateData.ResolutionTime = Math.round(resolutionTime * 100) / 100;
      }

      await sp.web.lists.getByTitle(LIST_NAMES.TICKETS).items
        .getById(ticketId)
        .update(updateData);

    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  }

  /**
   * Assign ticket to technician
   */
  public static async assignTicket(ticketId: number, technicianId: number): Promise<void> {
    try {
      const sp = SPService.getSP();
      const currentUser = await SPService.getCurrentUser();

      await sp.web.lists.getByTitle(LIST_NAMES.TICKETS).items
        .getById(ticketId)
        .update({
          AssignedToId: technicianId,
          Status: TicketStatus.Open
        });

      // Create system message
      await this.createSystemMessage(ticketId, `Ticket assigned to technician by ${currentUser.Title}`);

    } catch (error) {
      console.error('Error assigning ticket:', error);
      throw error;
    }
  }

  /**
   * Get ticket statistics
   */
  public static async getTicketStats(userId?: number): Promise<ITicketStats> {
    try {
      const filters: ITicketFilters = userId ? { createdByMe: true } : {};
      const tickets = await this.getTickets(filters);

      const stats: ITicketStats = {
        total: tickets.length,
        open: tickets.filter(t => t.Status === TicketStatus.Open).length,
        inProgress: tickets.filter(t => t.Status === TicketStatus.InProgress).length,
        waiting: tickets.filter(t => t.Status === TicketStatus.Waiting).length,
        resolved: tickets.filter(t => t.Status === TicketStatus.Resolved).length,
        closed: tickets.filter(t => t.Status === TicketStatus.Closed).length,
        overdue: tickets.filter(t => t.SLAStatus === SLAStatus.Breached && t.Status !== TicketStatus.Resolved).length,
        slaAtRisk: tickets.filter(t => t.SLAStatus === SLAStatus.AtRisk).length,
        highPriority: tickets.filter(t => t.Priority === TicketPriority.High || t.Priority === TicketPriority.Critical).length
      };

      if (userId) {
        stats.assignedToMe = tickets.filter(t => t.AssignedToId === userId).length;
      }

      return stats;
    } catch (error) {
      console.error('Error getting ticket stats:', error);
      throw error;
    }
  }

  /**
   * Get SLA configuration for priority/impact combination
   */
  private static async getSLAConfig(priority: string, impact: string): Promise<any> {
    try {
      const sp = SPService.getSP();
      const items = await sp.web.lists.getByTitle(LIST_NAMES.SLA_CONFIG).items
        .filter(`Priority eq '${priority}' and Impact eq '${impact}'`)
        .top(1)();

      return items.length > 0 ? items[0] : null;
    } catch (error) {
      console.error('Error getting SLA config:', error);
      return null;
    }
  }

  /**
   * Get all categories
   */
  public static async getCategories(): Promise<ICategory[]> {
    try {
      const sp = SPService.getSP();
      const items = await sp.web.lists.getByTitle(LIST_NAMES.CATEGORIES).items
        .select('Id', 'Title', 'Description', 'IsActive', 'SLAHours')
        .filter('IsActive eq 1')
        .orderBy('Title', true)();

      return items.map((item: any) => ({
        Id: item.Id,
        Title: item.Title,
        Description: item.Description,
        IsActive: item.IsActive,
        SLAHours: item.SLAHours
      }));
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get all sub-categories
   */
  public static async getSubCategories(): Promise<ISubCategory[]> {
    try {
      const sp = SPService.getSP();
      const items = await sp.web.lists.getByTitle(LIST_NAMES.SUB_CATEGORIES).items
        .select('Id', 'Title', 'Description', 'Category/Id', 'Category/Title', 'IsActive')
        .expand('Category')
        .filter('IsActive eq 1')
        .orderBy('Title', true)();

      return items.map((item: any) => ({
        Id: item.Id,
        Title: item.Title,
        Description: item.Description,
        CategoryId: item.Category?.Id,
        CategoryTitle: item.Category?.Title,
        IsActive: item.IsActive
      }));
    } catch (error) {
      console.error('Error getting sub-categories:', error);
      throw error;
    }
  }

  /**
   * Create system message in conversations
   */
  private static async createSystemMessage(ticketId: number, message: string): Promise<void> {
    try {
      const sp = SPService.getSP();
      const currentUser = await SPService.getCurrentUser();

      await sp.web.lists.getByTitle(LIST_NAMES.CONVERSATIONS).items.add({
        TicketIDId: ticketId,
        Message: `<p>${message}</p>`,
        SentById: currentUser.Id,
        IsInternal: false,
        MessageType: 'System'
      });
    } catch (error) {
      console.error('Error creating system message:', error);
      // Don't throw - not critical
    }
  }

  /**
   * Map SharePoint item to ITicket
   */
  private static mapToTicket(item: any): ITicket {
    // Map CCUsers from user field (array of user objects) to array of emails
    let ccUsers: string[] = [];
    if (item.CCUsers && Array.isArray(item.CCUsers)) {
      ccUsers = item.CCUsers.map((user: any) => user.EMail || user.Title).filter((x: string) => x);
    }

    return {
      Id: item.Id,
      Title: item.Title,
      TicketNumber: `TKT-${String(item.Id).padStart(5, '0')}`,
      Description: item.Description || '',
      Status: item.Status || TicketStatus.New,
      Priority: item.Priority || TicketPriority.Medium,
      Impact: item.Impact || 'Individual',
      Urgency: item.Urgency || 'Medium',
      CategoryId: item.Category?.Id,
      CategoryTitle: item.Category?.Title,
      SubCategoryId: item.SubCategory?.Id,
      SubCategoryTitle: item.SubCategory?.Title,
      RequesterId: item.Requester?.Id,
      RequesterName: item.Requester?.Title,
      RequesterEmail: item.Requester?.EMail,
      AssignedToId: item.AssignedTo?.Id,
      AssignedToName: item.AssignedTo?.Title,
      AssignedToEmail: item.AssignedTo?.EMail,
      Created: new Date(item.Created),
      Modified: new Date(item.Modified),
      ResolvedDate: item.ResolvedDate ? new Date(item.ResolvedDate) : undefined,
      SLADueDate: item.SLADueDate ? new Date(item.SLADueDate) : undefined,
      SLAStatus: item.SLAStatus || SLAStatus.Pending,
      ResolutionTime: item.ResolutionTime,
      Attachments: item.Attachments,
      CCUsers: ccUsers
    };
  }
}
