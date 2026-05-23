import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Splash } from '@/pages/Splash';
import { Auth } from '@/pages/Auth';
import { Dashboard } from '@/pages/Dashboard';
import { PredictionsHub } from '@/pages/PredictionsHub';
import { GroupsHub } from '@/pages/GroupsHub';
import { Profile } from '@/pages/Profile';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { Navbar } from '@/components/Navbar';
import { PredictModal } from '@/components/PredictModal';
import { RulesModal } from '@/components/RulesModal';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false, // Never retry automatically on failure (prevents infinite loop)
      staleTime: 5 * 60 * 1000, // Cache results for 5 minutes to avoid constant server polling
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('API Query Error:', error);
      useUIStore.getState().showToast('No se pudo ejecutar la acción', 'error');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error('API Mutation Error:', error);
      useUIStore.getState().showToast('No se pudo ejecutar la acción', 'error');
    },
  }),
});

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { activeTab, toast } = useUIStore();

  // 1. Show Animated Splash on initial load
  if (isLoading) {
    return <Splash />;
  }

  // 2. Show Authentication screen if not logged in
  if (!isAuthenticated) {
    return <Auth />;
  }

  // 3. Render Active Page Component based on navigation active tab
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'predictions':
        return <PredictionsHub />;
      case 'groups':
        return <GroupsHub />;
      case 'profile':
        return <Profile />;
      case 'admin':
        const adminList = (import.meta.env.VITE_ADMIN_NICKNAMES || 'admin,fernando').split(',').map((n: string) => n.trim().toLowerCase());
        if (user && adminList.includes(user.nickname.toLowerCase())) {
          return <AdminDashboard />;
        }
        return <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'PRODE';
      case 'predictions':
        return 'PRONÓSTICOS';
      case 'groups':
        return 'LIGAS';
      case 'profile':
        return 'MI CUENTA';
      case 'admin':
        return 'ADMINISTRACIÓN';
      default:
        return 'PRODE';
    }
  };

  // Determine Toast Neon Shadows
  const getToastColor = () => {
    if (!toast) return {};
    if (toast.type === 'error') {
      return { background: 'var(--red)', boxShadow: '0 6px 0 #C92A2A, 0 8px 15px rgba(0, 0, 0, 0.2)' };
    }
    if (toast.type === 'info') {
      return { background: 'var(--blue)', boxShadow: '0 6px 0 #1C7ED6, 0 8px 15px rgba(0, 0, 0, 0.2)' };
    }
    return { background: 'var(--green)', boxShadow: '0 6px 0 #00A86B, 0 8px 15px rgba(0, 0, 0, 0.2)' };
  };

  return (
    <div className="app">
      {/* Dynamic Floating Toast Notification */}
      <div 
        className={`toast ${toast ? 'active' : ''}`}
        style={getToastColor()}
      >
        {toast?.message}
      </div>

      {/* Main Header Bar */}
      <header className="header">
        <h2 style={{ color: 'var(--white)', textTransform: 'uppercase' }}>
          {getHeaderTitle()}
        </h2>
        <span 
          style={{
            fontSize: '10px',
            fontWeight: '900',
            background: 'rgba(255, 203, 71, 0.12)',
            border: '1px solid rgba(255, 203, 71, 0.3)',
            padding: '3px 8px',
            borderRadius: '8px',
            color: 'var(--yellow)',
            letterSpacing: '1px'
          }}
        >
          ⚽ MUNDIAL '26
        </span>
      </header>

      {/* Active Scrollable Content Area */}
      {renderScreen()}

      {/* Common Floating Predictions Modal */}
      <PredictModal />

      {/* Scoring Rules Modal */}
      <RulesModal />

      {/* Custom PWA Install Banner */}
      <PWAInstallBanner />

      {/* Bottom Sticky Mobile Navbar */}
      <Navbar />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
