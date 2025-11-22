import { type IPropertyPaneCustomFieldProps, type IPropertyPaneField, PropertyPaneFieldType } from '@microsoft/sp-property-pane';
import { TabConfig } from '../OrganizationChartWebPart';
export interface ITabsPropertyPaneProps {
    tabs: TabConfig[];
    onTabsChange: (tabs: TabConfig[]) => void;
}
type ITabsPropertyPaneInternalProps = ITabsPropertyPaneProps & IPropertyPaneCustomFieldProps;
export declare class TabsPropertyPane implements IPropertyPaneField<ITabsPropertyPaneInternalProps> {
    type: PropertyPaneFieldType;
    targetProperty: string;
    properties: ITabsPropertyPaneInternalProps;
    private elem;
    constructor(targetProperty: string, properties: ITabsPropertyPaneProps);
    private onRender;
    private onDispose;
    render(): void;
    private renderContent;
    private createTabCard;
    private handleTabNameChange;
    private handleTopPersonChange;
    private handleDeleteTab;
    private handleAddTab;
    private updateTabs;
}
export declare function PropertyPaneTabsField(targetProperty: string, properties: ITabsPropertyPaneProps): IPropertyPaneField<ITabsPropertyPaneInternalProps>;
export {};
//# sourceMappingURL=TabsPropertyPane.d.ts.map