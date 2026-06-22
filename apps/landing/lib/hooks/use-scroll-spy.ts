import { useState, useEffect, useCallback } from 'react'

/**
 * Hook para detectar la sección activa durante el scroll
 * Utiliza Intersection Observer para mejor rendimiento
 * 
 * @param sectionIds - Array de IDs de secciones a observar
 * @param options - Opciones del Intersection Observer
 * @returns ID de la sección actualmente visible
 * 
 * @example
 * const activeSection = useScrollSpy(['hero', 'features', 'pricing'])
 */
export function useScrollSpy(
  sectionIds: string[],
  options: {
    rootMargin?: string
    threshold?: number | number[]
  } = {}
): string | null {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const { rootMargin = '-20% 0px -60% 0px', threshold = 0 } = options

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      // Encontrar la primera sección que está intersectando
      const intersectingEntry = entries.find((entry) => entry.isIntersecting)

      if (intersectingEntry) {
        setActiveSection(intersectingEntry.target.id)
      }
    },
    []
  )

  useEffect(() => {
    // Verificar si IntersectionObserver está disponible
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return
    }

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin,
      threshold,
    })

    // Observar todas las secciones
    sectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [sectionIds, handleIntersect, rootMargin, threshold])

  return activeSection
}

export default useScrollSpy
