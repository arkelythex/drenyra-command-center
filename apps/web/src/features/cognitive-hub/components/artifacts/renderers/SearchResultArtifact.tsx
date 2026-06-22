import React from 'react';
/**
 * Search Result Artifact - Document search results
 *
 * Renders a list of search results with relevance scores.
 *
 * @since Feb 2026
 */

import { Search, ArrowUpRight } from 'lucide-react';
import type { HubArtifact } from '@arkelythex/shared/artifacts';
import { registerArtifact } from '../artifact-registry';

type SearchResultArt = Extract<HubArtifact, { type: 'search_result' }>;

export const SearchResultArtifact: React.FC<{ artifact: SearchResultArt }> = ({ artifact }) => (
  <div className="mt-6 rounded-xl border border-border/70 bg-card/92 p-5 shadow-xl animate-entrance">
    <header className="mb-6 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background/60 text-info">
        <Search size={16} />
      </div>
      <h4 className="text-sm font-black uppercase tracking-tight">{artifact.title}</h4>
    </header>

    <div className="space-y-4">
      {artifact.payload.results.map((res, idx) => (
        <div key={idx} className="rounded-lg border border-border/70 bg-background/50 p-4 transition-[background-color,border-color,box-shadow] duration-200 hover:border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xs font-black uppercase tracking-widest text-info">{res.source}</span>
            <span className="text-[8px] font-mono text-muted-foreground/70">{res.relevance}% Match</span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed mb-3">{res.snippet}</p>
          <button className="flex items-center gap-2 text-3xs font-black uppercase text-muted-foreground transition-colors hover:text-foreground">
            Inspeccionar fuente <ArrowUpRight size={10} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

// Auto-register
registerArtifact('search_result', SearchResultArtifact);
