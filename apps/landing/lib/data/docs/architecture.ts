/**
 * Architecture Page Data
 * Technical stack and system architecture - The Blueprint of Arkelythex
 */

import {
  Layers,
  Server,
  Database,
  Cloud,
  Cpu,
  Shield,
  Zap,
  Globe,
  Lock,
  Boxes,
  Network,
  Container,
  GitBranch,
  Search,
} from "lucide-react";

import type { PageHeader, ArchitectureLayer, TechStackItem, StatCard } from "@/lib/types/docs";

// ============================================================================
// HEADER
// ============================================================================

export const architectureHeader: PageHeader = {
  badge: {
    text: "Ingeniería de Plataforma",
    icon: Layers,
  },
  title: "Arquitectura de",
  highlight: "Infraestructura",
  description:
    "Arkelythex no es software, es infraestructura. Nuestra arquitectura está diseñada como un ecosistema soberano donde cada capa potencia a Ledger, Cortex y Grid.",
};

// ============================================================================
// ARCHITECTURE LAYERS (Product-Centric)
// ============================================================================

export const architectureLayers: ArchitectureLayer[] = [
  {
    name: "🌊 Ledger Interface (Frontend)",
    tech: ["Next.js 15", "React 19", "TanStack Query", "Tailwind CSS 4"],
    description:
      "Capa de interacción de alta precisión para contabilidad y compliance. Diseñada para velocidad operativa y claridad financiera absoluta.",
    icon: Globe,
  },
  {
    name: "🔌 Arkelythex API Gateway",
    tech: ["Hono", "Bun Runtime", "ElysiaJS", "API pública"],
    description:
      "La puerta de entrada a la infraestructura peruana. API pública de SUNAT que posiciona a Arkelythex como capa base para integraciones.",
    icon: Server,
  },
  {
    name: "🛡️ Sovereign Core™ (Engine)",
    tech: ["Rust", "WebAssembly", "Zero-Knowledge Logic"],
    description:
      "El motor inmutable que impulsa todo el ecosistema. Lógica financiera de grado industrial ejecutada con seguridad matemática.",
    icon: Shield,
  },
  {
    name: "⚒️ Cortex Intelligence (Data)",
    tech: ["PostgreSQL 16", "TimescaleDB", "Vector Search", "Redis"],
    description:
      "Capa de inteligencia sobre la data generada por Ledger. Almacenamiento optimizado para análisis predictivo y toma de decisiones.",
    icon: Database,
  },
  {
    name: "🕸️ Grid Retail (Edge)",
    tech: ["WASM Edge", "Offline-First", "Local Sync"],
    description:
      "Infraestructura para puntos de venta masivos. Capacidad de operar offline con sincronización soberana al core central.",
    icon: Cloud,
  },
  {
    name: "🔐 Security & Sovereignty",
    tech: ["AES-256-GCM", "ECDSA", "HSM Isolation", "Audit Trails"],
    description:
      "Garantía de propiedad de datos. Cifrado inquebrantable y trazabilidad total de cada transacción en el ecosistema.",
    icon: Lock,
  },
];

// ============================================================================
// TECH STACK DETAILED
// ============================================================================

export const techStack: TechStackItem[] = [
  {
    name: "Rust",
    category: "Core Engine",
    description: "Sovereign Core™ inmutable y ultra-seguro",
    version: "1.80+",
  },
  {
    name: "Bun",
    category: "Runtime",
    description: "Entorno de alto rendimiento para el API Gateway",
    version: "1.1.x",
  },
  {
    name: "Next.js 15",
    category: "Frontend",
    description: "Framework para las interfaces de Ledger y Cortex",
    version: "15.x",
  },
  {
    name: "WebAssembly",
    category: "Runtime",
    description: "Universalidad del core para Grid y navegadores",
    version: "WASM 2.0",
  },
  {
    name: "PostgreSQL",
    category: "Database",
    description: "Base de datos soberana para registros inmutables",
    version: "16.x",
  },
  {
    name: "Hono",
    category: "API Layer",
    description: "Framework ultra-rápido para el API Gateway",
    version: "4.x",
  },
  {
    name: "TimescaleDB",
    category: "Inteligencia de datos",
    description: "Análisis de series temporales para Cortex",
    version: "Latest",
  },
  {
    name: "Tailwind CSS 4",
    category: "Styling",
    description: "Diseño visual de precisión industrial",
    version: "4.x",
  },
];

// ============================================================================
// PERFORMANCE STATS
// ============================================================================

export const performanceStats: StatCard[] = [
  { value: "<2ms", label: "Latencia del core", icon: Zap },
  { value: "Hash", label: "Integridad verificable", icon: Shield },
  { value: "WASM", label: "Ruta de escala", icon: Cpu },
  { value: "Soberana", label: "Arquitectura de datos", icon: Lock },
];

// ============================================================================
// ARCHITECTURE NODES (Ecosystem Map)
// ============================================================================

export const architectureNodes = [
  {
    id: "ledger",
    label: "Interfaz Ledger",
    type: "client",
    tech: "Next.js 15 + React 19",
  },
  {
    id: "forge",
    label: "Inteligencia Cortex",
    type: "client",
    tech: "Paneles de inteligencia",
  },
  {
    id: "api",
    label: "Arkelythex API Gateway",
    type: "server",
    tech: "Hono + Bun Runtime",
  },
  {
    id: "core",
    label: "Sovereign Core™",
    type: "engine",
    tech: "Rust + WASM Financial Logic",
  },
  {
    id: "grid",
    label: "Grid Retail Node",
    type: "edge",
    tech: "POS offline + WASM Edge",
  },
  {
    id: "db",
    label: "Sovereign DB",
    type: "storage",
    tech: "PostgreSQL + TimescaleDB",
  },
];

// ============================================================================
// KEY PRINCIPLES
// ============================================================================

export const architectureFeatures = [
  {
    title: "Diseño explícito",
    description: "La estructura del código refleja directamente el ecosistema de productos.",
    icon: GitBranch,
  },
  {
    title: "Sovereign-First",
    description: "La propiedad de los datos no es opcional, está grabada en la arquitectura.",
    icon: Lock,
  },
  {
    title: "Analítica predictiva",
    description: "Infraestructura optimizada para la inteligencia de datos de Cortex.",
    icon: Search,
  },
  {
    title: "Resiliencia edge",
    description: "Grid está diseñado para operar en el borde y sostener continuidad operativa offline.",
    icon: Globe,
  },
  {
    title: "Core unificado",
    description: "Un solo motor de reglas busca consistencia operativa en todo el ecosistema.",
    icon: Boxes,
  },
  {
    title: "Grado industrial",
    description: "Construido con estándares de ingeniería para escalar a nivel nacional.",
    icon: Network,
  },
];

// ============================================================================
// CTA
// ============================================================================

export const architectureCta = {
  badge: {
    icon: Container,
    text: "Ecosistema",
  },
  title: "Construye sobre Arkelythex",
  description:
    "Usa nuestra infraestructura para escalar tus propias aplicaciones financieras con el Arkelythex API.",
  primaryAction: {
    text: "Ver API",
    href: "/api",
  },
  secondaryAction: {
    text: "Estructura de Datos",
    href: "/docs/sovereign-core",
  },
};
