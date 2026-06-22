import React from 'react';
import { GitCompareArrows } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tokensToClasses } from '@/lib/design-tokens';
import type { HubArtifact } from '@arkelythex/shared/artifacts';
import { registerArtifact } from '../artifact-registry';

type AccountingDiffArt = Extract<HubArtifact, { type: 'accounting_diff' }>;

export const AccountingDiffArtifact: React.FC<{ artifact: AccountingDiffArt }> = ({
  artifact,
}) => {
  return (
    <div className={cn(tokensToClasses.borderRadius('card'), "mt-6 border border-border/40 bg-foreground/[0.03] p-6 backdrop-blur-3xl")}>
      <header className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-background/60">
          <GitCompareArrows size={18} />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-tight text-foreground">
            {artifact.title}
          </h4>
          <p className="text-2xs uppercase tracking-widest text-muted-foreground">
            {artifact.payload.scope}
          </p>
        </div>
      </header>

      <div className="mb-4 rounded-xl border border-border/30 bg-background/40 p-3 text-xs">
        <p className="font-semibold text-foreground">Comando:</p>
        <p className="text-muted-foreground">{artifact.payload.command}</p>
      </div>

      <div className="space-y-3">
        {artifact.payload.diffs.map((diff, index) => (
          <div
            key={`${diff.field}-${index}`}
            className="rounded-xl border border-border/25 bg-background/30 p-3"
          >
            <p className="mb-2 text-2xs font-black uppercase tracking-wider text-foreground/70">
              {diff.field}
            </p>
            <div className="grid gap-2 text-xs md:grid-cols-2">
              <p className="rounded-lg border border-border/25 bg-red-500/5 p-2 text-red-500">
                Antes: {diff.before}
              </p>
              <p className="rounded-lg border border-border/25 bg-[rgba(var(--premium-success-rgb),0.05)] p-2 text-[var(--premium-success)]">
                Después: {diff.after}
              </p>
            </div>
            {diff.reason ? (
              <p className="mt-2 text-label text-muted-foreground">{diff.reason}</p>
            ) : null}
          </div>
        ))}
      </div>

      {artifact.payload.summary ? (
        <p className="mt-4 rounded-xl border border-border/25 bg-background/30 p-3 text-xs text-muted-foreground">
          {artifact.payload.summary}
        </p>
      ) : null}
    </div>
  );
};

registerArtifact('accounting_diff', AccountingDiffArtifact);
