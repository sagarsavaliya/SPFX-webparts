/**
 * Category interface for ticket categorization
 */
export interface ICategory {
  Id: number;
  Title: string;
  Description?: string;
  IsActive: boolean;
  SLAHours: number; // Default SLA in hours
  SubCategories?: ISubCategory[];
}

/**
 * SubCategory interface
 */
export interface ISubCategory {
  Id: number;
  Title: string;
  Description?: string;
  CategoryId: number;
  CategoryTitle?: string;
  IsActive: boolean;
}

/**
 * Dropdown option for selects
 */
export interface ICategoryOption {
  key: number | string;
  text: string;
  disabled?: boolean;
}
