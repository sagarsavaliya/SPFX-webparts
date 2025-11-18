import { MSGraphClientV3 } from '@microsoft/sp-http';
import { IEmployee, IAzureADGroup } from '../models/IEmployee';

export class GraphService {
  private graphClient: MSGraphClientV3;

  constructor(graphClient: MSGraphClientV3) {
    this.graphClient = graphClient;
  }

  /**
   * Get all Azure AD groups
   */
  public async getGroups(): Promise<IAzureADGroup[]> {
    try {
      const response = await this.graphClient
        .api('/groups')
        .version('v1.0')
        .select('id,displayName,description,mail')
        .filter('securityEnabled eq true')
        .top(999)
        .get();

      return response.value || [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  /**
   * Get members of a specific group with progressive loading
   */
  public async getGroupMembers(
    groupId: string,
    onProgress?: (loaded: number, total: number) => void,
    onInitialBatch?: (employees: IEmployee[]) => void,
    initialBatchSize: number = 40,
    onBatchUpdate?: (employees: IEmployee[]) => void
  ): Promise<IEmployee[]> {
    try {
      const employees: IEmployee[] = [];
      let nextLink: string | undefined = `/groups/${groupId}/members?$select=id,displayName,givenName,surname,jobTitle,department,officeLocation,mail,businessPhones,mobilePhone,userPrincipalName`;
      let totalFetched = 0;
      let estimatedTotal = 0;
      let initialBatchSent = false;

      while (nextLink) {
        const response = await this.graphClient
          .api(nextLink)
          .version('v1.0')
          .get();

        const members: any[] = response.value || [];

        // Filter only user accounts (exclude groups, devices, etc.)
        const users = members.filter(member => member['@odata.type'] === '#microsoft.graph.user');

        employees.push(...users.map(this.mapToEmployee));

        totalFetched += users.length;

        // Estimate total based on first batch
        if (estimatedTotal === 0 && response['@odata.nextLink']) {
          estimatedTotal = totalFetched * 10; // Rough estimate
        }

        if (onProgress) {
          const total = estimatedTotal || totalFetched;
          onProgress(totalFetched, Math.max(total, totalFetched));
        }

        // Send initial batch callback once we have enough employees
        if (!initialBatchSent && employees.length >= initialBatchSize && onInitialBatch) {
          initialBatchSent = true;
          // Send a copy of the first batch
          const initialBatch = employees.slice(0, initialBatchSize);
          // Fetch photos for initial batch only
          await this.fetchEmployeePhotos(initialBatch, undefined);
          onInitialBatch(initialBatch);
        } else if (initialBatchSent && onBatchUpdate) {
          // After initial batch, send progressive updates
          onBatchUpdate([...employees]);
        }

        nextLink = response['@odata.nextLink'];
      }

      // Fetch manager IDs for all employees
      await this.fetchManagerIds(employees);

      // Fetch photos for remaining employees (those not in initial batch)
      if (initialBatchSent && employees.length > initialBatchSize) {
        const remainingEmployees = employees.slice(initialBatchSize);
        await this.fetchEmployeePhotos(remainingEmployees, onProgress);
      } else if (!initialBatchSent) {
        // If we never hit the threshold, fetch all photos now
        await this.fetchEmployeePhotos(employees, onProgress);
      }

      // Calculate direct reports
      this.calculateDirectReports(employees);

      return employees;
    } catch (error) {
      console.error('Error fetching group members:', error);
      throw error;
    }
  }

  /**
   * Fetch manager IDs for all employees
   */
  private async fetchManagerIds(employees: IEmployee[]): Promise<void> {
    const batchSize = 20;

    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (employee) => {
          try {
            const managerResponse = await this.graphClient
              .api(`/users/${employee.id}/manager`)
              .version('v1.0')
              .select('id')
              .get();

            if (managerResponse?.id) {
              employee.managerId = managerResponse.id;
            }
          } catch (error) {
            // Manager not available, leave as undefined
            employee.managerId = undefined;
          }
        })
      );
    }
  }

  /**
   * Fetch photos for employees in batches
   */
  private async fetchEmployeePhotos(
    employees: IEmployee[],
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    const batchSize = 20;
    const total = employees.length;

    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (employee) => {
          try {
            const photoResponse: Blob = await this.graphClient
              .api(`/users/${employee.id}/photo/$value`)
              .version('v1.0')
              .get();

            if (photoResponse) {
              const url = window.URL.createObjectURL(photoResponse);
              employee.photo = url;
            }
          } catch (error) {
            // Photo not available, use default
            employee.photo = undefined;
          }
        })
      );

      if (onProgress) {
        const loaded = Math.min(i + batchSize, total);
        onProgress(loaded, total);
      }
    }
  }

  /**
   * Search users across the organization
   */
  public async searchUsers(query: string): Promise<IEmployee[]> {
    try {
      const response = await this.graphClient
        .api('/users')
        .version('v1.0')
        .select('id,displayName,givenName,surname,jobTitle,department,officeLocation,mail,businessPhones,mobilePhone,userPrincipalName')
        .filter(`startswith(displayName,'${query}') or startswith(givenName,'${query}') or startswith(surname,'${query}') or startswith(mail,'${query}')`)
        .top(50)
        .get();

      const employees = (response.value || []).map(this.mapToEmployee);
      await this.fetchEmployeePhotos(employees);

      return employees;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Calculate direct reports for each employee
   */
  private calculateDirectReports(employees: IEmployee[]): void {
    employees.forEach(employee => {
      employee.directReports = employees
        .filter(emp => emp.managerId === employee.id)
        .map(emp => emp.id);
    });
  }

  /**
   * Map Graph API user object to IEmployee interface
   */
  private mapToEmployee(user: any): IEmployee {
    return {
      id: user.id,
      displayName: user.displayName || '',
      givenName: user.givenName || '',
      surname: user.surname || '',
      jobTitle: user.jobTitle || 'N/A',
      department: user.department || 'N/A',
      officeLocation: user.officeLocation || 'N/A',
      mail: user.mail || user.userPrincipalName || '',
      businessPhones: user.businessPhones || [],
      mobilePhone: user.mobilePhone || '',
      userPrincipalName: user.userPrincipalName || '',
      photo: undefined,
      managerId: undefined,
      directReports: []
    };
  }
}
