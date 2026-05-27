import React, { useState } from 'react';
import { usePWAInstall } from '@/services/usePWAInstall';
import { useBrand } from '@/branding/useBrand';
import { BrandLogo } from '@/branding/BrandLogo';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallableAndroid, isInstallableIOS, handleInstallClick } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(true);
  const { activeBrand } = useBrand();

  // If the user closed it, or it is not installable on either platform, render nothing
  if (!isVisible || (!isInstallableAndroid && !isInstallableIOS)) {
    return null;
  }

  return (
    <div 
      className="pwa-banner"
      style={{
        position: 'absolute',
        bottom: '84px', // Sits perfectly above the bottom Sticky Navbar (which is 74px tall)
        left: '14px',
        right: '14px',
        background: 'rgba(13, 7, 34, 0.92)',
        backdropFilter: 'blur(20px) saturate(200%)',
        border: '1.5px solid rgba(0, 240, 255, 0.35)',
        borderRadius: '20px',
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 240, 255, 0.15)',
        zIndex: 98,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}
    >
      {/* Header of Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--purple) 0%, var(--cyan) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(0, 229, 255, 0.15)'
            }}
          >
            <BrandLogo brand={activeBrand} size={24} />
          </div>
          <div>
            <h4 
              style={{
                fontFamily: 'var(--font-fun)',
                fontSize: '15px',
                fontWeight: '700',
                color: 'var(--white)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                margin: 0,
                textShadow: '0 0 8px rgba(0, 240, 255, 0.3)'
              }}
            >
              Instalar {activeBrand.shortName} App
            </h4>
            <p 
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                margin: '2px 0 0 0',
                lineHeight: '1.2'
              }}
            >
              Acceso rápido desde tu pantalla de inicio y menor consumo de datos.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--pink)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ✕
        </button>
      </div>

      {/* Action / Guidance */}
      {isInstallableAndroid && (
        <button
          onClick={handleInstallClick}
          className="btn btn-blue"
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            borderRadius: '10px',
            height: 'auto',
            width: '100%',
            fontWeight: 800
          }}
        >
          📲 Instalar Aplicación
        </button>
      )}

      {isInstallableIOS && (
        <div 
          style={{
            background: 'rgba(255, 195, 0, 0.08)',
            border: '1px solid rgba(255, 195, 0, 0.25)',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '11px',
            fontFamily: 'var(--font-body)',
            color: 'var(--yellow)',
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>💡</span>
          <span>
            Para instalar en iPhone: presiona <strong>Compartir ↑</strong> en Safari, desplázate y selecciona <strong>"Agregar a Inicio"</strong>.
          </span>
        </div>
      )}
    </div>
  );
};
