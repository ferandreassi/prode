import React from 'react';
import { store, useStore } from '../store';

export const Header: React.FC = () => {
  const { currentScreen, currentUser } = useStore();

  // Ocultar cabecera en splash y auth
  if (currentScreen === 'screen-splash' || currentScreen === 'screen-auth') {
    return null;
  }

  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.avatarSeed}`;

  return (
    <div className="header">
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} 
        onClick={() => store.navigateTo('screen-profile')}
      >
        <img 
          src={avatarUrl} 
          alt="avatar" 
          className="avatar" 
          style={{ width: '32px', height: '32px' }} 
        />
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'var(--font-fun)' }}>
            {currentUser.nickname}
          </h3>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
            PREDICTOR
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            background: 'rgba(0, 255, 135, 0.08)', 
            border: '1px solid rgba(0, 255, 135, 0.15)', 
            padding: '4px 10px', 
            borderRadius: '20px' 
          }}
        >
          <i className="fa-solid fa-trophy" style={{ fontSize: '11px', color: 'var(--green)' }}></i>
          <span style={{ fontFamily: 'var(--font-fun)', fontSize: '12px', fontWeight: '700', color: 'var(--green)' }}>
            {currentUser.points} PTS
          </span>
        </div>
      </div>
    </div>
  );
};
