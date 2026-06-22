/**
 * Vision Page Data
 * Centralized content following clean architecture
 */

import {
  Eye,
  Rocket,
  Globe2,
  Heart,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Cpu,
  Award,
  Building2,
  Leaf,
  Clock,
  ArrowUpRight,
} from "lucide-react";

import type { PageHeader, VisionPillar, FutureMilestone, ImpactArea, StatCard } from "@/lib/types/docs";

// ============================================================================
// HEADER
// ============================================================================

export const visionHeader: PageHeader = {
  badge: {
    text: "Visión 2026-2030",
    icon: Eye,
  },
  title: "Construyendo el",
  highlight: "Sistema Financiero del Futuro",
  description:
    "Nuestra visión trasciende el software contable. Arkelythex está creando la infraestructura de confianza para una economía digital peruana soberana, inclusiva y próspera.",
};

// ============================================================================
// MAIN QUOTE
// ============================================================================

export const visionQuote = {
  text: "Para el año 2030, Arkelythex habrá digitalizado el 50% de las PYMES peruanas, eliminando la carga administrativa y liberando a los empresarios para que se enfoquen en lo que realmente importa: crear valor, innovar y hacer crecer sus negocios.",
  author: "[Nombre CEO]",
  role: "CEO & Co-Fundador, Arkelythex",
};

// ============================================================================
// THREE PILLARS
// ============================================================================

export const visionPillars: VisionPillar[] = [
  {
    id: "sovereignty",
    title: "Soberanía Digital",
    description:
      "Las PYMES peruanas deben controlar sus datos financieros. Nuestra arquitectura Sovereign Core garantiza que cada empresa sea dueña absoluta de su información, procesada localmente con tecnología de grado militar.",
    icon: Shield,
    target: "100% soberanía de datos",
    year: "2030",
  },
  {
    id: "inclusion",
    title: "Inclusión Financiera",
    description:
      "Democratizamos el acceso a herramientas empresariales de clase mundial. Desde el emprendedor en provincias hasta la empresa exportadora, todos merecen tecnología que potencie su crecimiento sin barreras.",
    icon: Users,
    target: "1M+ PYMES digitalizadas",
    year: "2030",
  },
  {
    id: "innovation",
    title: "Innovación Continua",
    description:
      "No nos detenemos en el ERP. Arkelythex evolucionará hacia una plataforma financiera completa: CBDC, DeFi peruano, marketplace B2B, y más. Siempre un paso adelante.",
    icon: Rocket,
    target: "Plataforma financiera integral",
    year: "2030",
  },
];

// ============================================================================
// MILESTONES 2026-2030
// ============================================================================

export const futureMilestones: FutureMilestone[] = [
  {
    year: "2026",
    title: "Líder Nacional",
    description:
      "Arkelythex será la plataforma de inteligencia fiscal #1 en Perú por número de empresas activas y satisfacción del cliente.",
    metrics: "100,000+ empresas | 95% NPS | 15% market share",
  },
  {
    year: "2027",
    title: "Expansión Andina",
    description:
      "Expandimos a Colombia, Chile y Ecuador adaptando nuestro core a las regulaciones locales.",
    metrics: "3 países | 200,000+ empresas LATAM",
  },
  {
    year: "2028",
    title: "Arkelythex Banking",
    description:
      "Lanzamos servicios financieros integrados: pagos, préstamos P2P, factoring, todo nativo en la plataforma.",
    metrics: "$500M+ en transacciones mensuales",
  },
  {
    year: "2030",
    title: "Economía Digital Peruana",
    description: "Arkelythex es la infraestructura financiera estándar de Perú. IPO en NASDAQ/Lima.",
    metrics: "1M+ empresas | $2B+ valuation | IPO",
  },
];

// ============================================================================
// TECHNOLOGY VISION
// ============================================================================

export const techVision = [
  {
    title: "Sovereign Core 3.0",
    description:
      "Para 2028, nuestro motor financiero evolucionará hacia una arquitectura completamente descentralizada, permitiendo a las empresas operar nodos propios mientras mantienen compatibilidad con la red central.",
    icon: Zap,
  },
  {
    title: "CBDC Nativa",
    description:
      "Seremos la primera plataforma empresarial en Perú con integración nativa a la CBDC (Moneda Digital del Banco Central), permitiendo pagos instantáneos, programables y sin fricción.",
    icon: Globe2,
  },
  {
    title: "IA Financiera Avanzada",
    description:
      "Agentes de IA que no solo automatizan, sino que predicen, asesoran y optimizan en tiempo real. Desde detección de fraudes hasta recomendaciones de inversión personalizadas.",
    icon: Cpu,
  },
  {
    title: "Ecosistema Abierto",
    description:
      "Arkelythex se convierte en una plataforma abierta donde desarrolladores, bancos, y fintechs pueden construir aplicaciones sobre nuestra infraestructura, creando un ecosistema financiero vibrante.",
    icon: Building2,
  },
];

// ============================================================================
// IMPACT AREAS
// ============================================================================

export const impactAreas: ImpactArea[] = [
  {
    title: "Empoderamiento PYMES",
    description:
      "Reducimos en 80% el tiempo administrativo, permitiendo a los empresarios enfocarse en crecimiento e innovación.",
    icon: Building2,
    metric: "50M+",
    metricLabel: "Horas ahorradas/año",
  },
  {
    title: "Sostenibilidad",
    description:
      "Eliminamos papeleo, reducimos trámites presenciales, y optimizamos recursos. Arkelythex es 100% digital y carbon-neutral.",
    icon: Leaf,
    metric: "500K+",
    metricLabel: "Empleos indirectos",
  },
  {
    title: "Formalización",
    description:
      "Facilitamos la transición de empresas informales a formales, contribuyendo a un Perú más próspero y justo tributariamente.",
    icon: Award,
    metric: "S/ 2B",
    metricLabel: "Impuestos recaudados",
  },
];

// ============================================================================
// IMPACT STATS
// ============================================================================

export const impactStats: StatCard[] = [
  { value: "50M+", label: "Horas ahorradas/año", icon: Clock },
  { value: "500K+", label: "Empleos indirectos", icon: Users },
  { value: "S/ 2B", label: "Impuestos recaudados", icon: TrendingUp },
  { value: "98%", label: "Empresas satisfechas", icon: Heart },
];

// ============================================================================
// CTA
// ============================================================================

export const ctaData = {
  badge: {
    icon: Rocket,
    text: "Sé Parte de la Historia",
  },
  title: "Construyamos el Futuro Juntos",
  description:
    "Esta visión no se construye sola. Necesitamos inversores estratégicos, partners tecnológicos, y sobre todo, empresas peruanas que crean en un futuro digital mejor.",
  primaryAction: {
    text: "Invertir en la Visión",
    href: "/docs/investors",
    icon: TrendingUp,
  },
  secondaryAction: {
    text: "Ver Roadmap",
    href: "/docs/roadmap",
    icon: ArrowUpRight,
  },
};
