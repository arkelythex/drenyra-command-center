import { useState, useEffect, useCallback, useRef } from 'react'

type ScrollDirection = 'up' | 'down' | null

interface UseScrollDirectionOptions {
  /** Umbral mínimo de scroll para detectar cambio de dirección */
  threshold?: number
  /** Umbral para considerar que se está en la parte superior */
  topThreshold?: number
}

interface UseScrollDirectionReturn {
  scrollDirection: ScrollDirection
  scrollY: number
  isAtTop: boolean
  isScrolled: boolean
}

/**
 * Hook para detectar la dirección del scroll y posición
 * Útil para mostrar/ocultar el header según la dirección
 *
 * @param options - Configuración del hook
 * @returns Objeto con dirección, posición y estados del scroll
 *
 * @example
 * const { scrollDirection, isAtTop } = useScrollDirection({ threshold: 10 })
 * // Ocultar header al scrollear hacia abajo
 * const headerClass = scrollDirection === 'down' ? 'translate-y-[-100%]' : ''
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): UseScrollDirectionReturn {
  const { threshold = 10, topThreshold = 100 } = options

  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null)
  const [scrollY, setScrollY] = useState(() => typeof window !== 'undefined' ? window.scrollY : 0)
  const [isAtTop, setIsAtTop] = useState(() => typeof window !== 'undefined' ? window.scrollY < topThreshold : true)
  const [isScrolled, setIsScrolled] = useState(() => typeof window !== 'undefined' ? window.scrollY > 0 : false)

  const lastScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0)
  const ticking = useRef(false)

  const updateScrollDirection = useCallback(() => {
    const currentScrollY = window.scrollY

    // Determinar dirección solo si el cambio es mayor al threshold
    if (Math.abs(currentScrollY - lastScrollY.current) >= threshold) {
      const newDirection = currentScrollY > lastScrollY.current ? 'down' : 'up'
      setScrollDirection(newDirection)
      lastScrollY.current = currentScrollY
    }

    setScrollY(currentScrollY)
    setIsAtTop(currentScrollY < topThreshold)
    setIsScrolled(currentScrollY > 0)

    ticking.current = false
  }, [threshold, topThreshold])

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(updateScrollDirection)
      ticking.current = true
    }
  }, [updateScrollDirection])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  return { scrollDirection, scrollY, isAtTop, isScrolled }
}

export default useScrollDirection
