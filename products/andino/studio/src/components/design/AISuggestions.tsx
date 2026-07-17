'use client';

import { Loader2 } from 'lucide-react';

export default function AISuggestions({ suggestions, onApply }: {
  suggestions: string[];
  onApply: (index: number) => void;
}) {
  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-text-muted">
        <Loader2 size={24} className="animate-spin text-accent-400" />
        <span className="text-sm">Analyzing design...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, i) => (
        <div
          key={i}
          className="bg-bg-surface border border-border-subtle rounded-[10px] p-4 border-l-2 border-l-accent-400/60"
        >
          <span className="text-[10px] font-semibold text-accent-400 uppercase tracking-wider">
            AI Suggestion
          </span>
          <p className="text-sm text-text-secondary mt-1 mb-3 leading-relaxed">{suggestion}</p>
          <button
            onClick={() => onApply(i)}
            className="text-xs px-3 py-1.5 bg-accent-400 hover:bg-accent-500 text-bg-void rounded-md font-medium transition-colors duration-200"
          >
            Apply
          </button>
        </div>
      ))}
    </div>
  );
}
