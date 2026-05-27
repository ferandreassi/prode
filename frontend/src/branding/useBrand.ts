import { create } from 'zustand';
import { BRANDS } from './brands';
import type { BrandConfig } from './types';

interface BrandStore {
  activeBrand: BrandConfig;
  setActiveBrand: (brand: BrandConfig) => void;
  initializeBrand: () => void;
}

export const useBrandStore = create<BrandStore>((set) => ({
  activeBrand: BRANDS.default,
  setActiveBrand: (brand) => set({ activeBrand: brand }),
  
  initializeBrand: () => {
    // 1. Detección dinámica de marca
    const params = new URLSearchParams(window.location.search);
    const queryBrand = params.get('brand');
    const hostname = window.location.hostname;
    
    let detectedBrandKey = 'default';
    
    if (queryBrand && BRANDS[queryBrand]) {
      detectedBrandKey = queryBrand;
    } else if (hostname.includes('logika')) {
      detectedBrandKey = 'logika';
    }
    
    const brand = BRANDS[detectedBrandKey];
    set({ activeBrand: brand });

    // 2. Inyección dinámica de variables de color CSS en el DOM
    const root = document.documentElement;
    root.style.setProperty('--bg-start', brand.colors.bgStart);
    root.style.setProperty('--bg-end', brand.colors.bgEnd);
    root.style.setProperty('--screen-gradient', brand.colors.screenGradient);
    root.style.setProperty('--card', brand.colors.cardBg);
    root.style.setProperty('--cyan', brand.colors.primary);
    root.style.setProperty('--purple', brand.colors.secondary);
    root.style.setProperty('--yellow', brand.colors.accent);
    root.style.setProperty('--text-muted', brand.colors.textMuted);
    root.style.setProperty('--border', brand.colors.border);
    root.style.setProperty('--border-hover', brand.colors.borderHover);
    root.style.setProperty('--font-fun', `'${brand.font.family}', sans-serif`);
    root.style.setProperty('--font-body', `'${brand.font.family}', sans-serif`);

    // 3. Inyección dinámica de la fuente de Google Fonts
    const fontLinkId = 'dynamic-brand-font';
    let linkElement = document.getElementById(fontLinkId) as HTMLLinkElement;
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.id = fontLinkId;
      linkElement.rel = 'stylesheet';
      document.head.appendChild(linkElement);
    }
    linkElement.href = brand.font.importUrl;
    
    // 4. Cambiar el título del HTML dinámicamente
    document.title = `${brand.name} — Mundial 2026`;
  }
}));

export const useBrand = () => {
  const activeBrand = useBrandStore((state) => state.activeBrand);
  const initializeBrand = useBrandStore((state) => state.initializeBrand);
  
  return { activeBrand, initializeBrand };
};
