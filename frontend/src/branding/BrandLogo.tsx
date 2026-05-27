import React from 'react';
import type { BrandConfig } from './types';

interface BrandLogoProps {
  brand: BrandConfig;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ brand, size = 80 }) => {
  // Si hay código SVG inline (como para Logika), lo inyectamos de manera segura
  if (brand.logoSvgPaths) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.4))' }}
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--cyan)" />
            <stop offset="100%" stopColor="var(--purple)" />
          </linearGradient>
        </defs>
        <g dangerouslySetInnerHTML={{ __html: brand.logoSvgPaths }} />
      </svg>
    );
  }

  // Si hay una URL de imagen, la renderizamos adaptativamente para logos horizontales
  if (brand.logoUrl) {
    return (
      <img 
        src={brand.logoUrl} 
        alt={brand.name} 
        style={{ 
          maxWidth: size * 2.5, 
          maxHeight: size, 
          width: 'auto', 
          height: 'auto', 
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.15))' // Sutil glow blanco traslúcido para contraste en fondo oscuro
        }} 
      />
    );
  }

  // Respaldo de emoji clásico (look original de la app)
  return (
    <span 
      className="mascot" 
      style={{ 
        fontSize: `${size * 0.7}px`, 
        display: 'inline-block',
        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.35))'
      }}
    >
      {brand.mascotEmoji}
    </span>
  );
};
