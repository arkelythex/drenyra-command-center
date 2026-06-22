/**
 * Legibility Utilities (Scrim System)
 * Basado en Material 3 Expressive - Google Pixel
 * 
 * Garantiza que el texto sea SIEMPRE legible sobre cualquier fondo
 * Usa scrim (overlay) de 40-60% según el contexto
 */

export const LEGIBILITY = {
  /**
   * Scrim para texto sobre imágenes complejas
   * Intensidad: Light (40%)
   */
  scrim: {
    light: 'bg-gradient-to-t from-black/40 via-black/10 to-transparent',
    medium: 'bg-black/50 backdrop-blur-sm',
    heavy: 'bg-black/70 backdrop-blur-md',
    solid: 'bg-black/60',
  },

  /**
   * Scrim para cards de glass sobre fondos complejos
   */
  glassScrim: {
    light: 'bg-background/60 backdrop-blur-xl',
    medium: 'bg-background/80 backdrop-blur-2xl',
    heavy: 'bg-background/95 backdrop-blur-3xl',
  },

  /**
   * Sombras de texto para legibilidad
   */
  textShadow: {
    light: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]',
    medium: 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]',
    heavy: 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]',
  },

  /**
   * Combinaciones recomendadas por contexto
   */
  patterns: {
    // Para headers sobre imágenes de facturas
    invoiceHeader: 'bg-gradient-to-t from-black/60 via-black/30 to-transparent',
    
    // Para widgets en dashboard
    dashboardWidget: 'bg-background/80 backdrop-blur-xl',
    
    // Para modales sobre contenido complejo
    modalOverlay: 'bg-black/50 backdrop-blur-sm',
    
    // Para cards de datos sobre gráficos
    dataCard: 'bg-background/90 backdrop-blur-2xl',
  },
} as const;

/**
 * Hook para detectar si se necesita scrim basado en el contenido
 */
export function useLegibilityCheck(_elementRef: React.RefObject<HTMLElement>) {
  // En implementación real, usaría IntersectionObserver
  // y análisis de color del fondo para decidir intensidad
  
  return {
    needsScrim: true, // Simplificado - en producción sería dinámico
    recommendedIntensity: 'medium' as const,
  };
}
