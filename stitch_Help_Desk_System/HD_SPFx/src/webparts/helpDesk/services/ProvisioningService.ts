import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPFI } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/fields";
import "@pnp/sp/views";
import "@pnp/sp/site-groups/web";
import "@pnp/sp/site-users/web";
import { IProvisioningStatus } from '../models';
import {
  LIST_NAMES,
  GROUP_NAMES,
  DEFAULT_CATEGORIES,
  DEFAULT_SUB_CATEGORIES,
  DEFAULT_SLA_CONFIG,
  STORAGE_KEYS
} from '../utils/Constants';

export class ProvisioningService {
  private sp: SPFI;

  constructor(sp: SPFI, _context: WebPartContext) {
    this.sp = sp;
  }

  /**
   * Check if Help Desk is already provisioned
   */
  public async checkProvisioningStatus(): Promise<IProvisioningStatus> {
    try {
      // ALWAYS verify by checking if main lists exist in SharePoint
      // Don't rely on localStorage cache - lists/groups might have been deleted manually
      const lists = await this.sp.web.lists();
      const listNames = lists.map(l => l.Title);

      const requiredLists = [
        LIST_NAMES.TICKETS,
        LIST_NAMES.CATEGORIES,
        LIST_NAMES.SUB_CATEGORIES,
        LIST_NAMES.CONVERSATIONS,
        LIST_NAMES.KNOWLEDGE_BASE,
        LIST_NAMES.FAQS,
        LIST_NAMES.SLA_CONFIG
      ];

      const listsCreated = requiredLists.every(name => listNames.includes(name));

      // Check groups
      const groups = await this.sp.web.siteGroups();
      const groupNames = groups.map(g => g.Title);

      const requiredGroups = [
        GROUP_NAMES.USERS,
        GROUP_NAMES.TECHNICIANS,
        GROUP_NAMES.MANAGERS
      ];

      const groupsCreated = requiredGroups.every(name => groupNames.includes(name));

      const status: IProvisioningStatus = {
        isProvisioned: listsCreated && groupsCreated,
        listsCreated,
        groupsCreated,
        mockDataAdded: listsCreated, // Assume if lists exist, data exists
        progress: listsCreated && groupsCreated ? 100 : 0,
        currentStep: listsCreated && groupsCreated ? 'Complete' : 'Not Started'
      };

      // Update localStorage cache with current status
      localStorage.setItem(STORAGE_KEYS.PROVISIONING_STATUS, JSON.stringify(status));

      return status;
    } catch (error) {
      console.error('Error checking provisioning status:', error);
      return {
        isProvisioned: false,
        listsCreated: false,
        groupsCreated: false,
        mockDataAdded: false,
        progress: 0,
        currentStep: 'Error',
        error: error.message
      };
    }
  }

  /**
   * Provision entire Help Desk system
   */
  public async provisionHelpDesk(
    onProgress?: (status: IProvisioningStatus) => void
  ): Promise<IProvisioningStatus> {
    try {
      // Step 1: Create SharePoint Groups (10%)
      onProgress?.({
        isProvisioned: false,
        listsCreated: false,
        groupsCreated: false,
        mockDataAdded: false,
        progress: 10,
        currentStep: 'Creating SharePoint Groups...'
      });

      await this.createSharePointGroups();

      // Step 2: Create Lists (20-60%)
      onProgress?.({
        isProvisioned: false,
        listsCreated: false,
        groupsCreated: true,
        mockDataAdded: false,
        progress: 20,
        currentStep: 'Creating SharePoint Lists...'
      });

      await this.createAllLists(onProgress);

      // Step 3: Add Initial Data (70-90%)
      onProgress?.({
        isProvisioned: false,
        listsCreated: true,
        groupsCreated: true,
        mockDataAdded: false,
        progress: 70,
        currentStep: 'Adding Initial Data...'
      });

      await this.addInitialData(onProgress);

      // Step 4: Complete (100%)
      const finalStatus: IProvisioningStatus = {
        isProvisioned: true,
        listsCreated: true,
        groupsCreated: true,
        mockDataAdded: true,
        progress: 100,
        currentStep: 'Setup Complete!'
      };

      // Cache provisioning status
      localStorage.setItem(STORAGE_KEYS.PROVISIONING_STATUS, JSON.stringify(finalStatus));

      onProgress?.(finalStatus);
      return finalStatus;

    } catch (error) {
      console.error('Provisioning failed:', error);
      const errorStatus: IProvisioningStatus = {
        isProvisioned: false,
        listsCreated: false,
        groupsCreated: false,
        mockDataAdded: false,
        progress: 0,
        currentStep: 'Failed',
        error: error.message
      };
      onProgress?.(errorStatus);
      return errorStatus;
    }
  }

  /**
   * Create SharePoint Groups
   */
  private async createSharePointGroups(): Promise<void> {
    try {
      const web = this.sp.web;
      let isFirstTimeSetup = false;

      // Create HelpDesk_Users group
      try {
        await web.siteGroups.add({
          Title: GROUP_NAMES.USERS,
          Description: 'Help Desk end users who can create and view their own tickets'
        });
      } catch (e) {
        if (!e.message.includes('already exists')) throw e;
      }

      // Create HelpDesk_Technicians group
      try {
        await web.siteGroups.add({
          Title: GROUP_NAMES.TECHNICIANS,
          Description: 'Help Desk technicians who can resolve tickets'
        });
      } catch (e) {
        if (!e.message.includes('already exists')) throw e;
      }

      // Create HelpDesk_Managers group
      try {
        await web.siteGroups.add({
          Title: GROUP_NAMES.MANAGERS,
          Description: 'Help Desk managers with full access'
        });
        // If group was successfully created (no exception), this is first-time setup
        isFirstTimeSetup = true;
      } catch (e) {
        if (!e.message.includes('already exists')) throw e;
        // Group already exists - not first-time setup
      }

      // Add current user to Manager group ONLY on first-time setup
      if (isFirstTimeSetup) {
        try {
          const currentUser = await web.currentUser();
          await web.siteGroups
            .getByName(GROUP_NAMES.MANAGERS)
            .users.add(currentUser.LoginName);
          console.log('First-time setup: Current user added to Managers group');
        } catch (e) {
          console.error('Error adding current user to Managers group:', e);
        }
      }

      console.log('SharePoint groups created successfully');
    } catch (error) {
      console.error('Error creating SharePoint groups:', error);
      throw error;
    }
  }

  /**
   * Create all required lists
   */
  private async createAllLists(onProgress?: (status: IProvisioningStatus) => void): Promise<void> {
    // Create categories first (needed for lookups)
    onProgress?.({ isProvisioned: false, listsCreated: false, groupsCreated: true, mockDataAdded: false, progress: 25, currentStep: 'Creating Categories List...' });
    await this.createCategoriesList();

    onProgress?.({ isProvisioned: false, listsCreated: false, groupsCreated: true, mockDataAdded: false, progress: 30, currentStep: 'Creating Sub-Categories List...' });
    await this.createSubCategoriesList();

    onProgress?.({ isProvisioned: false, listsCreated: false, groupsCreated: true, mockDataAdded: false, progress: 35, currentStep: 'Creating Tickets List...' });
    await this.createTicketsList();

    onProgress?.({ isProvisioned: false, listsCreated: false, groupsCreated: true, mockDataAdded: false, progress: 45, currentStep: 'Creating Knowledge Base List...' });
    await this.createKnowledgeBaseList();

    onProgress?.({ isProvisioned: false, listsCreated: false, groupsCreated: true, mockDataAdded: false, progress: 50, currentStep: 'Creating FAQs List...' });
    await this.createFAQsList();

    onProgress?.({ isProvisioned: false, listsCreated: false, groupsCreated: true, mockDataAdded: false, progress: 55, currentStep: 'Creating Conversations List...' });
    await this.createConversationsList();

    onProgress?.({ isProvisioned: false, listsCreated: false, groupsCreated: true, mockDataAdded: false, progress: 60, currentStep: 'Creating SLA Config List...' });
    await this.createSLAConfigList();
  }

  /**
   * Create Categories List
   */
  private async createCategoriesList(): Promise<void> {
    try {
      const list = await this.sp.web.lists.ensure(LIST_NAMES.CATEGORIES, '', 100, true);

      if (list.created) {
        // Add fields
        await list.list.fields.addText('Description');
        await list.list.fields.addBoolean('IsActive');
        await list.list.fields.addNumber('SLAHours');

        // Add fields to default view
        await this.addFieldsToDefaultView(LIST_NAMES.CATEGORIES, [
          'Description',
          'IsActive',
          'SLAHours'
        ]);

        console.log('Categories list created');
      }
    } catch (error) {
      console.error('Error creating Categories list:', error);
      throw error;
    }
  }

  /**
   * Create Sub-Categories List
   */
  private async createSubCategoriesList(): Promise<void> {
    try {
      const list = await this.sp.web.lists.ensure(LIST_NAMES.SUB_CATEGORIES, '', 100, true);

      if (list.created) {
        // Add fields
        await list.list.fields.addText('Description');
        await list.list.fields.addLookup('Category', {
          LookupListId: await this.getListId(LIST_NAMES.CATEGORIES),
          LookupFieldName: 'Title'
        });
        await list.list.fields.addBoolean('IsActive');

        // Add fields to default view
        await this.addFieldsToDefaultView(LIST_NAMES.SUB_CATEGORIES, [
          'Description',
          'Category',
          'IsActive'
        ]);

        console.log('Sub-Categories list created');
      }
    } catch (error) {
      console.error('Error creating Sub-Categories list:', error);
      throw error;
    }
  }

  /**
   * Create Tickets List
   */
  private async createTicketsList(): Promise<void> {
    try {
      const list = await this.sp.web.lists.ensure(LIST_NAMES.TICKETS, '', 100, true);

      if (list.created) {
        // Enable attachments
        await list.list.update({ EnableAttachments: true });

        // Add fields
        await list.list.fields.addMultilineText('Description', { RichText: true });
        await list.list.fields.addChoice('Status', {
          Choices: ['New', 'Open', 'In Progress', 'Waiting', 'Resolved', 'Closed', 'Reopened']
        });
        await list.list.fields.addChoice('Priority', {
          Choices: ['Low', 'Medium', 'High', 'Critical']
        });
        await list.list.fields.addChoice('Impact', {
          Choices: ['Individual', 'Department', 'Organization']
        });
        await list.list.fields.addChoice('Urgency', {
          Choices: ['Low', 'Medium', 'High', 'Critical']
        });

        const catListId = await this.getListId(LIST_NAMES.CATEGORIES);
        await list.list.fields.addLookup('Category', {
          LookupListId: catListId,
          LookupFieldName: 'Title'
        });

        const subCatListId = await this.getListId(LIST_NAMES.SUB_CATEGORIES);
        await list.list.fields.addLookup('SubCategory', {
          LookupListId: subCatListId,
          LookupFieldName: 'Title'
        });

        await list.list.fields.addUser('Requester', { SelectionMode: 1 });
        await list.list.fields.addUser('AssignedTo', { SelectionMode: 1 });
        await list.list.fields.addUser('CCUsers', { SelectionMode: 0 }); // 0 = Allow multiple selections
        await list.list.fields.addDateTime('ResolvedDate');
        await list.list.fields.addDateTime('SLADueDate');
        await list.list.fields.addChoice('SLAStatus', {
          Choices: ['Pending', 'Met', 'At Risk', 'Breached']
        });
        await list.list.fields.addNumber('ResolutionTime');

        // Add fields to default view
        await this.addFieldsToDefaultView(LIST_NAMES.TICKETS, [
          'Status',
          'Priority',
          'Category',
          'Requester',
          'AssignedTo',
          'SLAStatus',
          'Created',
          'Modified'
        ]);

        console.log('Tickets list created');
      }
    } catch (error) {
      console.error('Error creating Tickets list:', error);
      throw error;
    }
  }

  /**
   * Create Conversations List
   */
  private async createConversationsList(): Promise<void> {
    try {
      const list = await this.sp.web.lists.ensure(LIST_NAMES.CONVERSATIONS, '', 100, true);

      if (list.created) {
        // Enable attachments
        await list.list.update({ EnableAttachments: true });

        const ticketListId = await this.getListId(LIST_NAMES.TICKETS);
        await list.list.fields.addLookup('TicketID', {
          LookupListId: ticketListId,
          LookupFieldName: 'Title'
        });

        await list.list.fields.addMultilineText('Message', { RichText: true });
        await list.list.fields.addUser('SentBy', { SelectionMode: 1 });
        await list.list.fields.addBoolean('IsInternal');
        await list.list.fields.addChoice('MessageType', {
          Choices: ['User', 'Technician', 'System', 'Internal']
        });

        // Add fields to default view
        await this.addFieldsToDefaultView(LIST_NAMES.CONVERSATIONS, [
          'TicketID',
          'SentBy',
          'MessageType',
          'IsInternal',
          'Created'
        ]);

        console.log('Conversations list created');
      }
    } catch (error) {
      console.error('Error creating Conversations list:', error);
      throw error;
    }
  }

  /**
   * Create Knowledge Base List
   */
  private async createKnowledgeBaseList(): Promise<void> {
    try {
      const list = await this.sp.web.lists.ensure(LIST_NAMES.KNOWLEDGE_BASE, '', 100, true);

      if (list.created) {
        await list.list.fields.addMultilineText('Content', { RichText: true });

        const catListId = await this.getListId(LIST_NAMES.CATEGORIES);
        await list.list.fields.addLookup('Category', {
          LookupListId: catListId,
          LookupFieldName: 'Title'
        });

        await list.list.fields.addMultilineText('Keywords');
        await list.list.fields.addNumber('Views');
        await list.list.fields.addNumber('Helpful');
        await list.list.fields.addNumber('NotHelpful');
        await list.list.fields.addBoolean('IsPublished');
        await list.list.fields.addUser('Author', { SelectionMode: 1 });
        await list.list.fields.addDateTime('PublishedDate');

        // Add fields to default view
        await this.addFieldsToDefaultView(LIST_NAMES.KNOWLEDGE_BASE, [
          'Category',
          'Author',
          'IsPublished',
          'Views',
          'Helpful',
          'NotHelpful',
          'PublishedDate'
        ]);

        console.log('Knowledge Base list created');
      }
    } catch (error) {
      console.error('Error creating Knowledge Base list:', error);
      throw error;
    }
  }

  /**
   * Create FAQs List
   */
  private async createFAQsList(): Promise<void> {
    try {
      const list = await this.sp.web.lists.ensure(LIST_NAMES.FAQS, '', 100, true);

      if (list.created) {
        await list.list.fields.addMultilineText('Question');
        await list.list.fields.addMultilineText('Answer', { RichText: true });

        const catListId = await this.getListId(LIST_NAMES.CATEGORIES);
        await list.list.fields.addLookup('Category', {
          LookupListId: catListId,
          LookupFieldName: 'Title'
        });

        await list.list.fields.addNumber('Order');
        await list.list.fields.addBoolean('IsActive');
        await list.list.fields.addNumber('Views');
        await list.list.fields.addNumber('Helpful');

        // Add fields to default view
        await this.addFieldsToDefaultView(LIST_NAMES.FAQS, [
          'Question',
          'Category',
          'Order',
          'IsActive',
          'Views',
          'Helpful'
        ]);

        console.log('FAQs list created');
      }
    } catch (error) {
      console.error('Error creating FAQs list:', error);
      throw error;
    }
  }

  /**
   * Create SLA Config List
   */
  private async createSLAConfigList(): Promise<void> {
    try {
      const list = await this.sp.web.lists.ensure(LIST_NAMES.SLA_CONFIG, '', 100, true);

      if (list.created) {
        await list.list.fields.addChoice('Priority', {
          Choices: ['Low', 'Medium', 'High', 'Critical']
        });
        await list.list.fields.addChoice('Impact', {
          Choices: ['Individual', 'Department', 'Organization']
        });
        await list.list.fields.addNumber('ResponseTimeHours');
        await list.list.fields.addNumber('ResolutionTimeHours');
        await list.list.fields.addNumber('WorkingHoursStart');
        await list.list.fields.addNumber('WorkingHoursEnd');
        await list.list.fields.addBoolean('ExcludeWeekends');

        // Add fields to default view
        await this.addFieldsToDefaultView(LIST_NAMES.SLA_CONFIG, [
          'Priority',
          'Impact',
          'ResponseTimeHours',
          'ResolutionTimeHours',
          'WorkingHoursStart',
          'WorkingHoursEnd',
          'ExcludeWeekends'
        ]);

        console.log('SLA Config list created');
      }
    } catch (error) {
      console.error('Error creating SLA Config list:', error);
      throw error;
    }
  }

  /**
   * Add initial data (categories, SLA config, etc.)
   */
  private async addInitialData(onProgress?: (status: IProvisioningStatus) => void): Promise<void> {
    // Add categories
    onProgress?.({ isProvisioned: false, listsCreated: true, groupsCreated: true, mockDataAdded: false, progress: 75, currentStep: 'Adding Categories...' });
    await this.addDefaultCategories();

    // Add sub-categories
    onProgress?.({ isProvisioned: false, listsCreated: true, groupsCreated: true, mockDataAdded: false, progress: 80, currentStep: 'Adding Sub-Categories...' });
    await this.addDefaultSubCategories();

    // Add SLA config
    onProgress?.({ isProvisioned: false, listsCreated: true, groupsCreated: true, mockDataAdded: false, progress: 85, currentStep: 'Adding SLA Configuration...' });
    await this.addDefaultSLAConfig();

    // Add sample KB articles and FAQs
    onProgress?.({ isProvisioned: false, listsCreated: true, groupsCreated: true, mockDataAdded: false, progress: 90, currentStep: 'Adding Sample Data...' });
    await this.addSampleKBAndFAQs();
  }

  /**
   * Add default categories
   */
  private async addDefaultCategories(): Promise<void> {
    try {
      const list = this.sp.web.lists.getByTitle(LIST_NAMES.CATEGORIES);

      for (const category of DEFAULT_CATEGORIES) {
        await list.items.add({
          Title: category.Title,
          Description: category.Description,
          IsActive: true,
          SLAHours: category.SLAHours
        });
      }

      console.log('Default categories added');
    } catch (error) {
      console.error('Error adding default categories:', error);
      throw error;
    }
  }

  /**
   * Add default sub-categories
   */
  private async addDefaultSubCategories(): Promise<void> {
    try {
      // Get category IDs
      const catList = this.sp.web.lists.getByTitle(LIST_NAMES.CATEGORIES);
      const categories = await catList.items.select('Id', 'Title')();

      const subCatList = this.sp.web.lists.getByTitle(LIST_NAMES.SUB_CATEGORIES);

      for (const subCat of DEFAULT_SUB_CATEGORIES) {
        const category = categories.find(c => c.Title === subCat.Category);
        if (category) {
          await subCatList.items.add({
            Title: subCat.Title,
            Description: '',
            CategoryId: category.Id,
            IsActive: true
          });
        }
      }

      console.log('Default sub-categories added');
    } catch (error) {
      console.error('Error adding default sub-categories:', error);
      throw error;
    }
  }

  /**
   * Add default SLA configuration
   */
  private async addDefaultSLAConfig(): Promise<void> {
    try {
      const list = this.sp.web.lists.getByTitle(LIST_NAMES.SLA_CONFIG);

      for (const config of DEFAULT_SLA_CONFIG) {
        await list.items.add({
          Title: `${config.Priority} - ${config.Impact}`,
          Priority: config.Priority,
          Impact: config.Impact,
          ResponseTimeHours: config.ResponseTimeHours,
          ResolutionTimeHours: config.ResolutionTimeHours,
          WorkingHoursStart: 9,
          WorkingHoursEnd: 17,
          ExcludeWeekends: true
        });
      }

      console.log('Default SLA config added');
    } catch (error) {
      console.error('Error adding default SLA config:', error);
      throw error;
    }
  }

  /**
   * Add sample KB articles and FAQs
   */
  private async addSampleKBAndFAQs(): Promise<void> {
    try {
      // Add sample KB articles
      const kbList = this.sp.web.lists.getByTitle(LIST_NAMES.KNOWLEDGE_BASE);
      const catList = this.sp.web.lists.getByTitle(LIST_NAMES.CATEGORIES);
      const categories = await catList.items.select('Id', 'Title')();

      const hardwareCat = categories.find(c => c.Title === 'Hardware');
      const softwareCat = categories.find(c => c.Title === 'Software');

      if (hardwareCat) {
        await kbList.items.add({
          Title: 'How to Connect to WiFi Network',
          Content: '<p>Follow these steps to connect to the corporate WiFi network:</p><ol><li>Click on the WiFi icon in the taskbar</li><li>Select the network name</li><li>Enter your credentials</li><li>Click Connect</li></ol>',
          CategoryId: hardwareCat.Id,
          Keywords: 'wifi;network;connection;internet',
          Views: 0,
          Helpful: 0,
          NotHelpful: 0,
          IsPublished: true,
          PublishedDate: new Date()
        });
      }

      if (softwareCat) {
        await kbList.items.add({
          Title: 'How to Reset Your Email Password',
          Content: '<p>To reset your email password:</p><ol><li>Go to the IT Portal</li><li>Click on "Reset Password"</li><li>Verify your identity</li><li>Create a new password</li></ol>',
          CategoryId: softwareCat.Id,
          Keywords: 'email;password;reset;outlook',
          Views: 0,
          Helpful: 0,
          NotHelpful: 0,
          IsPublished: true,
          PublishedDate: new Date()
        });
      }

      // Add sample FAQs
      const faqList = this.sp.web.lists.getByTitle(LIST_NAMES.FAQS);

      await faqList.items.add({
        Title: 'FAQ 1',
        Question: 'How do I submit a help desk ticket?',
        Answer: '<p>Click on the "Create New Ticket" button, fill in the required information, and submit. You will receive a confirmation email with your ticket number.</p>',
        CategoryId: null,
        Order: 1,
        IsActive: true,
        Views: 0,
        Helpful: 0
      });

      await faqList.items.add({
        Title: 'FAQ 2',
        Question: 'What is the SLA for critical tickets?',
        Answer: '<p>Critical tickets are responded to within 1-4 hours depending on the impact level. We aim to resolve them within 4-12 hours.</p>',
        CategoryId: null,
        Order: 2,
        IsActive: true,
        Views: 0,
        Helpful: 0
      });

      console.log('Sample KB articles and FAQs added');
    } catch (error) {
      console.error('Error adding sample KB and FAQs:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Get list ID by title
   */
  private async getListId(listTitle: string): Promise<string> {
    const list = await this.sp.web.lists.getByTitle(listTitle)();
    return list.Id;
  }

  /**
   * Add fields to default view with retry logic
   */
  private async addFieldsToDefaultView(listTitle: string, fieldNames: string[]): Promise<void> {
    try {
      // Longer delay to ensure list and all fields are fully provisioned
      await new Promise(resolve => setTimeout(resolve, 1000));

      const list = this.sp.web.lists.getByTitle(listTitle);
      const defaultView = list.defaultView;

      for (const fieldName of fieldNames) {
        try {
          await defaultView.fields.add(fieldName);
          console.log(`  ✓ Added ${fieldName} to ${listTitle} view`);
        } catch (e) {
          // Field might already be in view or lookup not ready yet
          if (e.message && e.message.includes('already exists')) {
            console.log(`  ⊘ ${fieldName} already in ${listTitle} view`);
          } else {
            console.warn(`  ✗ Could not add ${fieldName} to ${listTitle} view:`, e.message);
          }
        }
      }

      console.log(`✓ Fields configuration complete for ${listTitle} AllItems view`);
    } catch (error) {
      console.error(`Error adding fields to ${listTitle} view:`, error);
      // Don't throw - view configuration is not critical
    }
  }
}
