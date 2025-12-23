/**
 * User interface for help desk users
 */
export interface IUser {
  Id: number;
  Title: string; // Display name
  Email: string;
  LoginName?: string;
  JobTitle?: string;
  Department?: string;
  PhotoUrl?: string;
  Phone?: string;
  Role: UserRole;
  IsActive: boolean;
}

export enum UserRole {
  User = 'User', // Regular end user
  Technician = 'Technician', // Support technician
  Manager = 'Manager', // Help desk manager
  Admin = 'Admin' // System administrator
}

/**
 * Current user context
 */
export interface ICurrentUser {
  Id: number;
  DisplayName: string;
  Email: string;
  LoginName: string;
  Role: UserRole;
  PhotoUrl?: string;
  JobTitle?: string;
  Department?: string;
  IsTechnician: boolean;
  IsManager: boolean;
  IsAdmin: boolean;
}

/**
 * User selection for people picker
 */
export interface IUserSelection {
  Id: number;
  Email: string;
  DisplayName: string;
  PhotoUrl?: string;
}
