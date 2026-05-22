import React from 'react';
import { useStore } from './store';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { PredictModal } from './components/PredictModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { JoinGroupModal } from './components/JoinGroupModal';
import { GroupSettingsModal } from './components/GroupSettingsModal';

// Screens
import { SplashScreen } from './screens/SplashScreen';
import { AuthScreen } from './screens/AuthScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { PredictionsScreen } from './screens/PredictionsScreen';
import { GroupsScreen } from './screens/GroupsScreen';
import { GroupDetailScreen } from './screens/GroupDetailScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MatchLeaderboardScreen } from './screens/MatchLeaderboardScreen';

const App: React.FC = () => {
  const { currentScreen, toastMessage } = useStore();

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'screen-splash':
        return <SplashScreen />;
      case 'screen-auth':
        return <AuthScreen />;
      case 'screen-dashboard':
        return <DashboardScreen />;
      case 'screen-predictions':
        return <PredictionsScreen />;
      case 'screen-groups':
        return <GroupsScreen />;
      case 'screen-group-detail':
        return <GroupDetailScreen />;
      case 'screen-profile':
        return <ProfileScreen />;
      case 'screen-match-leaderboard':
        return <MatchLeaderboardScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="app">
      {/* Toast Notification global */}
      <div className={`toast ${toastMessage ? 'active' : ''}`} id="copyToast">
        {toastMessage}
      </div>

      {/* Cabecera global */}
      <Header />

      {/* Contenedor de pantalla activa */}
      {renderActiveScreen()}

      {/* Barra de navegación inferior global */}
      <BottomNav />

      {/* Modales globales de la aplicación */}
      <PredictModal />
      <CreateGroupModal />
      <JoinGroupModal />
      <GroupSettingsModal />
    </div>
  );
};

export default App;
