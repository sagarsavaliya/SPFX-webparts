import '@pnp/sp/webs';
import '@pnp/sp/site-groups/web';
import '@pnp/sp/site-users/web';
import '@pnp/sp/profiles';
import { SPService } from './SPService';
import { GROUP_NAMES } from '../utils/Constants';
import { ICurrentUser, UserRole } from '../models';

export class UserService {
  /**
   * Get current user with role information
   */
  public static async getCurrentUserWithRole(): Promise<ICurrentUser> {
    try {
      const sp = SPService.getSP();
      const currentUser = await sp.web.currentUser();

      // Determine user role based on group membership
      const role = await this.determineUserRole();

      const userProfile: ICurrentUser = {
        Id: currentUser.Id,
        DisplayName: currentUser.Title,
        Email: currentUser.Email,
        LoginName: currentUser.LoginName,
        Role: role,
        IsTechnician: role === UserRole.Technician || role === UserRole.Manager || role === UserRole.Admin,
        IsManager: role === UserRole.Manager || role === UserRole.Admin,
        IsAdmin: role === UserRole.Admin
      };

      // Try to get additional profile information
      try {
        const profile = await sp.profiles.myProperties();
        userProfile.PhotoUrl = profile.PictureUrl;
        userProfile.JobTitle = profile.Title;
        userProfile.Department = profile.Department;
      } catch (error) {
        console.log('Could not load user profile properties:', error);
      }

      return userProfile;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  /**
   * Determine user role based on SharePoint group membership
   */
  private static async determineUserRole(): Promise<UserRole> {
    try {
      const sp = SPService.getSP();

      // Get all groups that the current user belongs to
      // This approach doesn't require elevated permissions
      const currentUser: any = await sp.web.currentUser.select('Id', 'Title', 'IsSiteAdmin').expand('Groups')();

      // Check if user is site admin first
      if (currentUser.IsSiteAdmin) {
        return UserRole.Admin;
      }

      // Get group titles that the user belongs to
      const userGroupTitles = currentUser.Groups?.map((g: any) => g.Title) || [];

      // Check role based on group membership (priority: Manager > Technician > User)
      if (userGroupTitles.includes(GROUP_NAMES.MANAGERS)) {
        return UserRole.Manager;
      }

      if (userGroupTitles.includes(GROUP_NAMES.TECHNICIANS)) {
        return UserRole.Technician;
      }

      if (userGroupTitles.includes(GROUP_NAMES.USERS)) {
        return UserRole.User;
      }

      // Default to User role if not in any HelpDesk group
      return UserRole.User;
    } catch (error) {
      console.error('Error determining user role:', error);
      return UserRole.User; // Default to User role on error
    }
  }

  /**
   * Get all technicians (for assignment)
   */
  public static async getTechnicians(): Promise<Array<{ Id: number; DisplayName: string; Email: string }>> {
    try {
      const sp = SPService.getSP();

      try {
        const users = await sp.web.siteGroups.getByName(GROUP_NAMES.TECHNICIANS).users();
        return users.map(u => ({
          Id: u.Id,
          DisplayName: u.Title,
          Email: u.Email
        }));
      } catch (error) {
        console.log('Technicians group not found:', error.message);
        return [];
      }
    } catch (error) {
      console.error('Error getting technicians:', error);
      return [];
    }
  }

  /**
   * Get all managers
   */
  public static async getManagers(): Promise<Array<{ Id: number; Title: string; Email: string }>> {
    try {
      const sp = SPService.getSP();

      try {
        const users = await sp.web.siteGroups.getByName(GROUP_NAMES.MANAGERS).users();
        return users.map(u => ({
          Id: u.Id,
          Title: u.Title,
          Email: u.Email
        }));
      } catch (error) {
        console.log('Managers group not found:', error.message);
        return [];
      }
    } catch (error) {
      console.error('Error getting managers:', error);
      return [];
    }
  }

  /**
   * Search users for people picker
   */
  public static async searchUsers(searchText: string): Promise<Array<{ Id: number; Title: string; Email: string }>> {
    try {
      const sp = SPService.getSP();

      const users = await sp.web.siteUsers
        .filter(`substringof('${searchText}', Title) or substringof('${searchText}', Email)`)
        .top(10)();

      return users.map(u => ({
        Id: u.Id,
        Title: u.Title,
        Email: u.Email
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Add user to a group
   */
  public static async addUserToGroup(userId: number, groupName: string): Promise<void> {
    try {
      const sp = SPService.getSP();

      await sp.web.siteGroups.getByName(groupName).users.add(`i:0#.f|membership|user${userId}@domain.com`);

      console.log(`User ${userId} added to ${groupName}`);
    } catch (error) {
      console.error('Error adding user to group:', error);
      throw error;
    }
  }

  /**
   * Remove user from a group
   */
  public static async removeUserFromGroup(userId: number, groupName: string): Promise<void> {
    try {
      const sp = SPService.getSP();

      await sp.web.siteGroups.getByName(groupName).users.removeById(userId);

      console.log(`User ${userId} removed from ${groupName}`);
    } catch (error) {
      console.error('Error removing user from group:', error);
      throw error;
    }
  }
}
