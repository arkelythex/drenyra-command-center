'use client'

import { useEffect, useState } from 'react'
import { ACCENT_PRESETS, type AccentPreset } from '../hooks/use-theme-switcher'

interface ColorCard {
  label: string
  variable: string
  value: string
}

interface ColorSwatchProps {
  color: ColorCard
  group?: 'surface' | 'semantic'
}

function ColorSwatch({ color }: ColorSwatchProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-16 w-full rounded-lg border border-[var(--border-subtle)]"
        style={{ backgroundColor: color.value }}
      />
      <span className="text-xs font-mono text-[var(--text-primary)] truncate">{color.variable}</span>
      <span className="text-xs text-[var(--text-muted)] truncate">{color.value}</span>
    </div>
  )
}

function TextPreview({ variable, value, label }: ColorCard) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]">
      <span className="text-xs font-mono text-[var(--text-muted)] w-36 shrink-0 truncate">{variable}</span>
      <span className="text-sm text-[var(--text-muted)] w-20 shrink-0">{value}</span>
      <div className="flex-1 space-y-1">
        <p className="text-sm" style={{ color: value }}>
          The quick brown fox jumps over the lazy dog. 1234567890
        </p>
        <p className="text-xs" style={{ color: value }}>
          This is how body text renders in this color.
        </p>
      </div>
      <span className="text-xs text-[var(--text-muted)] w-16 text-right">{label}</span>
    </div>
  )
}

function readCssVar(name: string): string {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  } catch {
    return '—'
  }
}

function hexFromRgb(rgb: string): string {
  if (!rgb || rgb === '—') return rgb
  // Handle rgb/rgba strings
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return rgb
  const r = Number.parseInt(match[1], 10)
  const g = Number.parseInt(match[2], 10)
  const b = Number.parseInt(match[3], 10)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function ColorSection() {
  const [resolvedVars, setResolvedVars] = useState<Record<string, string>>({})
  const [activeAccent, setActiveAccent] = useState<string>('ember')

  useEffect(() => {
    const vars: Record<string, string> = {}

    // Surface colors
    for (const name of ['--color-bg-0', '--color-bg-1', '--color-bg-2', '--surface-1', '--surface-2', '--surface-3']) {
      vars[name] = readCssVar(name)
    }

    // Text colors
    for (const name of ['--text-primary', '--text-secondary', '--text-muted', '--text-disabled']) {
      vars[name] = readCssVar(name)
    }

    // Semantic colors
    for (const name of ['--color-success', '--color-warning', '--color-danger', '--color-info']) {
      vars[name] = readCssVar(name)
    }

    setResolvedVars(vars)

    const current = document.documentElement.getAttribute('data-accent') || 'ember'
    setActiveAccent(current)
  }, [])

  const surfaceColors: ColorCard[] = [
    { label: 'Background 0', variable: '--color-bg-0', value: hexFromRgb(resolvedVars['--color-bg-0'] || '') },
    { label: 'Background 1', variable: '--color-bg-1', value: hexFromRgb(resolvedVars['--color-bg-1'] || '') },
    { label: 'Background 2', variable: '--color-bg-2', value: hexFromRgb(resolvedVars['--color-bg-2'] || '') },
    { label: 'Surface 1', variable: '--surface-1', value: hexFromRgb(resolvedVars['--surface-1'] || '') },
    { label: 'Surface 2', variable: '--surface-2', value: hexFromRgb(resolvedVars['--surface-2'] || '') },
    { label: 'Surface 3', variable: '--surface-3', value: hexFromRgb(resolvedVars['--surface-3'] || '') },
  ]

  const textColors: ColorCard[] = [
    { label: 'Primary', variable: '--text-primary', value: resolvedVars['--text-primary'] || '' },
    { label: 'Secondary', variable: '--text-secondary', value: resolvedVars['--text-secondary'] || '' },
    { label: 'Muted', variable: '--text-muted', value: resolvedVars['--text-muted'] || '' },
    { label: 'Disabled', variable: '--text-disabled', value: resolvedVars['--text-disabled'] || '' },
  ]

  const semanticColors: ColorCard[] = [
    { label: 'Success', variable: '--color-success', value: hexFromRgb(resolvedVars['--color-success'] || '') },
    { label: 'Warning', variable: '--color-warning', value: hexFromRgb(resolvedVars['--color-warning'] || '') },
    { label: 'Danger', variable: '--color-danger', value: hexFromRgb(resolvedVars['--color-danger'] || '') },
    { label: 'Info', variable: '--color-info', value: hexFromRgb(resolvedVars['--color-info'] || '') },
  ]

  const handleAccentClick = (preset: string) => {
    document.documentElement.setAttribute('data-accent', preset)
    setActiveAccent(preset)
  }

  const accentSwatches = ACCENT_PRESETS.map((preset) => {
    // Construct a temporary element to read the accent color
    const el = document.createElement('div')
    el.style.display = 'none'
    el.setAttribute('data-accent', preset)
    document.body.appendChild(el)
    const style = getComputedStyle(el)
    const accentColor = style.getPropertyValue('--color-accent').trim()
    document.body.removeChild(el)
    return { preset, color: accentColor || '#888' }
  })

  return (
    <section id="colors" className="scroll-mt-20">
      <h2 className="n text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-6">Colors</h2>

      {/* Surface Colors */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Surface Colors
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {surfaceColors.map((c) => (
            <ColorSwatch key={c.variable} color={c} group="surface" />
          ))}
        </div>
      </div>

      {/* Text Colors */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Text Colors
        </h3>
        <div className="space-y-2">
          {textColors.map((c) => (
            <TextPreview key={c.variable} {...c} />
          ))}
        </div>
      </div>

      {/* Accent Presets */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Accent Presets
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {accentSwatches.map(({ preset, color }) => (
            <button
              key={preset}
              onClick={() => handleAccentClick(preset)}
              className="group relative flex flex-col items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 transition-all hover:border-[var(--border-default)] hover:shadow-sm cursor-pointer"
              aria-label={`Apply ${preset} accent`}
              aria-pressed={activeAccent === preset}
            >
              <div
                className="h-10 w-full rounded-lg"
                style={{ backgroundColor: color || 'var(--color-accent)' }}
              />
              <span className="text-xs font-medium text-[var(--text-primary)] capitalize">{preset}</span>
              {activeAccent === preset && (
                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs text-white">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Semantic Colors */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Semantic Colors
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {semanticColors.map((c) => (
            <ColorSwatch key={c.variable} color={c} group="semantic" />
          ))}
        </div>
      </div>
    </section>
  )
}
