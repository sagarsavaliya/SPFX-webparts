interface OrgNode {
    id: string;
    name: string;
    title: string;
    department: string;
    photoUrl?: string;
    children?: OrgNode[];
    directCount?: number;
    reportingCount?: number;
    _dimensions?: {
        width: number;
        height: number;
        childrenHeight: number;
    };
}
interface Department {
    id: string;
    name: string;
    roots: OrgNode[];
}
interface OrgData {
    departments: Department[];
}
export declare function initOrgChart(container: HTMLElement, dataUrl: OrgData, styles: Record<string, string>, defaultExpandDepth?: number, onLoadChildren?: (nodeId: string) => Promise<OrgNode[]>, onTabSwitch?: (tabName: string) => Promise<void>, initialActiveDept?: string): void;
export {};
//# sourceMappingURL=orgChartLogic.d.ts.map