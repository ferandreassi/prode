import React from 'react';
import { LayoutDashboard, Trophy, Users, User } from 'lucide-react';
import { useUIStore, type TabType } from '@/store/uiStore';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();

  const navItems: { tab: TabType; label: string; icon: React.ReactNode }[] = [
    {
      tab: 'dashboard',
      label: 'Inicio',
      icon: <LayoutDashboard size={20} />,
    },
    {
      tab: 'predictions',
      label: 'Pronósticos',
      icon: <Trophy size={20} />,
    },
    {
      tab: 'groups',
      label: 'Grupos',
      icon: <Users size={20} />,
    },
    {
      tab: 'profile',
      label: 'Mi Perfil',
      icon: <User size={20} />,
    },
  ];

  return (
    <nav className="nav">
      {navItems.map((item) => (
        <div
          key={item.tab}
          className={`nav-item ${activeTab === item.tab ? 'active' : ''}`}
          onClick={() => setActiveTab(item.tab)}
        >
          <span className="wiggle">{item.icon}</span>
          <div style={{ fontSize: '10px', marginTop: '2px' }}>{item.label}</div>
        </div>
      ))}
    </nav>
  );
};
