import React from 'react';
import { store, useStore } from '../store';

export const BottomNav: React.FC = () => {
  const { currentScreen } = useStore();

  // Ocultar barra de navegación inferior en splash y auth
  if (currentScreen === 'screen-splash' || currentScreen === 'screen-auth') {
    return null;
  }

  // Mapeo de pantalla a pestaña activa
  const getActiveTab = () => {
    if (currentScreen === 'screen-dashboard') return 'dashboard';
    if (currentScreen === 'screen-predictions') return 'predictions';
    if (currentScreen.startsWith('screen-group')) return 'groups';
    if (currentScreen === 'screen-profile') return 'profile';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: string) => {
    store.navigateTo(`screen-${tab}`);
  };

  return (
    <div className="nav" id="app-bottom-nav">
      <div 
        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
        onClick={() => handleTabClick('dashboard')}
      >
        <span className="fa-solid fa-house"></span>
        INICIO
      </div>
      <div 
        className={`nav-item ${activeTab === 'predictions' ? 'active' : ''}`} 
        onClick={() => handleTabClick('predictions')}
      >
        <span className="fa-solid fa-gamepad"></span>
        PREDECIR
      </div>
      <div 
        className={`nav-item ${activeTab === 'groups' ? 'active' : ''}`} 
        onClick={() => handleTabClick('groups')}
      >
        <span className="fa-solid fa-users"></span>
        GRUPOS
      </div>
      <div 
        className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} 
        onClick={() => handleTabClick('profile')}
      >
        <span className="fa-solid fa-user"></span>
        PERFIL
      </div>
    </div>
  );
};
