export interface BrandConfig {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  mascotEmoji?: string;        // Emoji de respaldo si no hay imagen
  logoUrl?: string;            // Ruta a logo PNG/SVG (alojado en public o R2)
  logoSvgPaths?: string;       // Código SVG inline para logos ultralivianos
  font: {
    family: string;
    importUrl: string;         // Enlace de Google Fonts
  };
  colors: {
    bgStart: string;
    bgEnd: string;
    screenGradient: string;
    cardBg: string;
    primary: string;           // Reemplaza a --cyan
    secondary: string;         // Reemplaza a --purple
    accent: string;            // Reemplaza a --yellow
    textMuted: string;
    border: string;
    borderHover: string;
  };
  footerText: string;
}
