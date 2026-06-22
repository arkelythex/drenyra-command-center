'use client'

import { useEffect, useState } from 'react'

interface CssVar {
  name: string
  value: string
  group: string
}

function groupVar(name: string): string {
  if (name.startsWith('--color-')) return 'color'
  if (name.startsWith('--bg-') || name.startsWith('--surface')) return 'surface'
  if (name.startsWith('--text-')) return 'text'
  if (name.startsWith('--border-') || name.startsWith('--stroke')) return 'border'
  if (name.startsWith('--shadow')) return 'shadow'
  if (name.startsWith('--radius')) return 'radius'
  if (name.startsWith('--font')) return 'font'
  if (name.startsWith('--density')) return 'density'
  return 'other'
}

export function TokensPanel() {
  const [vars, setVars] = useState<CssVar[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const style = getComputedStyle(document.documentElement)
    const allVars: CssVar[] = []
    for (let i = 0; i < style.length; i++) {
      const name = style.item(i)
      if (!name.startsWith('--')) continue
      allVars.push({
        name,
        value: style.getPropertyValue(name).trim(),
        group: groupVar(name),
      })
    }
    setVars(allVars)
  }, [])

  const filtered = filter
    ? vars.filter((v) => v.name.includes(filter) || v.value.includes(filter))
    : vars

  const grouped = filtered.reduce(
    (acc, v) => {
      ;(acc[v.group] ??= []).push(v)
      return acc
    },
    {} as Record<string, CssVar[]>,
  )

  const groupOrder = ['color', 'surface', 'text', 'border', 'shadow', 'radius', 'font', 'density', 'other']

  return (
    <section id="tokens" className="scroll-mt-20">
      <h2 className="n text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-6">CSS Variables</h2>

      <input
        type="text"
        placeholder="Filter variables..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] mb-6 outline-none focus:border-[var(--border-default)]"
      />

      <div className="space-y-6">
        {groupOrder.map((group) => {
          const items = grouped[group]
          if (!items?.length) return null
          return (
            <div key={group}>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                {group}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {items.map((v) => (
                  <div
                    key={v.name}
                    className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono hover:bg-[var(--surface-1)]"
                  >
                    <span className="text-[var(--text-muted)] shrink-0 max-w-[200px] truncate">{v.name}</span>
                    <span className="text-[var(--text-primary)] truncate">{v.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
