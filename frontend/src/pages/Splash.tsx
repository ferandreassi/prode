import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useBrand } from '@/branding/useBrand';
import { BrandLogo } from '@/branding/BrandLogo';

export const Splash: React.FC = () => {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const { activeBrand } = useBrand();

  useEffect(() => {
    let active = true;
    
    const timer = setTimeout(async () => {
      try {
        if (active) {
          await checkAuth();
        }
      } catch (error) {
        console.error('Error in Splash auth check:', error);
      }
    }, 1500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div 
      className="screen active" 
      style={{
        background: 'var(--screen-gradient)',
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

      <div style={{ marginBottom: '10px' }}>
        <BrandLogo brand={activeBrand} size={110} />
      </div>

      <div>
        <h1 className="title-fun" style={{ fontSize: '46px', color: 'var(--white)', letterSpacing: '1px', fontWeight: 900 }}>
          {activeBrand.name}
        </h1>
        <p className="subtitle-fun" style={{ fontSize: '12px', marginTop: '6px', color: 'var(--cyan)', letterSpacing: '3px' }}>
          {activeBrand.tagline}
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
            border: '4px solid rgba(255,255,255,0.06)',
            borderTopColor: 'var(--cyan)',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.55 }}>
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
