import { SPService } from './SPService';
import { LIST_NAMES } from '../utils/Constants';
import { IKBArticle, IKBArticleForm, IKBStats, IKBFilters } from '../models';

/**
 * Knowledge Base Service
 * Handles all KB article operations
 */
export class KBService {
  /**
   * Get all KB articles with optional filters
   */
  public static async getArticles(filters?: IKBFilters): Promise<IKBArticle[]> {
    try {
      const sp = SPService.getSP();
      let query = sp.web.lists.getByTitle(LIST_NAMES.KNOWLEDGE_BASE).items
        .select(
          'Id', 'Title', 'Content', 'Keywords', 'Views', 'Helpful', 'NotHelpful',
          'IsPublished', 'PublishedDate', 'Created', 'Modified',
          'Category/Id', 'Category/Title',
          'Author/Id', 'Author/Title', 'Author/EMail'
        )
        .expand('Category', 'Author');

      // Apply filters
      if (filters) {
        if (filters.isPublished !== undefined) {
          query = query.filter(`IsPublished eq ${filters.isPublished ? 1 : 0}`);
        } else {
          // Default to published only
          query = query.filter('IsPublished eq 1');
        }

        if (filters.categoryId) {
          query = query.filter(`Category/Id eq ${filters.categoryId}`);
        }

        if (filters.searchText) {
          const searchFilter = `(substringof('${filters.searchText}', Title) or substringof('${filters.searchText}', Content) or substringof('${filters.searchText}', Keywords))`;
          query = query.filter(searchFilter);
        }

        // Apply sorting
        if (filters.sortBy === 'popular') {
          query = query.orderBy('Views', false);
        } else if (filters.sortBy === 'helpful') {
          query = query.orderBy('Helpful', false);
        } else {
          // Default to recent
          query = query.orderBy('PublishedDate', false);
        }
      } else {
        query = query.filter('IsPublished eq 1').orderBy('PublishedDate', false);
      }

      query = query.top(100);

      const items = await query();

      return items.map((item: any) => ({
        Id: item.Id,
        Title: item.Title,
        Content: item.Content,
        CategoryId: item.Category?.Id,
        CategoryTitle: item.Category?.Title,
        Keywords: item.Keywords ? item.Keywords.split(';').filter((k: string) => k.trim()) : [],
        Views: item.Views || 0,
        Helpful: item.Helpful || 0,
        NotHelpful: item.NotHelpful || 0,
        IsPublished: item.IsPublished,
        AuthorId: item.Author?.Id,
        AuthorName: item.Author?.Title,
        AuthorEmail: item.Author?.EMail,
        Created: new Date(item.Created),
        Modified: new Date(item.Modified),
        PublishedDate: item.PublishedDate ? new Date(item.PublishedDate) : undefined
      }));
    } catch (error) {
      console.error('Error getting KB articles:', error);
      throw error;
    }
  }

  /**
   * Get article by ID
   */
  public static async getArticleById(articleId: number): Promise<IKBArticle> {
    try {
      const sp = SPService.getSP();
      const item = await sp.web.lists.getByTitle(LIST_NAMES.KNOWLEDGE_BASE).items
        .getById(articleId)
        .select(
          'Id', 'Title', 'Content', 'Keywords', 'Views', 'Helpful', 'NotHelpful',
          'IsPublished', 'PublishedDate', 'Created', 'Modified',
          'Category/Id', 'Category/Title',
          'Author/Id', 'Author/Title', 'Author/EMail'
        )
        .expand('Category', 'Author')();

      // Increment view count
      await sp.web.lists.getByTitle(LIST_NAMES.KNOWLEDGE_BASE).items
        .getById(articleId)
        .update({ Views: (item.Views || 0) + 1 });

      return {
        Id: item.Id,
        Title: item.Title,
        Content: item.Content,
        CategoryId: item.Category?.Id,
        CategoryTitle: item.Category?.Title,
        Keywords: item.Keywords ? item.Keywords.split(';').filter((k: string) => k.trim()) : [],
        Views: item.Views || 0,
        Helpful: item.Helpful || 0,
        NotHelpful: item.NotHelpful || 0,
        IsPublished: item.IsPublished,
        AuthorId: item.Author?.Id,
        AuthorName: item.Author?.Title,
        AuthorEmail: item.Author?.EMail,
        Created: new Date(item.Created),
        Modified: new Date(item.Modified),
        PublishedDate: item.PublishedDate ? new Date(item.PublishedDate) : undefined
      };
    } catch (error) {
      console.error('Error getting KB article:', error);
      throw error;
    }
  }

  /**
   * Create new KB article
   */
  public static async createArticle(form: IKBArticleForm): Promise<IKBArticle> {
    try {
      const sp = SPService.getSP();
      const currentUser = await sp.web.currentUser();

      const newItem = await sp.web.lists.getByTitle(LIST_NAMES.KNOWLEDGE_BASE).items.add({
        Title: form.Title,
        Content: form.Content,
        CategoryId: form.CategoryId,
        Keywords: form.Keywords.join(';'),
        Views: 0,
        Helpful: 0,
        NotHelpful: 0,
        IsPublished: form.IsPublished,
        AuthorId: currentUser.Id,
        PublishedDate: form.IsPublished ? new Date() : null
      });

      return this.getArticleById(newItem.data.Id);
    } catch (error) {
      console.error('Error creating KB article:', error);
      throw error;
    }
  }

  /**
   * Mark article as helpful
   */
  public static async markHelpful(articleId: number): Promise<void> {
    try {
      const sp = SPService.getSP();
      const item = await sp.web.lists.getByTitle(LIST_NAMES.KNOWLEDGE_BASE).items
        .getById(articleId)
        .select('Helpful')();

      await sp.web.lists.getByTitle(LIST_NAMES.KNOWLEDGE_BASE).items
        .getById(articleId)
        .update({ Helpful: (item.Helpful || 0) + 1 });
    } catch (error) {
      console.error('Error marking article as helpful:', error);
      throw error;
    }
  }

  /**
   * Mark article as not helpful
   */
  public static async markNotHelpful(articleId: number): Promise<void> {
    try {
      const sp = SPService.getSP();
      const item = await sp.web.lists.getByTitle(LIST_NAMES.KNOWLEDGE_BASE).items
        .getById(articleId)
        .select('NotHelpful')();

      await sp.web.lists.getByTitle(LIST_NAMES.KNOWLEDGE_BASE).items
        .getById(articleId)
        .update({ NotHelpful: (item.NotHelpful || 0) + 1 });
    } catch (error) {
      console.error('Error marking article as not helpful:', error);
      throw error;
    }
  }

  /**
   * Get KB statistics
   */
  public static async getStats(): Promise<IKBStats> {
    try {
      const sp = SPService.getSP();
      const allArticles = await sp.web.lists.getByTitle(LIST_NAMES.KNOWLEDGE_BASE).items
        .select('IsPublished', 'Views', 'Helpful', 'NotHelpful')();

      const publishedArticles = allArticles.filter((a: any) => a.IsPublished);
      const draftArticles = allArticles.filter((a: any) => !a.IsPublished);
      const totalViews = allArticles.reduce((sum: number, a: any) => sum + (a.Views || 0), 0);

      const totalHelpful = publishedArticles.reduce((sum: number, a: any) => sum + (a.Helpful || 0), 0);
      const totalNotHelpful = publishedArticles.reduce((sum: number, a: any) => sum + (a.NotHelpful || 0), 0);
      const totalRatings = totalHelpful + totalNotHelpful;
      const averageRating = totalRatings > 0 ? (totalHelpful / totalRatings) * 100 : 0;

      return {
        totalArticles: allArticles.length,
        publishedArticles: publishedArticles.length,
        draftArticles: draftArticles.length,
        totalViews,
        averageRating
      };
    } catch (error) {
      console.error('Error getting KB stats:', error);
      throw error;
    }
  }
}
