/**
 * FAQ (Frequently Asked Questions) interface
 */
export interface IFAQ {
  Id: number;
  Question: string;
  Answer: string; // Rich HTML content
  CategoryId?: number;
  CategoryTitle?: string;
  Order: number; // Display order
  IsActive: boolean;
  Views?: number;
  Helpful?: number;
  Created: Date;
  Modified: Date;
}

/**
 * FAQ create/edit form
 */
export interface IFAQForm {
  Question: string;
  Answer: string;
  CategoryId: number | undefined;
  Order: number;
  IsActive: boolean;
}

/**
 * FAQ grouped by category
 */
export interface IFAQByCategory {
  categoryId: number;
  categoryTitle: string;
  faqs: IFAQ[];
}
