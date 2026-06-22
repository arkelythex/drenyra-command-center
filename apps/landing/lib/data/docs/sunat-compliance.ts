/**
 * SUNAT Compliance Page Data
 * Peruvian tax compliance documentation
 */

import {
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Receipt,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  Upload,
  FileCheck,
  BookOpen,
  Scale,
  Gavel,
} from "lucide-react";

import type { PageHeader, ComplianceItem, StatCard } from "@/lib/types/docs";

// ============================================================================
// HEADER
// ============================================================================

export const sunatHeader: PageHeader = {
  badge: {
    text: "Cumplimiento Peruano",
    icon: Building2,
  },
  title: "SUNAT",
  highlight: "Compliance",
  description:
    "Arkelythex documenta controles para operación tributaria peruana: validaciones previas, reportes PLE/SIRE y seguimiento de cambios normativos."
};

// ============================================================================
// COMPLIANCE STATS
// ============================================================================

export const complianceStats: StatCard[] = [
  { value: "SUNAT", label: "Validación previa", icon: CheckCircle2 },
  { value: "PLE", label: "Formatos soportados", icon: FileText },
  { value: "SIRE", label: "Integración lista", icon: Zap },
  { value: "Real-time", label: "Actualización normativa", icon: Clock },
];

// ============================================================================
// REGULATIONS SUPPORTED
// ============================================================================

export const regulationsSupported: ComplianceItem[] = [
  {
    regulation: "PLE - Programa de Libros Electrónicos",
    status: "completed",
    description: "Preparación asistida de libros electrónicos en formatos SUNAT: ventas, compras, inventarios, caja y bancos.",
    icon: BookOpen,
  },
  {
    regulation: "SIRE - Sistema Integrado de Registros",
    status: "completed",
    description: "Flujos orientados a SIRE para preparar y revisar registros de ventas y compras.",
    icon: Upload,
  },
  {
    regulation: "Facturación Electrónica (SEE)",
    status: "completed",
    description: "Gestión de comprobantes electrónicos con validaciones previas y evidencia operativa.",
    icon: Receipt,
  },
  {
    regulation: "Régimen MYPE Tributario",
    status: "completed",
    description: "Soporte operativo para RMT: categorización, límites de compras y reportes de revisión.",
    icon: Scale,
  },
  {
    regulation: "Detracciones SPOT",
    status: "completed",
    description: "Cálculo automático de detracciones, generación de constancias, y tracking de pagos.",
    icon: Calculator,
  },
  {
    regulation: "Percepciones y Retenciones",
    status: "completed",
    description: "Gestión de percepciones IGV, retenciones de renta (4ta, 5ta categoría) y otros.",
    icon: Gavel,
  },
  {
    regulation: "PDT 621 - IGV Renta Mensual",
    status: "completed",
    description: "Preparación de información para PDT 621 con validaciones automáticas.",
    icon: FileCheck,
  },
  {
    regulation: "PDT 706 - Régimen de Renta",
    status: "completed",
    description: "Cálculo y generación de datos para declaración anual PDT 706.",
    icon: FileCheck,
  },
];

// ============================================================================
// AUTOMATION FEATURES
// ============================================================================

export const automationFeatures = [
  {
    title: "Validación en Tiempo Real",
    description: "Cada transacción se valida automáticamente contra las normas SUNAT vigentes antes de ser registrada.",
    icon: Zap,
  },
  {
    title: "Alertas Inteligentes",
    description: "Notificaciones proactivas sobre vencimientos, límites RMT, y requerimientos normativos.",
    icon: AlertCircle,
  },
  {
    title: "Generación PLE Automática",
    description: "Exporta libros electrónicos en formatos SUNAT con un solo click. Sin errores de formato.",
    icon: FileText,
  },
  {
    title: "Sincronización SIRE",
    description: "Envío automático de RVIE y RCE a SIRE. Tracking de estados y correcciones.",
    icon: Upload,
  },
  {
    title: "Cálculo de Impuestos",
    description: "IGV, renta, detracciones, percepciones calculados automáticamente con precisión.",
    icon: Calculator,
  },
  {
    title: "Actualizaciones Normativas",
    description: "El sistema se actualiza automáticamente cuando SUNAT publica nuevas normas.",
    icon: Clock,
  },
];

// ============================================================================
// REPORTS AVAILABLE
// ============================================================================

export const availableReports = [
  {
    code: "PLE 5.0",
    name: "Registro de Ventas e Ingresos",
    format: "TXT / Excel",
    frequency: "Mensual",
  },
  {
    code: "PLE 6.0",
    name: "Registro de Compras",
    format: "TXT / Excel",
    frequency: "Mensual",
  },
  {
    code: "PLE 13.1",
    name: "Registro de Inventarios",
    format: "TXT",
    frequency: "Anual",
  },
  {
    code: "SIRE RVIE",
    name: "Registro de Ventas e Ingresos Electrónicos",
    format: "JSON API",
    frequency: "Mensual",
  },
  {
    code: "SIRE RCE",
    name: "Registro de Compras Electrónicas",
    format: "JSON API",
    frequency: "Mensual",
  },
  {
    code: "RMT",
    name: "Reporte Régimen MYPE",
    format: "PDF / Excel",
    frequency: "Trimestral",
  },
];

// ============================================================================
// COMPLIANCE BADGES
// ============================================================================

export const complianceBadges = [
  {
    title: "SUNAT Validado",
    description: "Software validado para facturación electrónica y PLE",
    icon: Shield,
  },
  {
    title: "OSE Integrado",
    description: "Conexión con Operadores de Servicios Electrónicos autorizados",
    icon: CheckCircle2,
  },
  {
    title: "Normas Vigentes",
    description: "Siempre actualizado con las últimas normas tributarias",
    icon: BookOpen,
  },
  {
    title: "Soporte Técnico",
    description: "Equipo especializado en normativa peruana",
    icon: Building2,
  },
];

// ============================================================================
// UPDATES TIMELINE
// ============================================================================

export const updatesTimeline = [
  {
    date: "Enero 2025",
    change: "Nuevos códigos Afectación IGV",
    description: "Actualización de códigos 10, 11, 12, 13, 14, 15, 16 según RS 033-2024",
  },
  {
    date: "Marzo 2025",
    change: "SIRE obligatorio para todas las empresas",
    description: "Implementación completa del sistema SIRE para RVIE y RCE",
  },
  {
    date: "Junio 2025",
    change: "Facturación Electrónica 2.0",
    description: "Nuevos campos obligatorios en comprobantes electrónicos",
  },
];

// ============================================================================
// CTA
// ============================================================================

export const sunatCta = {
  badge: {
    icon: TrendingUp,
    text: "Cumplimiento Garantizado",
  },
  title: "Dile Adiós a las Multas",
  description:
    "Con Arkelythex, el cumplimiento tributario es automático. Concéntrate en tu negocio, nosotros nos encargamos de SUNAT.",
  primaryAction: {
    text: "Agendar Demo",
    href: "/contact",
  },
  secondaryAction: {
    text: "Ver Guía SUNAT",
    href: "/guides/sunat",
  },
};
