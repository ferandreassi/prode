import React, { useState } from 'react';
import { store } from '../store';

export const AuthScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login States
  const [loginNick, setLoginNick] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register States
  const [regNick, setRegNick] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');

  const handleLoginSubmit = () => {
    const nick = loginNick.trim() || 'Jugador';
    store.setUser(nick);
    store.navigateTo('screen-dashboard');
    store.showToast('¡Bienvenido a la cancha!');
  };

  const handleRegisterSubmit = () => {
    if (!regNick.trim()) {
      alert('Ingresa un apodo de jugador');
      return;
    }
    if (regPass !== regPassConfirm) {
      alert('Las contraseñas no coinciden');
      return;
    }
    store.setUser(regNick.trim());
    store.navigateTo('screen-dashboard');
    store.showToast('¡Cuenta creada exitosamente!');
  };

  return (
    <div 
      className="screen active" 
      style={{ 
        justifyContent: 'center', 
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'login' ? 'active' : ''}`} 
          onClick={() => setActiveTab('login')}
        >
          INICIAR SESIÓN
        </div>
        <div 
          className={`tab ${activeTab === 'register' ? 'active' : ''}`} 
          onClick={() => setActiveTab('register')}
        >
          REGISTRARSE
        </div>
      </div>
      
      {/* Login Form */}
      {activeTab === 'login' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
              Apodo de Jugador
            </label>
            <input 
              type="text" 
              className="input" 
              placeholder="Ej: Messi10"
              value={loginNick}
              onChange={(e) => setLoginNick(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoginSubmit()}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
              Contraseña
            </label>
            <input 
              type="password" 
              className="input" 
              placeholder="••••••••"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoginSubmit()}
            />
          </div>
          <button 
            className="btn btn-green" 
            onClick={handleLoginSubmit} 
            style={{ marginTop: '10px' }}
          >
            INGRESAR A LA CANCHA
          </button>
        </div>
      )}
      
      {/* Register Form */}
      {activeTab === 'register' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
              Elige tu Apodo
            </label>
            <input 
              type="text" 
              className="input" 
              placeholder="Ej: ScaloniTech"
              value={regNick}
              onChange={(e) => setRegNick(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegisterSubmit()}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
              Contraseña
            </label>
            <input 
              type="password" 
              className="input" 
              placeholder="Elige contraseña segura"
              value={regPass}
              onChange={(e) => setRegPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegisterSubmit()}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
              Confirmar Contraseña
            </label>
            <input 
              type="password" 
              className="input" 
              placeholder="Repite contraseña"
              value={regPassConfirm}
              onChange={(e) => setRegPassConfirm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegisterSubmit()}
            />
          </div>
          
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
            * Se te asignará un avatar robotizado único basado en tu apodo.
          </p>
          
          <button 
            className="btn btn-yellow" 
            onClick={handleRegisterSubmit} 
            style={{ marginTop: '10px' }}
          >
            CREAR MI CUENTA
          </button>
        </div>
      )}
    </div>
  );
};
