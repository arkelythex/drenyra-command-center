import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Fragment } from 'react';
import { entranceVariants, MotionDiv } from '@/components/ui/motion-primitives';
import { cn, n } from '@/lib/utils';
import { categoryConfig, severityConfig } from './config';
import type { ContributorHealth, RiskCategory, RiskItem, RiskSeverity } from './types';

function getRiskCount(risks: RiskItem[], category: RiskCategory, severity: RiskSeverity) {
  return risks.filter((risk) => risk.category === category && risk.severity === severity).length;
}

export function RiskHeatMap({ risks }: { risks: RiskItem[] }) {
  const categories: RiskCategory[] = ['fiscal', 'compliance', 'operational', 'financial'];
  const severities: RiskSeverity[] = ['critical', 'high', 'medium', 'low'];

  return (
    <div className="grid grid-cols-5 gap-2">
      <div className="col-span-1" />
      {severities.map((severity) => (
        <div
          key={severity}
          className={cn('py-2 text-center text-2xs font-bold uppercase rounded', severityConfig[severity].bg)}
        >
          {severityConfig[severity].label}
        </div>
      ))}

      {categories.map((category) => (
        <Fragment key={category}>
          <div key={`${category}-label`} className="flex items-center justify-end pr-3">
            <span className="text-2xs font-bold uppercase text-muted-foreground">
              {categoryConfig[category].label}
            </span>
          </div>
          {severities.map((severity) => {
            const count = getRiskCount(risks, category, severity);
            return (
              <div
                key={`${category}-${severity}`}
                className={cn(
                  'aspect-square cursor-pointer rounded-lg flex items-center justify-center text-lg font-black transition-transform duration-150 hover:scale-[1.03]',
                  count > 0 ? severityConfig[severity].bg : 'bg-muted/40',
                )}
              >
                {count > 0 ? <span className={severityConfig[severity].color}>{count}</span> : null}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

function RiskTrend({ trend }: { trend: RiskItem['trend'] }) {
  const Icon: LucideIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
  const color = trend === 'up' ? 'text-danger' : trend === 'down' ? 'text-success' : 'text-muted-foreground';

  return <Icon className={cn('h-3 w-3', color)} />;
}

export function RiskCard({ risk, index }: { risk: RiskItem; index: number }) {
  const config = severityConfig[risk.severity];

  return (
    <MotionDiv variants={entranceVariants} custom={index} initial="hidden" animate="visible">
      <article className={cn('group cursor-pointer rounded-xl border p-4 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 hover:shadow-md', config.bg, config.border)}>
        <div className="mb-2 flex items-start justify-between">
          <span className={cn('rounded px-2 py-0.5 text-2xs font-black uppercase tracking-wider', config.bg, config.color)}>
            {config.label}
          </span>
          <div className="flex items-center gap-1">
            <RiskTrend trend={risk.trend} />
            <span className="font-mono text-2xs text-muted-foreground">{risk.probability}%</span>
          </div>
        </div>

        <h4 className="mb-1 text-sm font-bold text-foreground transition-colors group-hover:text-info">
          {risk.title}
        </h4>
        <p className="mb-2 text-xs text-muted-foreground">{risk.description}</p>

        {risk.amount ? (
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-success">{n(risk.amount)}</span>
            <span className="text-muted-foreground">{risk.impact}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{risk.impact}</span>
        )}
      </article>
    </MotionDiv>
  );
}

const contributorStatusConfig: Record<
  ContributorHealth['status'],
  { icon: LucideIcon; color: string; bg: string; label: string }
> = {
  active: {
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success-muted',
    label: 'ACTIVO',
  },
  inactive: {
    icon: XCircle,
    color: 'text-muted-foreground',
    bg: 'bg-muted/40',
    label: 'INACTIVO',
  },
  no_habido: {
    icon: XCircle,
    color: 'text-danger',
    bg: 'bg-danger-muted',
    label: 'NO HABIDO',
  },
  pending: {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning-muted',
    label: 'PENDIENTE',
  },
};

function toRiskSeverity(score: number): RiskSeverity {
  if (score < 20) return 'low';
  if (score < 50) return 'medium';
  return 'high';
}

export function ContributorHealthCard({ contributor }: { contributor: ContributorHealth }) {
  const status = contributorStatusConfig[contributor.status];
  const StatusIcon = status.icon;
  const severity = toRiskSeverity(contributor.riskScore);
  const riskStyle = severityConfig[severity];

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/30 bg-card/55 p-3 transition-[border-color,background-color] duration-200 hover:border-border/60 hover:bg-card/80">
      <div className="flex items-center gap-3">
        <div className={cn('rounded-lg p-2', status.bg)}>
          <StatusIcon className={cn('h-4 w-4', status.color)} />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">{contributor.name}</p>
          <p className="font-mono text-2xs text-muted-foreground">{contributor.ruc}</p>
        </div>
      </div>

      <div className="text-right">
        <div className={cn('rounded px-2 py-0.5 text-xs font-bold', riskStyle.bg, riskStyle.color)}>
          {contributor.riskScore}% riesgo
        </div>
        <p className="mt-1 text-2xs text-muted-foreground">{contributor.documentsCount} docs</p>
      </div>
    </div>
  );
}
