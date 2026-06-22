/**
 * Sovereign Core Page Data
 * Rust/WASM financial engine documentation - The heart of Arkelythex
 */

import {
  Shield,
  Cpu,
  Zap,
  Lock,
  EyeOff,
  Fingerprint,
  ServerOff,
  Code2,
  Binary,
  Gauge,
  Key,
  FileCheck,
  Timer,
  Boxes,
} from "lucide-react";

import type { PageHeader, StatCard } from "@/lib/types/docs";

// ============================================================================
// HEADER
// ============================================================================

export const sovereignHeader: PageHeader = {
  badge: {
    text: "Infraestructura de Grado Industrial",
    icon: Shield,
  },
  title: "Arkelythex",
  highlight: "Sovereign Core™",
  description:
    "El motor universal de nuestra infraestructura. Una sola pieza de ingeniería en Rust que impulsa a Ledger, Cortex y Grid. Inmutable, ultra-rápido y soberano por diseño.",
};

// ============================================================================
// CORE STATS
// ============================================================================

export const coreStats: StatCard[] = [
  { value: "<5ms", label: "Latencia de Motor", icon: Timer },
  { value: "Rust", label: "Seguridad en el Metal", icon: Shield },
  { value: "Universal", label: "Multi-Producto", icon: Boxes },
  { value: "WASM", label: "Ejecución Soberana", icon: Binary },
];

// ============================================================================
// ECOSYSTEM INTEGRATION
// ============================================================================

export const coreFeatures = [
  {
    title: "Motor Multi-Producto",
    description:
      "Una base de código única en Rust que provee la lógica financiera para Ledger (Contabilidad), Cortex (IA) y Grid (Retail).",
    icon: Boxes,
  },
  {
    title: "Inmutabilidad de Datos",
    description:
      "Garantizamos por código que los registros financieros son inalterables una vez validados, creando un registro de auditoría perfecto.",
    icon: Shield,
  },
  {
    title: "Soberanía Total",
    description:
      "Tus datos financieros nunca salen de tu control. El core ejecuta cálculos complejos localmente vía WebAssembly.",
    icon: ServerOff,
  },
  {
    title: "Rendimiento extremo",
    description:
      "Rust ofrece rendimiento de C/C++ con seguridad moderna. Capaz de procesar millones de transacciones con latencia mínima.",
    icon: Zap,
  },
  {
    title: "Ejecución aislada",
    description:
      "Compilado a WASM para ejecución aislada. Diseñado para reducir superficie de riesgo en entornos web exigentes.",
    icon: Code2,
  },
  {
    title: "Lógica de conocimiento cero",
    description:
      "Valida transacciones y estados financieros sin exponer la data sensible, ideal para cumplimiento SUNAT privado.",
    icon: EyeOff,
  },
];

// ============================================================================
// ARCHITECTURE SECTIONS
// ============================================================================

export const architectureSections = [
  {
    title: "Rust Engine: Núcleo Cortex",
    description:
      "El núcleo está escrito en Rust para reducir clases de errores de memoria y favorecer ejecución predecible bajo carga.",
    icon: Cpu,
    features: [
      "Abstracciones sin costo",
      "Concurrencia sin miedo",
      "Seguridad de memoria estática",
      "Optimización de grado industrial",
    ],
  },
  {
    title: "WebAssembly: puerta de ejecución",
    description:
      "Universalidad absoluta. El core corre igual en un navegador, en un servidor edge o en un dispositivo POS de Grid.",
    icon: Binary,
    features: [
      "Aislamiento completo",
      "Rendimiento cuasi nativo",
      "Portabilidad en todo el ecosistema",
      "Compilación en tiempo real",
    ],
  },
  {
    title: "Capa soberana",
    description:
      "Integración nativa con protocolos criptográficos. Somos el foso tecnológico que protege la soberanía de los datos empresariales.",
    icon: Key,
    features: [
      "Firmas digitales Ed25519",
      "Cifrado de grado militar AES-256",
      "Hashing SHA-3 ultra-seguro",
      "Pruebas de integridad criptográfica",
    ],
  },
  {
    title: "Motor de validación",
    description:
      "El cerebro detrás de Ledger. Evalúa reglas tributarias peruanas para detectar riesgos antes del registro.",
    icon: FileCheck,
    features: [
      "Reglas SUNAT inyectables",
      "Validación de estados SIRE/PLE",
      "Prevención de errores contables",
      "Auditoría automatizada",
    ],
  },
];

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export const performanceMetrics = [
  {
    metric: "1M+",
    label: "TPS Capacidad",
    context: "Transacciones por segundo",
  },
  {
    metric: "1.2MB",
    label: "Tamaño binario",
    context: "Optimizado para edge",
  },
  {
    metric: "< 2ms",
    label: "Latencia de cálculo",
    context: "Tiempo de respuesta core",
  },
  {
    metric: "Zero",
    label: "Fugas de memoria",
    context: "Garantizado por Rust",
  },
];

// ============================================================================
// PRIVACY PRINCIPLES
// ============================================================================

export const privacyPrinciples = [
  {
    title: "Empresa Soberana",
    description: "Tú eres el único dueño de tu información. Arkelythex provee las herramientas, no captura los datos.",
    icon: Fingerprint,
  },
  {
    title: "Local first",
    description: "Priorizamos el procesamiento local para máxima velocidad y privacidad absoluta.",
    icon: ServerOff,
  },
  {
    title: "Verificable",
    description: "Cada operación del core es auditable y verificable mediante firmas criptográficas.",
    icon: FileCheck,
  },
  {
    title: "Infraestructura Real",
    description: "Construido para durar décadas. Código sólido sobre fundamentos inmutables.",
    icon: Lock,
  },
];

// ============================================================================
// COMPARISON TABLE
// ============================================================================

export const comparisonTable = {
  headers: ["Criterio", "Sovereign Core™", "SaaS Contable Común", "Legacy ERP"],
  rows: [
    ["Arquitectura", "Rust/WASM (Soberano)", "Node/PHP (Centralizado)", "On-premise (Cerrado)"],
    ["Propiedad de datos", "Total (Usuario)", "Compartida (SaaS)", "Local (Vulnerable)"],
    ["Velocidad", "Ultra-rápida (<2ms)", "Moderada (>200ms)", "Lenta (>1s)"],
    ["Multi-Producto", "Sí (Ledger/Cortex/Grid)", "No (Producto único)", "Limitado"],
    ["Soberanía", "Nativa", "Ninguna", "Manual"],
    ["Auditoría", "Criptográfica", "Logs de DB", "Papel / Logs manuales"],
  ],
};

// ============================================================================
// CTA
// ============================================================================

export const sovereignCta = {
  badge: {
    icon: Gauge,
    text: "Poder Industrial",
  },
  title: "Impulsa tu Empresa",
  description:
    "Descubre por qué el Sovereign Core™ es la base de la nueva economía peruana. Velocidad, seguridad y soberanía.",
  primaryAction: {
    text: "Ver Arquitectura",
    href: "/docs/architecture",
  },
  secondaryAction: {
    text: "Explorar Ledger",
    href: "/ledger",
  },
};
