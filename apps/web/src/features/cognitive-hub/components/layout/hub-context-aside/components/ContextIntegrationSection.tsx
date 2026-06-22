import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SunatFallbackStatusCard } from '../../SunatFallbackStatusCard';
import type { IntegrationStatus } from '../../hub-right-rail.constants';

interface ContextIntegrationSectionProps {
  integrations: IntegrationStatus[];
}

export function ContextIntegrationSection({ integrations }: ContextIntegrationSectionProps) {
  return (
    <div className="space-y-3">
      <span className="flex items-center gap-2 px-1 text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
        Orquestación
        <Layers size={12} />
      </span>

      <div className="grid grid-cols-1 gap-2.5">
        {integrations.map((service) => (
          <div
            key={service.name}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-label font-medium text-[var(--text-primary)]">{service.name}</span>
              <span
                className={cn(
                  'text-3xs font-bold uppercase tracking-wider',
                  service.tone === 'ok' ? 'text-info' : 'text-warning',
                )}
              >
                {service.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-1">
        <SunatFallbackStatusCard />
      </div>
    </div>
  );
}
