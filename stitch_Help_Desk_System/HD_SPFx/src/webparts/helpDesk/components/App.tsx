import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Header } from './shared/Header';
import { LoadingSpinner } from './shared/LoadingSpinner';
import { ProvisioningPanel } from './provisioning/ProvisioningPanel';
import { UserDashboard } from './dashboards/UserDashboard';
import { TechnicianDashboard } from './dashboards/TechnicianDashboard';
import { ManagerDashboard } from './dashboards/ManagerDashboard';
import { TicketForm } from './forms/TicketForm';
import { TicketDetailsPage } from './pages/TicketDetailsPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { FAQsPage } from './pages/FAQsPage';
import { UserRole } from '../models';
import styles from '../styles/common.module.scss';

/**
 * Route renderer
 */
const renderRoute = (
  route: string,
  onNavigate: (route: string) => void,
  userRole?: UserRole
): React.ReactElement => {
  // Parse route
  const pathParts = route.split('/').filter((x) => x);
  const basePath = pathParts[0] || 'dashboard';

  switch (basePath) {
    case 'dashboard':
      // Render role-specific dashboard
      if (userRole === UserRole.Manager || userRole === UserRole.Admin) {
        return <ManagerDashboard onNavigate={onNavigate} />;
      } else if (userRole === UserRole.Technician) {
        return <TechnicianDashboard onNavigate={onNavigate} />;
      } else {
        return <UserDashboard onNavigate={onNavigate} />;
      }

    case 'my-tickets':
      // My Tickets page - full ticket list with filters (User role only)
      // For other roles, redirect to their respective dashboards
      if (userRole === UserRole.Manager || userRole === UserRole.Admin) {
        return <ManagerDashboard onNavigate={onNavigate} />;
      } else if (userRole === UserRole.Technician) {
        return <TechnicianDashboard onNavigate={onNavigate} />;
      } else {
        return <MyTicketsPage onNavigate={onNavigate} />;
      }

    case 'ticket': {
      const ticketId = pathParts[1];
      if (ticketId === 'new') {
        return <TicketForm onNavigate={onNavigate} />;
      } else {
        return <TicketDetailsPage ticketId={Number(ticketId)} onNavigate={onNavigate} />;
      }
    }

    case 'kb':
      return <KnowledgeBasePage onNavigate={onNavigate} />;

    case 'faq':
      return <FAQsPage onNavigate={onNavigate} />;

    default:
      // Default to role-specific dashboard
      if (userRole === UserRole.Manager || userRole === UserRole.Admin) {
        return <ManagerDashboard onNavigate={onNavigate} />;
      } else if (userRole === UserRole.Technician) {
        return <TechnicianDashboard onNavigate={onNavigate} />;
      } else {
        return <UserDashboard onNavigate={onNavigate} />;
      }
  }
};

/**
 * Main App Component
 * Root component with routing and provisioning logic
 */
export const App: React.FC = () => {
  const { isLoading, provisioningStatus, currentUser } = useAppContext();
  const [currentRoute, setCurrentRoute] = useState<string>('/dashboard');

  // Handle navigation
  const handleNavigate = (route: string): void => {
    setCurrentRoute(route);
    window.location.hash = route;
  };

  // Listen to hash changes
  useEffect(() => {
    const handleHashChange = (): void => {
      const hash = window.location.hash.substring(1) || '/dashboard';
      setCurrentRoute(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial load

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.helpDeskRoot}>
        <div className={styles.contentWrapper}>
          <LoadingSpinner message="Initializing Help Desk..." />
        </div>
      </div>
    );
  }

  // Show provisioning panel if not provisioned
  if (!provisioningStatus.isProvisioned) {
    return <ProvisioningPanel />;
  }

  // Render main app
  return (
    <div className={styles.helpDeskRoot}>
      <div className={styles.contentWrapper}>
        <Header onNavigate={handleNavigate} currentRoute={currentRoute} />

        <main className={styles.mainContent}>
          {renderRoute(currentRoute, handleNavigate, currentUser?.Role)}
        </main>
      </div>
    </div>
  );
};
