import { useState, useLayoutEffect } from 'react'

/**
 * Hook para detectar la preferencia del usuario de reducir movimiento
 * Cumple con WCAG 2.1 - Criterio 2.3.3 (Animation from Interactions)
 *
 * @returns boolean - true si el usuario prefiere movimiento reducido
 *
 * @example
 * const prefersReducedMotion = useReducedMotion()
 * const animationClass = prefersReducedMotion ? '' : 'animate-slide-in'
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useLayoutEffect(() => {
    // Verificar si matchMedia está disponible (SSR safe)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    // Establecer valor inicial
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mediaQuery.matches)

    // Listener para cambios en la preferencia
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // Modern API (addEventListener) con fallback (addListener)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  return prefersReducedMotion
}

export default useReducedMotion
