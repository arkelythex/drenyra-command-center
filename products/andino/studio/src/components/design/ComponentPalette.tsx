'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Box, RotateCw, Airplay, Battery } from 'lucide-react';

interface PaletteCategory {
  name: string;
  icon: React.ReactNode;
  items: { label: string; detail?: string }[];
}

const categories: PaletteCategory[] = [
  {
    name: 'Frames', icon: <Box size={16} />,
    items: [
      { label: 'Quad', detail: '4 arms' }, { label: 'Y6', detail: '6 arms, coaxial' },
      { label: 'X8', detail: '8 arms, coaxial' }, { label: 'Hexa', detail: '6 arms' },
      { label: 'Octo', detail: '8 arms' },
    ],
  },
  {
    name: 'Motors', icon: <RotateCw size={16} />,
    items: [
      { label: '2207', detail: '1960KV' }, { label: '4010', detail: '480KV' },
      { label: '501S', detail: '320KV' }, { label: '6010', detail: '280KV' },
    ],
  },
  {
    name: 'Propellers', icon: <Airplay size={16} />,
    items: [
      { label: '6x3.5', detail: '6" dia' }, { label: '10x4.5', detail: '10" dia' },
      { label: '13x4.5', detail: '13" dia' }, { label: '15x5', detail: '15" dia' },
    ],
  },
  {
    name: 'Batteries', icon: <Battery size={16} />,
    items: [
      { label: '4S 4200', detail: '15.4V' }, { label: '6S 10000', detail: '22.2V' },
      { label: '12S 16000', detail: '44.4V' },
    ],
  },
];

export default function ComponentPalette({ onSelectComponent }: {
  onSelectComponent: (category: string, item: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside className="w-[200px] flex-shrink-0 bg-bg-surface border border-border-subtle rounded-[10px] p-3 overflow-y-auto">
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Components</h2>
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.name}>
            <button
              onClick={() => toggle(cat.name)}
              className="flex items-center gap-2 w-full text-left text-sm text-text-secondary hover:text-text-primary py-1.5 px-2 rounded-lg hover:bg-bg-elevated transition-colors duration-200"
            >
              {expanded[cat.name] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="text-text-muted">{cat.icon}</span>
              {cat.name}
            </button>
            {expanded[cat.name] && (
              <div className="ml-1 mt-1 space-y-1">
                {cat.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => onSelectComponent(cat.name, item.label)}
                    className="w-full text-left bg-bg-elevated hover:bg-bg-primary rounded-lg p-2 cursor-pointer border-l-2 border-accent-400/50 transition-colors duration-200"
                  >
                    <div className="text-sm text-text-primary">{item.label}</div>
                    {item.detail && <div className="text-xs text-text-muted">{item.detail}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
