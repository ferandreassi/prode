import React from 'react';
import { store } from '../store';

export const SplashScreen: React.FC = () => {
  return (
    <div 
      className="screen active" 
      style={{ 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '30px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative'
      }}
    >
      <div className="dots">
        <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--green)', top: '20%', left: '15%', animationDuration: '4s' }}></div>
        <div className="dot" style={{ width: '12px', height: '12px', background: 'var(--blue)', top: '60%', left: '80%', animationDuration: '5s' }}></div>
        <div className="dot" style={{ width: '6px', height: '6px', background: 'var(--yellow)', top: '80%', left: '20%', animationDuration: '3s' }}></div>
      </div>
      
      <div className="mascot" style={{ fontSize: '80px', marginBottom: '20px' }}>👾</div>
      <h1 className="title-fun" style={{ marginBottom: '5px' }}>PRODE-U</h1>
      <p className="subtitle-fun" style={{ marginBottom: '40px' }}>WORLD CUP 2026</p>
      
      <button 
        className="btn btn-green wiggle" 
        onClick={() => store.navigateTo('screen-auth')}
        style={{ maxWidth: '280px' }}
      >
        INGRESAR <i className="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  );
};
