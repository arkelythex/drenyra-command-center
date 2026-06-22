/**
 * Investor Page Data - The Cognitive Infrastructure Pitch
 */

import {
  TrendingUp,
  DollarSign,
  Shield,
  Code2,
  Zap,
  Cpu,
  Layers,
  CheckCircle2,
  PenTool,
  Terminal,
} from "lucide-react";

import type {
  PageHeader,
  InvestorMetric,
  FeatureCard,
  InvestmentRound,
  FundAllocation,
  TractionMetric,
  TeamMember,
} from "@/lib/types/docs";

// ============================================================================
// HEADER
// ============================================================================

export const investorHeader: PageHeader = {
  badge: {
    text: "Visión 2026-2030",
    icon: TrendingUp,
  },
  title: "Arkelythex:",
  highlight: "Infraestructura Cognitiva Regional",
  description:
    "Construimos el sistema operativo de la economía moderna. Una sola arquitectura soberana que escala desde la bodega local hasta la infraestructura del Estado.",
};

// ============================================================================
// METRICS (Top Stats)
// ============================================================================

export const investorMetrics: InvestorMetric[] = [
  {
    value: "100%",
    label: "Soberanía de Datos",
    icon: Shield,
    sublabel: "Arquitectura central",
  },
  {
    value: "$2.5B",
    label: "Mercado Objetivo",
    icon: DollarSign,
    sublabel: "Expansión regional",
  },
  {
    value: "4x",
    label: "Ganancia operativa",
    icon: Zap,
    sublabel: "Operación asistida por IA",
  },
  {
    value: "99.9%",
    label: "Índice de cumplimiento",
    icon: CheckCircle2,
    sublabel: "Listo para SUNAT",
  },
];

// ============================================================================
// CORE PRODUCT SUITE (The Image Blueprint)
// ============================================================================

export const competitiveAdvantages: FeatureCard[] = [
  {
    title: "🌊 Arkelythex Ledger",
    description:
      "Nuestra punta de lanza. Contabilidad con IA y compliance SUNAT/OSE en tiempo real. 0-6 meses.",
    icon: Zap,
    href: "/ledger",
    variant: "primary",
  },
  {
    title: "✍️ Arkelythex Studio",
    description:
      "Plataforma Multi-RUC para estudios contables. Captura masiva del canal tradicional. 6-12 meses.",
    icon: PenTool,
    href: "/studio",
    variant: "accent",
  },
  {
    title: "⚒️ Arkelythex Cortex",
    description:
      "Capa de inteligencia tributaria y benchmarking sobre la data operativa de Ledger y Studio. 12-24 meses.",
      
    icon: Cpu,
    href: "/cortex",
    variant: "primary",
  },
  {
    title: "🛡️ Arkelythex Sentinel",
    description:
      "Terminal de IA para equipos de alto rendimiento. Construye sobre nuestra infraestructura.",
    icon: Terminal,
    href: "/docs/sentinel",
    variant: "accent",
  },
  {
    id: "grid",
    title: "🕸️ Arkelythex Grid",
    description:
      "POS moderno para MYPEs y bodegas. Captura masiva del flujo transaccional masivo.",
    icon: Layers,
    href: "/docs/grid",
    variant: "primary",
  },
  {
    id: "api",
    title: "🔌 Arkelythex API",
    description:
      "La capa programable para integrarse con SUNAT y procesos tributarios peruanos.",
    icon: Code2,
    href: "/docs/api",
    variant: "accent",
  },
];

// ============================================================================
// TRACTION METRICS (Secondary Stats)
// ============================================================================

export const tractionMetrics: TractionMetric[] = [
  { value: "S/ 3.5M", label: "ARR Actual", growth: "Proyectado: S/ 25M (2027)" },
  { value: "50,000+", label: "Empresas objetivo", growth: "Fase 1: 5K" },
  { value: "1.2M", label: "Transacciones/mes", growth: "Capacidad del core" },
  { value: "0", label: "Riesgo de fuga de datos", growth: "Prueba de soberanía" },
];

// ============================================================================
// TECH STACK (The "Cortex" Materials)
// ============================================================================

export const techStack = [
  { name: "Sovereign Core", role: "Motor Rust", description: "Lógica inmutable y soberana" },
  { name: "WASM Runtime", role: "Código universal", description: "Ejecución aislada y ultra-segura" },
  { name: "Bun / Elysia", role: "Runtime de API", description: "Velocidad de ejecución masiva" },
  { name: "Agent Swarms", role: "Capa cognitiva", description: "IA distribuida y específica" },
  { name: "PostgreSQL 16", role: "Base soberana", description: "Almacenamiento de alta densidad" },
];

// ============================================================================
// INVESTMENT ROUND (The War Chest)
// ============================================================================

export const investmentRound: InvestmentRound = {
  type: "Ronda Seed",
  target: "S/ 3M",
  valuation: "S/ 15M",
  minTicket: "S/ 100,000",
};

// ============================================================================
// FUND ALLOCATION
// ============================================================================

export const fundAllocation: FundAllocation[] = [
  { category: "Producto: Ledger y Studio", percentage: 40, color: "bg-accent" },
  { category: "I+D: Cortex (IA)", percentage: 30, color: "bg-primary" },
  { category: "Operaciones e infraestructura", percentage: 20, color: "bg-white/50" },
  { category: "Estrategia regional", percentage: 10, color: "bg-white/30" },
];

// ============================================================================
// ROADMAP PREVIEW (The Execution Sequence)
// ============================================================================

export const roadmapPreview = [
  {
    quarter: "Fase 1: Ledger",
    title: "Entrada al mercado",
    items: ["Automatización contable con IA", "Compliance SUNAT nativo", "App móvil de Ledger"],
  },
  {
    quarter: "Fase 2: Studio",
    title: "Canal profesional",
    items: ["Centro multi-RUC para estudios", "Red de estudios contables", "Lanzamiento de Studio"],
  },
  {
    quarter: "Fase 3: Cortex",
    title: "Capa de inteligencia",
    items: ["Activación de la ventaja de datos", "Paneles predictivos", "Acceso temprano a Cortex"],
  },
  {
    quarter: "Fase 4: Regional",
    title: "Expansión regional",
    items: ["Expansión a Colombia y Chile", "Infraestructura como servicio", "Lanzamiento de Serie A"],
  },
];

// ============================================================================
// THE FOUNDER
// ============================================================================

export const foundingTeam: TeamMember[] = [
  {
    name: "DreamCoder",
    role: "Fundador y arquitecto principal",
    experience: "Experto en sistemas soberanos, Rust, WASM e IA agentiva.",
  },
  {
    name: "Arkelythex OS",
    role: "Visión futura",
    experience: "El sistema operativo financiero universal para Latinoamérica.",
  },
];

// ============================================================================
// PROBLEM / SOLUTION
// ============================================================================

export const problemSolution = {
  problem: {
    title: "Fragmentación Económica",
    description:
      "Latinoamérica está atrapada entre software obsoleto, burocracia estatal y falta de inteligencia de datos. Las PYMES pierden competitividad y soberanía.",
  },
  solution: {
    title: "Infraestructura Cognitiva",
    description:
      "Arkelythex crea una capa de inteligencia soberana que automatiza el cumplimiento, empodera a las empresas y moderniza el Estado a través de productos sinérgicos.",
  },
};
