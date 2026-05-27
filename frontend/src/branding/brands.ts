import type { BrandConfig } from './types';

export const BRANDS: Record<string, BrandConfig> = {
  // Marca estándar por defecto (PRODE clásico)
  default: {
    id: 'default',
    name: 'PRODE MUNDIAL',
    shortName: 'Prode',
    tagline: 'La app de predicciones definitiva',
    mascotEmoji: '⚽👾',
    font: {
      family: 'Outfit',
      importUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Rajdhani:wght@600;700;800&display=swap'
    },
    colors: {
      bgStart: '#0a051d',
      bgEnd: '#170d37',
      screenGradient: 'linear-gradient(160deg, #10062a 0%, #1a0b47 50%, #2f0f4a 100%)',
      cardBg: 'rgba(18, 10, 44, 0.55)',
      primary: '#00f0ff',      // Cyan eléctrico
      secondary: '#9d4edd',    // Púrpura arcade
      accent: '#ffc300',       // Amarillo neón
      textMuted: 'rgba(255, 255, 255, 0.6)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(0, 240, 255, 0.3)'
    },
    footerText: 'Mundial de fútbol 2026 • v 0.1.1'
  },
  
  // Marca Logika
  logika: {
    id: 'logika',
    name: 'LOGIKA PRODE',
    shortName: 'Logika',
    tagline: 'PRODE • EVENTOS CORPORATIVOS',
    logoUrl: 'https://logika.com.ar/images/logo.png',
    font: {
      family: 'Montserrat',
      importUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap'
    },
    colors: {
      bgStart: '#000000',
      bgEnd: '#09090b',
      screenGradient: 'radial-gradient(circle at top, #180932 0%, #040407 65%, #000000 100%)',
      cardBg: 'rgba(18, 18, 22, 0.65)',
      primary: '#00e5ff',      // Cian láser
      secondary: '#8b5cf6',    // Púrpura escenario
      accent: '#ffb700',       // Dorado reflector
      textMuted: 'rgba(255, 255, 255, 0.55)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(139, 92, 246, 0.35)'
    },
    footerText: 'Logika Eventos Corporativos • v 1.0.0'
  }
};
export default BRANDS;
