import { useState, useEffect, RefObject } from 'react';

/**
 * useAdaptiveGlass Hook
 * Detects dominant colors from content and applies them to the glass container
 * Inspired by iOS 26 contextual materials
 */
export function useAdaptiveGlass(contentRef: RefObject<HTMLElement | null>) {
  const [dominantColor, setDominantColor] = useState('rgba(255, 255, 255, 0.05)');
  const [borderColor, setBorderColor] = useState('rgba(255, 255, 255, 0.1)');

  useEffect(() => {
    if (!contentRef.current) return;

    // Simplified extraction: in a real implementation, we could use a canvas 
    // to sample an image or getComputedStyle for a data-driven element.
    // For now, we look for data attributes or standard financial colors.
    
    const updateColors = () => {
        const element = contentRef.current;
        if (!element) return;

        // Try to find a primary indicator color within children
        const indicator = element.querySelector('.bg-primary, .text-primary, .bg-[var(--premium-success)], .bg-red-500');
        if (indicator) {
            const style = window.getComputedStyle(indicator);
            const color = style.backgroundColor || style.color;
            
            // Apply contextual tint (very low opacity)
            if (color.startsWith('rgb')) {
                const rgba = color.replace('rgb', 'rgba').replace(')', ', 0.08)');
                const borderRgba = color.replace('rgb', 'rgba').replace(')', ', 0.2)');
                setDominantColor(rgba);
                setBorderColor(borderRgba);
            }
        }
    };

    const observer = new MutationObserver(updateColors);
    observer.observe(contentRef.current, { childList: true, subtree: true, attributes: true });
    
    updateColors();

    return () => observer.disconnect();
  }, [contentRef]);

  return {
    glassStyle: {
      backgroundColor: dominantColor,
      borderColor: borderColor,
    }
  };
}
