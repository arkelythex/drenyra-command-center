import type { ReactElement } from "react";
import { Lock, Users, History, Link } from "lucide-react";

interface ArchLayer {
  icon: typeof Lock;
  title: string;
  description: string;
  flow: string;
}

const LAYERS: ArchLayer[] = [
  {
    icon: Lock,
    title: "Cifrado AES-256",
    description:
      "Datos cifrados en tránsito con TLS 1.3 y en reposo con AES-256-GCM. Ningún dato sensible vive sin cifrar.",
    flow: "TLS 1.3 ────── AES-256-GCM",
  },
  {
    icon: Users,
    title: "Row Level Security (RLS)",
    description:
      "Políticas de acceso a nivel de fila en PostgreSQL. Cada usuario ve exactamente lo que le corresponde según su rol.",
    flow: "User ──▶ Role ──▶ Policy ──▶ Scoped Data",
  },
  {
    icon: History,
    title: "Trazabilidad de decisiones",
    description:
      "Hash + timestamp + regla aplicada por cada decisión operativa. Evidencia inmutable para auditoría.",
    flow: "Decisión ──▶ Hash ──▶ Timestamp ──▶ Regla",
  },
  {
    icon: Link,
    title: "Cadena de hash",
    description:
      "Cada bloque de operaciones conecta con el anterior mediante hash criptográfico. Integridad verificable.",
    flow: "Block #1 ──▶ Block #2 ──▶ Block #3",
  },
];

function ConnectorArrow(): ReactElement {
  return (
    <div className="flex justify-center py-1" aria-hidden="true">
      <svg height="20" width="2" className="overflow-visible">
        <line x1="1" y1="0" x2="1" y2="14" className="stroke-muted-foreground/20" strokeWidth="2" />
        <polygon points="-3,12 5,12 1,18" className="fill-muted-foreground/20" />
      </svg>
    </div>
  );
}

export function SeguridadArchDiagram(): ReactElement {
  return (
    <div className="mx-auto max-w-3xl" role="img" aria-label="Diagrama de arquitectura de seguridad con cuatro capas: cifrado, RLS, trazabilidad y cadena de hash">
      <div className="space-y-0">
        {LAYERS.map((layer, index) => {
          const Icon = layer.icon;
          const isLast = index === LAYERS.length - 1;
          return (
            <div key={layer.title}>
              <div className="flex items-start gap-5 rounded-2xl border border-[var(--drenyra-border-soft)] bg-[var(--drenyra-card)] p-6 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--drenyra-border-soft)] bg-[var(--drenyra-accent-muted)]">
                  <Icon className="h-5 w-5 drenyra-text-accent" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-foreground">
                    {layer.title}
                    <span className="ml-3 font-mono text-xs tracking-wider text-muted-foreground/50">
                      layer {index + 1}
                    </span>
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {layer.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 font-mono text-label tracking-wide text-muted-foreground/40">
                    {layer.flow}
                  </div>
                </div>
              </div>
              {!isLast && <ConnectorArrow />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
