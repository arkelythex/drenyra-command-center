'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { useThemeSwitcher, ACCENT_PRESETS } from '../hooks/use-theme-switcher'
import { ColorSection } from './ColorSection'
import { TypographySection } from './TypographySection'
import { ComponentsSection } from './ComponentsSection'
import { TokensPanel } from './TokensPanel'

type SectionId = 'colors' | 'typography' | 'components' | 'tokens'

const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'components', label: 'Components' },
  { id: 'tokens', label: 'Tokens' },
]

function readAccentSwatch(preset: string): string {
  try {
    const el = document.createElement('div')
    el.style.display = 'none'
    el.setAttribute('data-accent', preset)
    document.body.appendChild(el)
    const style = getComputedStyle(el)
    const color = style.getPropertyValue('--color-accent').trim()
    document.body.removeChild(el)
    return color || '#888'
  } catch {
    return '#888'
  }
}

export function PlaygroundView() {
  const [activeSection, setActiveSection] = useState<SectionId>('colors')
  const [showFloating, setShowFloating] = useState(true)
  const [accentSwatches, setAccentSwatches] = useState<Record<string, string>>({})
  const { accent, mode, density, setAccent, toggleMode, setDensity } = useThemeSwitcher()

  // Initialize floating controls visibility from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('playground:floating-controls')
      if (stored === 'hidden') {
        setShowFloating(false)
      }
    } catch {
      // localStorage not available
    }
  }, [])

  // Read accent swatch colors
  useEffect(() => {
    const swatches: Record<string, string> = {}
    for (const preset of ACCENT_PRESETS) {
      swatches[preset] = readAccentSwatch(preset)
    }
    setAccentSwatches(swatches)
  }, [])

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    for (const { id } of NAV_ITEMS) {
      const el = document.getElementById(id)
      if (!el) continue
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveSection(id)
            }
          }
        },
        { rootMargin: '-80px 0px -60% 0px' },
      )
      observer.observe(el)
      observers.push(observer)
    }
    return () => {
      for (const o of observers) o.disconnect()
    }
  }, [])

  const scrollTo = useCallback((id: SectionId) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  const hideFloating = useCallback(() => {
    setShowFloating(false)
    try {
      localStorage.setItem('playground:floating-controls', 'hidden')
    } catch {
      // ignore
    }
  }, [])

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--color-bg-1)]">
        <div className="px-5 py-6">
          <h1 className="n text-lg font-bold tracking-tight text-[var(--text-primary)]">Playground</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Design System</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                activeSection === id
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
              style={
                activeSection === id
                  ? { backgroundColor: 'color-mix(in oklch, var(--accent) 12%, transparent)' }
                  : undefined
              }
            >
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0 transition-colors"
                style={{
                  backgroundColor: activeSection === id ? 'var(--accent)' : 'var(--border-subtle)',
                }}
              />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            mode: {mode} · density: {density}
          </span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--color-bg-0)' }}>
        <div className="mx-auto max-w-5xl px-6 py-8">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="n text-3xl font-black tracking-tight text-[var(--text-primary)] leading-none">
                Design System Playground
              </h1>
              <Badge variant="info" size="sm">
                Preview
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
              Explore the ARKELYTHEX design system. Switch between dark and light modes, try all 8 accent
              presets, and preview the complete component library with live CSS variable inspection.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-16">
            <ColorSection />
            <TypographySection />
            <ComponentsSection />
            <TokensPanel />
          </div>
        </div>
      </main>

      {/* Floating Controls */}
      {showFloating && (
        <div className="fixed bottom-6 right-6 z-50 w-64">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-sm p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Controls
              </span>
              <button
                onClick={hideFloating}
                className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                aria-label="Close floating controls"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Mode</span>
                <button
                  onClick={toggleMode}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  {mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </button>
              </div>

              {/* Accent Picker */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Accent</span>
                <div className="flex gap-1">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAccent(preset)}
                      className={`h-5 w-5 rounded-full border-2 transition-all ${
                        accent === preset
                          ? 'border-[var(--text-primary)] scale-110'
                          : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: accentSwatches[preset] || 'var(--color-accent)' }}
                      aria-label={`Set accent to ${preset}`}
                      title={preset}
                    />
                  ))}
                </div>
              </div>

              {/* Density Picker */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Density</span>
                <div className="inline-flex rounded-lg border border-[var(--border-subtle)] overflow-hidden">
                  {(['compact', 'normal', 'spacious'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDensity(d)}
                      className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        density === d
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
