import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const Splash: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Run the authentication check on mount
    const check = async () => {
      // Small artificial delay to let the animation shine
      await new Promise(resolve => setTimeout(resolve, 1500));
      await checkAuth();
    };
    check();
  }, [checkAuth]);

  return (
    <div 
      className="screen active" 
      style={{
        background: 'linear-gradient(160deg, #501E8C 0%, #7B4FE0 50%, #B834A0 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        gap: '20px',
        padding: '24px',
        overflow: 'hidden'
      }}
    >
      {/* Decorative Floating Dots */}
      <div className="dots">
        <div className="dot" style={{ width: '12px', height: '12px', background: 'var(--yellow)', left: '15%', top: '20%', animationDelay: '0s' }}></div>
        <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--blue)', right: '20%', top: '35%', animationDelay: '1s' }}></div>
        <div className="dot" style={{ width: '16px', height: '16px', background: 'var(--pink)', left: '25%', bottom: '30%', animationDelay: '2s' }}></div>
        <div className="dot" style={{ width: '10px', height: '10px', background: 'var(--green)', right: '15%', bottom: '25%', animationDelay: '0.5s' }}></div>
      </div>

      <div className="mascot" style={{ fontSize: '72px', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}>
        ⚽️🏆
      </div>

      <div>
        <h1 className="title-fun" style={{ fontSize: '48px', color: 'var(--white)' }}>
          PRODE-U
        </h1>
        <p className="subtitle-fun" style={{ fontSize: '13px', marginTop: '6px', color: 'var(--yellow)' }}>
          Mundial 2026
        </p>
      </div>

      <div 
        style={{
          marginTop: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {/* Modern premium loader */}
        <div 
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--yellow)',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6 }}>
          Conectando...
        </span>
      </div>

      {/* Mini-spinner keyframes added inline for safety */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
