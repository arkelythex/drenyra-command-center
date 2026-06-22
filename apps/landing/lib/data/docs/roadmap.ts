import { Clock, Rocket, Globe2, Building2, Target, Cpu, Layers, Zap, PenTool, Terminal } from "lucide-react";
import type { PageHeader, QuarterData, RoadmapPhase } from "@/lib/types/docs";

export const roadmapHeader: PageHeader = {
  badge: { text: "Control de misión", icon: Clock },
  title: "Secuencia de",
  highlight: "Lanzamiento",
  description: "Nuestra ruta crítica para construir la infraestructura cognitiva de Latinoamérica. De Ledger a Arkelythex OS.",
};

export const roadmapStats = [
  { value: "0-48", label: "Meses", icon: Clock },
  { value: "4", label: "Fases principales", icon: Target },
  { value: "3", label: "Productos principales", icon: Layers },
  { value: "100%", label: "Sovereign Core", icon: Zap },
];

export const roadmapData: QuarterData[] = [
  {
    id: "phase-1",
    quarter: "0-6 Meses",
    year: "Fase 1",
    theme: "Ledger: Núcleo operativo",
    status: "in-progress",
    milestones: [
      { id: "m1", title: "Ledger IA Contable", description: "Lanzamiento oficial del motor contable con IA.", icon: Zap, completed: false },
      { id: "m2", title: "Compliance SUNAT/OSE", description: "Validación nativa en tiempo real.", icon: Target, completed: false },
      { id: "m3", title: "Arkelythex API v1.0", description: "API pública para equipos de desarrollo.", icon: Rocket, completed: false },
    ],
  },
  {
    id: "phase-2",
    quarter: "6-12 Meses",
    year: "Fase 2",
    theme: "Studio: Canal profesional",
    status: "planned",
    milestones: [
      { id: "m4", title: "Arkelythex Studio", description: "Plataforma Multi-RUC para estudios contables.", icon: PenTool, completed: false },
      { id: "m5", title: "Piloto Grid POS", description: "Primeras 1,000 bodegas usando Grid.", icon: Layers, completed: false },
      { id: "m6", title: "Arkelythex Sentinel", description: "Terminal de IA para equipos técnicos de alto nivel.", icon: Terminal, completed: false },
    ],
  },
  {
    id: "phase-3",
    quarter: "12-24 Meses",
    year: "Fase 3",
    theme: "Cortex: Inteligencia aplicada",
    status: "planned",
    milestones: [
      { id: "m7", title: "Arkelythex Cortex", description: "Inteligencia predictiva sobre la data de Ledger.", icon: Cpu, completed: false },
      { id: "m8", title: "Sovereign Banking", description: "Servicios financieros directos desde el ecosistema.", icon: Building2, completed: false },
      { id: "m9", title: "Constructor de ecosistema", description: "Primeras 100 apps construidas sobre Arkelythex API.", icon: Rocket, completed: false },
    ],
  },
  {
    id: "phase-4",
    quarter: "24-48 Meses",
    year: "Fase 4",
    theme: "Expansión regional",
    status: "planned",
    milestones: [
      { id: "m10", title: "Colombia & Chile", description: "Lanzamiento oficial en mercados andinos.", icon: Globe2, completed: false },
      { id: "m11", title: "Arkelythex Gov", description: "Alianzas de infraestructura con entes estatales.", icon: Building2, completed: false },
      { id: "m12", title: "Arkelythex OS", description: "Consolidación como sistema operativo financiero.", icon: Rocket, completed: false },
    ],
  },
];

export const futurePhases: RoadmapPhase[] = [
  { year: "2028", title: "Expansión panregional", description: "México y Brasil. Arkelythex como el estándar regional.", metrics: "1M+ Empresas" },
  { year: "2030", title: "Arkelythex OS Global", description: "Infraestructura soberana para economías emergentes.", metrics: "Salida a bolsa" },
];
