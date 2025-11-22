import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
export interface IModernCewpWebPartProps {
    spPageContextInfo: boolean;
    content: string;
    contentLink: string;
}
export default class ModernCewpWebPart extends BaseClientSideWebPart<IModernCewpWebPartProps> {
    /**
     * Helper method to execute scripts from HTML content
     * Scripts inserted via innerHTML don't execute automatically, so we need to extract and execute them manually
     * This method ensures scripts execute in order and waits for external scripts to load
     */
    private executeScripts;
    /**
     * Helper method to safely insert HTML content and execute any scripts
     */
    private insertHtmlWithScripts;
    /**
     * Helper method to resolve relative URLs to absolute URLs
     */
    private resolveUrl;
    /**
     * Helper method to load content from a URL with proper authentication
     */
    private loadContentFromUrl;
    _renderEdit(): void;
    _renderView(): void;
    render(): void;
    protected get dataVersion(): Version;
    protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration;
}
//# sourceMappingURL=ModernCewpWebPart.d.ts.map