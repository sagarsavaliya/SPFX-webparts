import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { ICurrentUser, IProvisioningStatus, UserRole } from '../models';
import { SPService, UserService, ProvisioningService } from '../services';

/**
 * App Context State
 */
interface IAppContext {
  // Context
  webPartContext: WebPartContext | undefined;

  // User
  currentUser: ICurrentUser | undefined;
  isLoadingUser: boolean;

  // Provisioning
  provisioningStatus: IProvisioningStatus;
  isProvisioning: boolean;
  startProvisioning: () => Promise<void>;

  // Global state
  isLoading: boolean;
  error: string | undefined;
  setError: (error: string | undefined) => void;
}

/**
 * App Context
 */
const AppContext = createContext<IAppContext | undefined>(undefined);

/**
 * App Provider Props
 */
interface IAppProviderProps {
  webPartContext: WebPartContext;
  children: ReactNode;
}

/**
 * App Provider Component
 */
export const AppProvider: React.FC<IAppProviderProps> = ({ webPartContext, children }) => {
  const [currentUser, setCurrentUser] = useState<ICurrentUser | undefined>(undefined);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [provisioningStatus, setProvisioningStatus] = useState<IProvisioningStatus>({
    isProvisioned: false,
    listsCreated: false,
    groupsCreated: false,
    mockDataAdded: false,
    progress: 0,
    currentStep: 'Checking...'
  });
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);

  /**
   * Initialize services and check provisioning status
   */
  useEffect(() => {
    const initialize = async (): Promise<void> => {
      try {
        // Initialize SPService
        SPService.init(webPartContext);

        // Check provisioning status
        const sp = SPService.getSP();
        const provisioningService = new ProvisioningService(sp, webPartContext);
        const status = await provisioningService.checkProvisioningStatus();

        setProvisioningStatus(status);

        // Load current user - only check role if already provisioned
        // This prevents "group not found" warnings during initial load
        if (status.isProvisioned) {
          const user = await UserService.getCurrentUserWithRole();
          setCurrentUser(user);
        } else {
          // Just get basic user info without role check
          const sp = SPService.getSP();
          const currentUser = await sp.web.currentUser();
          setCurrentUser({
            Id: currentUser.Id,
            DisplayName: currentUser.Title,
            Email: currentUser.Email,
            LoginName: currentUser.LoginName,
            Role: UserRole.User,
            IsTechnician: false,
            IsManager: false,
            IsAdmin: false
          });
        }
        setIsLoadingUser(false);

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing app:', err);
        setError('Failed to initialize Help Desk. Please refresh the page.');
        setIsLoading(false);
        setIsLoadingUser(false);
      }
    };

    if (webPartContext) {
      void initialize();
    }
  }, [webPartContext]);

  /**
   * Start provisioning process
   */
  const startProvisioning = async (): Promise<void> => {
    try {
      setIsProvisioning(true);
      setError(undefined);

      const sp = SPService.getSP();
      const provisioningService = new ProvisioningService(sp, webPartContext);

      // Run provisioning with progress updates
      await provisioningService.provisionHelpDesk((status) => {
        setProvisioningStatus(status);
      });

      // Provisioning complete
      setIsProvisioning(false);

      // Reload user to get updated role
      const user = await UserService.getCurrentUserWithRole();
      setCurrentUser(user);

    } catch (err) {
      console.error('Provisioning failed:', err);
      setError('Provisioning failed. Please try again or contact your administrator.');
      setIsProvisioning(false);
    }
  };

  const contextValue: IAppContext = {
    webPartContext,
    currentUser,
    isLoadingUser,
    provisioningStatus,
    isProvisioning,
    startProvisioning,
    isLoading,
    error,
    setError
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Hook to use App Context
 */
export const useAppContext = (): IAppContext => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
