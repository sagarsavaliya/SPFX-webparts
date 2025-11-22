import { WebPartContext } from '@microsoft/sp-webpart-base';
export interface GraphUser {
    id: string;
    displayName: string;
    jobTitle: string;
    department: string;
    mail: string;
    mobilePhone: string;
    businessPhones: string[];
    officeLocation: string;
    manager?: GraphUser;
    directReports?: GraphUser[];
}
export declare class GraphService {
    private context;
    private graphClient;
    private userCache;
    private photoCache;
    private subordinatesCountCache;
    constructor(context: WebPartContext);
    init(): Promise<void>;
    getCurrentUser(): Promise<GraphUser>;
    getUserById(userId: string): Promise<GraphUser>;
    getUserPhoto(userId: string): Promise<string | undefined>;
    getDirectReports(userId: string): Promise<GraphUser[]>;
    getManager(userId: string): Promise<GraphUser | undefined>;
    buildOrgHierarchy(startUserId: string, maxDepth?: number, currentDepth?: number): Promise<GraphUser>;
    searchUsers(searchTerm: string): Promise<GraphUser[]>;
    getUserByEmail(email: string): Promise<GraphUser | undefined>;
    getAllUsers(): Promise<GraphUser[]>;
    /**
     * Gets the total count of all subordinates (direct and indirect) for a user
     * @param userId - The user ID to count subordinates for
     * @returns The total number of people reporting to this user (directly or indirectly)
     */
    getTotalSubordinatesCount(userId: string): Promise<number>;
}
//# sourceMappingURL=GraphService.d.ts.map