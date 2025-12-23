import { SPFI } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { LIST_NAMES } from '../utils/Constants';
import { TicketStatus, TicketPriority, TicketImpact, TicketUrgency, SLAStatus } from '../models';

export class MockDataService {
  private sp: SPFI;

  constructor(sp: SPFI, _context: WebPartContext) {
    this.sp = sp;
  }

  /**
   * Add mock tickets for testing
   */
  public async addMockTickets(): Promise<void> {
    try {
      const ticketList = this.sp.web.lists.getByTitle(LIST_NAMES.TICKETS);
      const catList = this.sp.web.lists.getByTitle(LIST_NAMES.CATEGORIES);
      const subCatList = this.sp.web.lists.getByTitle(LIST_NAMES.SUB_CATEGORIES);

      // Get categories and sub-categories
      const categories = await catList.items.select('Id', 'Title')();
      const subCategories = await subCatList.items.select('Id', 'Title', 'CategoryId')();

      const currentUser = await this.sp.web.currentUser();

      const hardware = categories.find(c => c.Title === 'Hardware');
      const software = categories.find(c => c.Title === 'Software');
      const network = categories.find(c => c.Title === 'Network');
      const email = categories.find(c => c.Title === 'Email');

      const mockTickets = [
        {
          Title: 'Laptop not turning on',
          Description: '<p>My laptop is not powering on even after charging it overnight. The power LED is not lighting up.</p>',
          Status: TicketStatus.New,
          Priority: TicketPriority.High,
          Impact: TicketImpact.Individual,
          Urgency: TicketUrgency.High,
          CategoryId: hardware?.Id,
          SubCategoryId: subCategories.find(sc => sc.Title === 'Desktop/Laptop')?.Id,
          RequesterId: currentUser.Id,
          SLAStatus: SLAStatus.Pending
        },
        {
          Title: 'Cannot access shared network drive',
          Description: '<p>I am getting "Access Denied" error when trying to open the shared drive \\\\server\\documents.</p>',
          Status: TicketStatus.Open,
          Priority: TicketPriority.Medium,
          Impact: TicketImpact.Individual,
          Urgency: TicketUrgency.Medium,
          CategoryId: network?.Id,
          SubCategoryId: subCategories.find(sc => sc.Title === 'Internet Connection')?.Id,
          RequesterId: currentUser.Id,
          SLAStatus: SLAStatus.AtRisk
        },
        {
          Title: 'Outlook keeps crashing when opening attachments',
          Description: '<p>Whenever I try to open a PDF attachment in Outlook, the application crashes. This started happening after the latest Windows update.</p>',
          Status: TicketStatus.InProgress,
          Priority: TicketPriority.Medium,
          Impact: TicketImpact.Individual,
          Urgency: TicketUrgency.Medium,
          CategoryId: email?.Id,
          SubCategoryId: subCategories.find(sc => sc.Title === 'Configuration')?.Id,
          RequesterId: currentUser.Id,
          SLAStatus: SLAStatus.Pending
        },
        {
          Title: 'Need Microsoft Office installation',
          Description: '<p>I need Microsoft Office installed on my new laptop. Please install Office 365 with Excel, Word, PowerPoint, and Teams.</p>',
          Status: TicketStatus.Waiting,
          Priority: TicketPriority.Low,
          Impact: TicketImpact.Individual,
          Urgency: TicketUrgency.Low,
          CategoryId: software?.Id,
          SubCategoryId: subCategories.find(sc => sc.Title === 'Microsoft Office')?.Id,
          RequesterId: currentUser.Id,
          SLAStatus: SLAStatus.Pending
        },
        {
          Title: 'Printer not printing in color',
          Description: '<p>The HP printer on the 3rd floor is only printing in black and white even though I selected color printing. I checked the settings and color printing is enabled.</p>',
          Status: TicketStatus.Resolved,
          Priority: TicketPriority.Low,
          Impact: TicketImpact.Department,
          Urgency: TicketUrgency.Low,
          CategoryId: hardware?.Id,
          SubCategoryId: subCategories.find(sc => sc.Title === 'Printer/Scanner')?.Id,
          RequesterId: currentUser.Id,
          ResolvedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          SLAStatus: SLAStatus.Met,
          ResolutionTime: 4
        },
        {
          Title: 'Internet connection extremely slow',
          Description: '<p>The internet speed in the marketing department has been very slow for the past two days. We cannot load web pages or access cloud applications.</p>',
          Status: TicketStatus.Open,
          Priority: TicketPriority.Critical,
          Impact: TicketImpact.Department,
          Urgency: TicketUrgency.Critical,
          CategoryId: network?.Id,
          SubCategoryId: subCategories.find(sc => sc.Title === 'Internet Connection')?.Id,
          RequesterId: currentUser.Id,
          SLAStatus: SLAStatus.AtRisk,
          SLADueDate: new Date(Date.now() + 2 * 60 * 60 * 1000) // Due in 2 hours
        },
        {
          Title: 'Password reset for SharePoint site',
          Description: '<p>I forgot my password for accessing the SharePoint intranet site. Can you please reset it?</p>',
          Status: TicketStatus.Resolved,
          Priority: TicketPriority.Medium,
          Impact: TicketImpact.Individual,
          Urgency: TicketUrgency.Medium,
          CategoryId: software?.Id,
          SubCategoryId: subCategories.find(sc => sc.Title === 'Other Applications')?.Id,
          RequesterId: currentUser.Id,
          ResolvedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          SLAStatus: SLAStatus.Met,
          ResolutionTime: 2
        },
        {
          Title: 'Monitor display flickering',
          Description: '<p>My external monitor keeps flickering and sometimes goes black for a few seconds. I tried different cables but the issue persists.</p>',
          Status: TicketStatus.InProgress,
          Priority: TicketPriority.High,
          Impact: TicketImpact.Individual,
          Urgency: TicketUrgency.High,
          CategoryId: hardware?.Id,
          SubCategoryId: subCategories.find(sc => sc.Title === 'Monitor')?.Id,
          RequesterId: currentUser.Id,
          SLAStatus: SLAStatus.Pending,
          SLADueDate: new Date(Date.now() + 8 * 60 * 60 * 1000) // Due in 8 hours
        },
        {
          Title: 'Need VPN access for remote work',
          Description: '<p>I will be working from home next week and need VPN access to connect to the company network. Please provide me with VPN credentials.</p>',
          Status: TicketStatus.New,
          Priority: TicketPriority.Medium,
          Impact: TicketImpact.Individual,
          Urgency: TicketUrgency.Medium,
          CategoryId: network?.Id,
          SubCategoryId: subCategories.find(sc => sc.Title === 'VPN Access')?.Id,
          RequesterId: currentUser.Id,
          SLAStatus: SLAStatus.Pending
        },
        {
          Title: 'Email not syncing on mobile device',
          Description: '<p>My work email is not syncing on my iPhone. I can receive emails but cannot send any. The same account works fine on my laptop.</p>',
          Status: TicketStatus.Open,
          Priority: TicketPriority.Low,
          Impact: TicketImpact.Individual,
          Urgency: TicketUrgency.Medium,
          CategoryId: email?.Id,
          SubCategoryId: subCategories.find(sc => sc.Title === 'Cannot Send/Receive')?.Id,
          RequesterId: currentUser.Id,
          SLAStatus: SLAStatus.Pending
        },
        {
          Title: 'Keyboard keys not working',
          Description: '<p>Several keys on my keyboard (A, S, D, F) have stopped working. I spilled some coffee on it yesterday.</p>',
          Status: TicketStatus.Waiting,
          Priority: TicketPriority.High,
          Impact: TicketImpact.Individual,
          Urgency: TicketUrgency.High,
          CategoryId: hardware?.Id,
          SubCategoryId: subCategories.find(sc => sc.Title === 'Keyboard/Mouse')?.Id,
          RequesterId: currentUser.Id,
          SLAStatus: SLAStatus.AtRisk,
          SLADueDate: new Date(Date.now() + 4 * 60 * 60 * 1000) // Due in 4 hours
        },
        {
          Title: 'Windows update failed',
          Description: '<p>I tried to install the latest Windows updates but they keep failing with error code 0x80070002. I have tried restarting multiple times.</p>',
          Status: TicketStatus.Open,
          Priority: TicketPriority.Medium,
          Impact: TicketImpact.Individual,
          Urgency: TicketUrgency.Medium,
          CategoryId: software?.Id,
          SubCategoryId: subCategories.find(sc => sc.Title === 'Windows OS')?.Id,
          RequesterId: currentUser.Id,
          SLAStatus: SLAStatus.Pending
        }
      ];

      // Add tickets
      for (const ticket of mockTickets) {
        await ticketList.items.add(ticket);
      }

      console.log('Mock tickets added successfully');

      // Add some mock conversations for a couple of tickets
      await this.addMockConversations();

    } catch (error) {
      console.error('Error adding mock tickets:', error);
      throw error;
    }
  }

  /**
   * Add mock conversations for testing
   */
  private async addMockConversations(): Promise<void> {
    try {
      const conversationList = this.sp.web.lists.getByTitle(LIST_NAMES.CONVERSATIONS);
      const ticketList = this.sp.web.lists.getByTitle(LIST_NAMES.TICKETS);
      const currentUser = await this.sp.web.currentUser();

      // Get first few tickets
      const tickets = await ticketList.items.select('Id', 'Title').top(3)();

      if (tickets.length > 0) {
        const ticket1 = tickets[0];

        // Conversation thread for ticket 1
        await conversationList.items.add({
          TicketIDId: ticket1.Id,
          Message: '<p>Thank you for submitting your ticket. We are looking into this issue and will get back to you shortly.</p>',
          SentById: currentUser.Id,
          IsInternal: false,
          MessageType: 'Technician'
        });

        await conversationList.items.add({
          TicketIDId: ticket1.Id,
          Message: '<p>I tried the power button combinations you suggested but it still does not turn on. Should I bring it to the IT desk?</p>',
          SentById: currentUser.Id,
          IsInternal: false,
          MessageType: 'User'
        });

        await conversationList.items.add({
          TicketIDId: ticket1.Id,
          Message: '<p>Yes, please bring the laptop to the IT desk on the 2nd floor. We will need to run diagnostics.</p>',
          SentById: currentUser.Id,
          IsInternal: false,
          MessageType: 'Technician'
        });
      }

      console.log('Mock conversations added successfully');
    } catch (error) {
      console.error('Error adding mock conversations:', error);
      // Don't throw - not critical
    }
  }

  /**
   * Clear all mock data (for testing)
   */
  public async clearMockData(): Promise<void> {
    try {
      // Delete all items from tickets list
      const ticketList = this.sp.web.lists.getByTitle(LIST_NAMES.TICKETS);
      const tickets = await ticketList.items.select('Id')();

      for (const ticket of tickets) {
        await ticketList.items.getById(ticket.Id).delete();
      }

      // Delete all conversations
      const conversationList = this.sp.web.lists.getByTitle(LIST_NAMES.CONVERSATIONS);
      const conversations = await conversationList.items.select('Id')();

      for (const conv of conversations) {
        await conversationList.items.getById(conv.Id).delete();
      }

      console.log('Mock data cleared successfully');
    } catch (error) {
      console.error('Error clearing mock data:', error);
      throw error;
    }
  }
}
