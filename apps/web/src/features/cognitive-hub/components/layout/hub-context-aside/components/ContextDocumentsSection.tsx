import { BookMarked } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_VISIBLE_DOCUMENTS } from '../hub-context-aside.data';
import type { KnowledgeDocument } from '@/features/agent-swarm/hooks/useKnowledgeStore';

interface ContextDocumentsSectionProps {
  documents: KnowledgeDocument[];
}

export function ContextDocumentsSection({ documents }: ContextDocumentsSectionProps) {
  const visibleDocuments = documents.slice(0, MAX_VISIBLE_DOCUMENTS);
  const hiddenDocumentsCount = Math.max(documents.length - visibleDocuments.length, 0);

  return (
    <div className="space-y-4">
      <span className="flex items-center justify-between px-1 text-label font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
        Evidencia normativa
        <BookMarked size={10} />
      </span>

      <div className="grid grid-cols-1 gap-2">
        {visibleDocuments.map((document) => (
          <div
            key={document.id}
            className="group flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3 transition-colors duration-150 hover:border-[var(--border-default)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="truncate text-xs font-medium text-[var(--text-primary)]">{document.name}</span>
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  document.status === 'indexed' ? 'bg-info' : 'animate-pulse bg-warning',
                )}
              />
            </div>
            <span className="text-2xs font-medium text-[var(--text-secondary)]">
              {document.rulesCount} reglas indexadas
            </span>
          </div>
        ))}
      </div>

      {hiddenDocumentsCount > 0 ? (
        <p className="px-1 text-2xs text-[var(--text-secondary)]">
          +{hiddenDocumentsCount} documentos disponibles para grounding.
        </p>
      ) : null}
    </div>
  );
}
