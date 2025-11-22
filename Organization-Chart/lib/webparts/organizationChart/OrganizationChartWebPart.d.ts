import { Version } from '@microsoft/sp-core-library';
import { type IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';
export interface TabConfig {
    id: string;
    name: string;
    topPersonEmail: string;
}
export interface IOrganizationChartWebPartProps {
    description: string;
    dataSource: 'azureAD' | 'json';
    maxHierarchyDepth: number;
    defaultExpandDepth: number;
    tabs: TabConfig[];
    enableFilters: boolean;
    enableProfileModal: boolean;
    enableLazyLoading: boolean;
}
interface OrgNode {
    id: string;
    name: string;
    title: string;
    department: string;
    photoUrl?: string;
    children?: OrgNode[];
    directCount?: number;
    reportingCount?: number;
}
export default class OrganizationChartWebPart extends BaseClientSideWebPart<IOrganizationChartWebPartProps> {
    private graphService;
    private orgData;
    private graphReadyPromise;
    private isLoadingData;
    private currentActiveDept;
    render(): Promise<void>;
    private loadInitialData;
    protected onInit(): Promise<void>;
    protected onAfterRender(): void;
    private showError;
    private loadOrgData;
    handleTabSwitch(tabName: string): Promise<void>;
    private transformGraphUserToOrgNodeWithCounts;
    private transformGraphUserToOrgNodeAsync;
    loadNodeChildren(nodeId: string): Promise<OrgNode[]>;
    private transformGraphUserToOrgNode;
    private calculateReportingCount;
    protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void;
    protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): void;
    protected get dataVersion(): Version;
    protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration;
}
export {};
//# sourceMappingURL=OrganizationChartWebPart.d.ts.map