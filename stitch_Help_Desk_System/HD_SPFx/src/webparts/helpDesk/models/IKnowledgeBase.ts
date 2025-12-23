/**
 * Knowledge Base Article interface
 */
export interface IKBArticle {
  Id: number;
  Title: string;
  Content: string; // Rich HTML content
  CategoryId?: number;
  CategoryTitle?: string;
  SubCategoryId?: number;
  SubCategoryTitle?: string;
  Keywords?: string[];
  Views: number;
  Helpful: number;
  NotHelpful: number;
  IsPublished: boolean;
  AuthorId?: number;
  AuthorName?: string;
  AuthorEmail?: string;
  Created: Date;
  Modified: Date;
  PublishedDate?: Date;
}

/**
 * KB Article create/edit form
 */
export interface IKBArticleForm {
  Title: string;
  Content: string;
  CategoryId: number | undefined;
  SubCategoryId: number | undefined;
  Keywords: string[];
  IsPublished: boolean;
}

/**
 * KB Article statistics
 */
export interface IKBStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  averageRating: number;
}

/**
 * KB Article filters
 */
export interface IKBFilters {
  categoryId?: number;
  searchText?: string;
  isPublished?: boolean;
  sortBy?: 'recent' | 'popular' | 'helpful';
}
