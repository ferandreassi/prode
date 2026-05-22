import React from 'react';
import { store, useStore } from '../store';

export const ProfileScreen: React.FC = () => {
  const { currentUser, language } = useStore();

  const handleChangeAvatar = () => {
    const newSeed = prompt('Ingresa una semilla/apodo para tu avatar robotizado:', currentUser.avatarSeed);
    if (newSeed && newSeed.trim()) {
      store.updateAvatar(newSeed.trim());
      store.showToast('¡Avatar actualizado!');
    }
  };

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      store.navigateTo('screen-splash');
      store.showToast('Sesión cerrada');
    }
  };

  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.avatarSeed}`;

  return (
    <div className="screen active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="scroll">
        {/* Profile Header */}
        <div style={{ textAlign: 'center', margin: '20px 0 30px' }}>
          <div 
            style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 12px', cursor: 'pointer' }} 
            onClick={handleChangeAvatar}
          >
            <img 
              src={avatarUrl} 
              alt="avatar" 
              className="avatar" 
              style={{ width: '100px', height: '100px', borderWidth: '4px', borderColor: 'var(--blue)' }} 
            />
            <div 
              style={{ 
                position: 'absolute', 
                bottom: 0, 
                right: 0, 
                background: 'var(--blue)', 
                color: '#070A10', 
                width: '28px', 
                height: '28px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '12px', 
                border: '2px solid #131622' 
              }}
            >
              <i className="fa-solid fa-pen"></i>
            </div>
          </div>
          <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '24px', fontWeight: 700 }}>
            {currentUser.nickname}
          </h2>
          <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--green)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>
            PREDICTOR PRO
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="stats">
          <div className="stat">
            <span className="stat-v">{currentUser.points}</span>
            <span className="stat-l">PUNTOS</span>
          </div>
          <div className="stat">
            <span className="stat-v">4</span>
            <span className="stat-l">PARTIDOS</span>
          </div>
          <div className="stat">
            <span className="stat-v">2</span>
            <span className="stat-l">EXACTOS</span>
          </div>
        </div>
        
        {/* Settings Options */}
        <div className="section">
          <span>CONFIGURACIÓN</span>
        </div>
        
        <div 
          className="card" 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '14px 16px' }} 
          onClick={() => {
            store.changeLanguage();
            store.showToast('Idioma cambiado');
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fa-solid fa-earth-americas" style={{ color: 'var(--blue)', fontSize: '18px' }}></i>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Idioma</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {language}
          </span>
        </div>

        <div 
          className="card" 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '14px 16px', borderColor: 'rgba(255, 59, 48, 0.15)' }} 
          onClick={handleLogout}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fa-solid fa-right-from-bracket" style={{ color: 'var(--red)', fontSize: '18px' }}></i>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--red)' }}>Cerrar Sesión</span>
          </div>
          <i className="fa-solid fa-chevron-right" style={{ color: 'var(--red)', fontSize: '12px' }}></i>
        </div>
      </div>
    </div>
  );
};
