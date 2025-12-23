import { SPService } from './SPService';
import { LIST_NAMES } from '../utils/Constants';
import { IFAQ, IFAQForm, IFAQByCategory } from '../models';

/**
 * FAQ Service
 * Handles all FAQ operations
 */
export class FAQService {
  /**
   * Get all FAQs, optionally filtered by category
   */
  public static async getFAQs(categoryId?: number): Promise<IFAQ[]> {
    try {
      const sp = SPService.getSP();
      let query = sp.web.lists.getByTitle(LIST_NAMES.FAQS).items
        .select(
          'Id', 'Question', 'Answer', 'Order', 'IsActive',
          'Views', 'Helpful', 'Created', 'Modified',
          'Category/Id', 'Category/Title'
        )
        .expand('Category')
        .filter('IsActive eq 1')
        .orderBy('Order', true);

      if (categoryId) {
        query = query.filter(`Category/Id eq ${categoryId}`);
      }

      const items = await query();

      return items.map((item: any) => ({
        Id: item.Id,
        Question: item.Question,
        Answer: item.Answer,
        CategoryId: item.Category?.Id,
        CategoryTitle: item.Category?.Title,
        Order: item.Order,
        IsActive: item.IsActive,
        Views: item.Views || 0,
        Helpful: item.Helpful || 0,
        Created: new Date(item.Created),
        Modified: new Date(item.Modified)
      }));
    } catch (error) {
      console.error('Error getting FAQs:', error);
      throw error;
    }
  }

  /**
   * Get FAQs grouped by category
   */
  public static async getFAQsByCategory(): Promise<IFAQByCategory[]> {
    try {
      const faqs = await this.getFAQs();

      // Group FAQs by category
      const grouped: Map<number, IFAQByCategory> = new Map();

      faqs.forEach(faq => {
        if (faq.CategoryId && faq.CategoryTitle) {
          if (!grouped.has(faq.CategoryId)) {
            grouped.set(faq.CategoryId, {
              categoryId: faq.CategoryId,
              categoryTitle: faq.CategoryTitle,
              faqs: []
            });
          }
          grouped.get(faq.CategoryId)!.faqs.push(faq);
        }
      });

      const result: IFAQByCategory[] = [];
      grouped.forEach(value => result.push(value));
      return result;
    } catch (error) {
      console.error('Error getting FAQs by category:', error);
      throw error;
    }
  }

  /**
   * Get FAQ by ID
   */
  public static async getFAQById(faqId: number): Promise<IFAQ> {
    try {
      const sp = SPService.getSP();
      const item = await sp.web.lists.getByTitle(LIST_NAMES.FAQS).items
        .getById(faqId)
        .select(
          'Id', 'Question', 'Answer', 'Order', 'IsActive',
          'Views', 'Helpful', 'Created', 'Modified',
          'Category/Id', 'Category/Title'
        )
        .expand('Category')();

      // Increment view count
      await sp.web.lists.getByTitle(LIST_NAMES.FAQS).items
        .getById(faqId)
        .update({ Views: (item.Views || 0) + 1 });

      return {
        Id: item.Id,
        Question: item.Question,
        Answer: item.Answer,
        CategoryId: item.Category?.Id,
        CategoryTitle: item.Category?.Title,
        Order: item.Order,
        IsActive: item.IsActive,
        Views: item.Views || 0,
        Helpful: item.Helpful || 0,
        Created: new Date(item.Created),
        Modified: new Date(item.Modified)
      };
    } catch (error) {
      console.error('Error getting FAQ:', error);
      throw error;
    }
  }

  /**
   * Create new FAQ
   */
  public static async createFAQ(form: IFAQForm): Promise<IFAQ> {
    try {
      const sp = SPService.getSP();

      const newItem = await sp.web.lists.getByTitle(LIST_NAMES.FAQS).items.add({
        Question: form.Question,
        Answer: form.Answer,
        CategoryId: form.CategoryId,
        Order: form.Order,
        IsActive: form.IsActive,
        Views: 0,
        Helpful: 0
      });

      return this.getFAQById(newItem.data.Id);
    } catch (error) {
      console.error('Error creating FAQ:', error);
      throw error;
    }
  }

  /**
   * Mark FAQ as helpful
   */
  public static async markHelpful(faqId: number): Promise<void> {
    try {
      const sp = SPService.getSP();
      const item = await sp.web.lists.getByTitle(LIST_NAMES.FAQS).items
        .getById(faqId)
        .select('Helpful')();

      await sp.web.lists.getByTitle(LIST_NAMES.FAQS).items
        .getById(faqId)
        .update({ Helpful: (item.Helpful || 0) + 1 });
    } catch (error) {
      console.error('Error marking FAQ as helpful:', error);
      throw error;
    }
  }
}
