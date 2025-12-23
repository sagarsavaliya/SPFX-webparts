import { WebPartContext } from '@microsoft/sp-webpart-base';
import { spfi, SPFI, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/batching';

/**
 * Base SharePoint service for all SP operations
 * Provides configured SPFI instance and common methods
 */
export class SPService {
  private static sp: SPFI;
  private static context: WebPartContext;

  /**
   * Initialize SPService with WebPart context
   */
  public static init(context: WebPartContext): void {
    this.context = context;
    this.sp = spfi().using(SPFx(context));
  }

  /**
   * Get configured SPFI instance
   */
  public static getSP(): SPFI {
    if (!this.sp) {
      throw new Error('SPService not initialized. Call SPService.init(context) first.');
    }
    return this.sp;
  }

  /**
   * Get WebPartContext
   */
  public static getContext(): WebPartContext {
    if (!this.context) {
      throw new Error('SPService not initialized. Call SPService.init(context) first.');
    }
    return this.context;
  }

  /**
   * Get current user
   */
  public static async getCurrentUser(): Promise<{
    Id: number;
    Title: string;
    Email: string;
    LoginName: string;
  }> {
    const user = await this.sp.web.currentUser();
    return {
      Id: user.Id,
      Title: user.Title,
      Email: user.Email,
      LoginName: user.LoginName
    };
  }

  /**
   * Get site URL
   */
  public static getSiteUrl(): string {
    return this.context.pageContext.web.absoluteUrl;
  }

  /**
   * Get web server relative URL
   */
  public static getWebServerRelativeUrl(): string {
    return this.context.pageContext.web.serverRelativeUrl;
  }
}
