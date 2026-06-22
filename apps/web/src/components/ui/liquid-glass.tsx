/**
 * Liquid Glass Component
 * Implementación del concepto "Liquid Glass" de iOS 26
 * 
 * Combina propiedades ópticas de vidrio con dinamismo fluido
 * Se adapta al contenido y tiene efectos de luz especular
 */

import { useRef, type ReactNode, type Ref } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass } from '@/hooks/useAdaptiveGlass';

interface LiquidGlassProps {
  children: ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
  animate?: boolean;
  adaptive?: boolean;
}

export function LiquidGlass({
  children,
  className,
  intensity = 'medium',
  animate = true,
  adaptive = false
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { glassStyle } = useAdaptiveGlass(adaptive ? containerRef : { current: null });
  const enableRefraction = adaptive && animate && !prefersReducedMotion;

  const intensityStyles = {
    light: 'bg-[var(--surface-1)]/96 border-[var(--border-subtle)]',
    medium: 'bg-[var(--surface-1)]/98 border-[var(--border-default)]',
    heavy: 'bg-[var(--surface-2)]/98 border-[var(--border-default)]',
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-3xl border shadow-[var(--shadow-lg)] transition-[background-color,border-color,box-shadow,transform] duration-200',
        intensityStyles[intensity],
        className
      )}
      style={{
        ...glassStyle,
      }}
      whileHover={animate && !prefersReducedMotion ? { scale: 1.001 } : undefined}
      transition={{ duration: prefersReducedMotion ? 0.1 : 0.16, ease: 'easeOut' }}
    >
      <div
        className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-white/[0.045] to-transparent dark:from-white/[0.03]"
      />

      {/* SVG Refraction Filter (Elite Technical Detail) */}
      <svg className="hidden">
        <filter id="liquid-refraction">
          <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </svg>

      {/* Content Layer with subtle refraction */}
      <div className="relative z-10 h-full" style={enableRefraction ? { filter: 'url(#liquid-refraction)' } : undefined}>
        {children}
      </div>

      <div className="absolute inset-0 z-20 rounded-[inherit] border border-white/[0.04] pointer-events-none dark:border-white/[0.03]" />
    </motion.div>
  );
}

/**
 * Variante para tarjetas de contenido premium
 * React 19 — ref es prop regular, sin forwardRef
 */
export function LiquidGlassCard({ children, className, ref, ...props }: LiquidGlassProps & { ref?: Ref<HTMLDivElement> }) {
  return (
    <LiquidGlass
      intensity="medium"
      className={cn('p-6', className)}
      {...props}
    >
      {children}
    </LiquidGlass>
  );
}
LiquidGlassCard.displayName = "LiquidGlassCard";
