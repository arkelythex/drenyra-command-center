/**
 * CBDC & Banking Page Data
 * Central Bank Digital Currency integration
 */

import {
  Banknote,
  Building2,
  Zap,
  Clock,
  Shield,
  Globe,
  ArrowRightLeft,
  Wallet,
  Repeat,
  Landmark,
  CreditCard,
  Smartphone,
  TrendingUp,
  Lock,
  Coins,
  Sparkles,
} from "lucide-react";

import type { PageHeader, StatCard } from "@/lib/types/docs";

// ============================================================================
// HEADER
// ============================================================================

export const cbdcHeader: PageHeader = {
  badge: {
    text: "Banca del Futuro",
    icon: Banknote,
  },
  title: "CBDC &",
  highlight: "Banking",
  description:
    "Arkelythex es la primera plataforma empresarial peruana con integración nativa a la Moneda Digital del Banco Central (CBDC). Pagos instantáneos, programables y sin fricción.",
};

// ============================================================================
// CBDC STATS
// ============================================================================

export const cbdcStats: StatCard[] = [
  { value: "Instantáneo", label: "Pagos 24/7", icon: Zap },
  { value: "S/ 0.00", label: "Costo por transferencia", icon: Coins },
  { value: "BCRP", label: "Marco de referencia", icon: Shield },
  { value: "Smart", label: "Contratos programables", icon: Sparkles },
];

// ============================================================================
// CBDC FEATURES
// ============================================================================

export const cbdcFeatures = [
  {
    title: "Pagos Instantáneos",
    description: "Transferencias proyectadas para disponibilidad amplia y liquidación rápida según el marco regulatorio.",
    icon: Zap,
  },
  {
    title: "Costo operativo bajo",
    description: "Modelo orientado a reducir costos operativos frente a transferencias tradicionales.",
    icon: Coins,
  },
  {
    title: "Pagos Programables",
    description: "Automatiza pagos recurrentes, condicionales, y basados en eventos con smart contracts.",
    icon: Clock,
  },
  {
    title: "Respaldado por BCRP",
    description: "La CBDC es dinero soberano del Estado Peruano. Mismo respaldo que el sol físico.",
    icon: Shield,
  },
  {
    title: "Interoperabilidad",
    description: "Compatible con todos los bancos y billeteras digitales autorizadas por el BCRP.",
    icon: ArrowRightLeft,
  },
  {
    title: "Transparencia Total",
    description: "Registro inmutable de todas las transacciones. Auditoría simplificada.",
    icon: Globe,
  },
];

// ============================================================================
// INTEGRATED BANKS
// ============================================================================

export const integratedBanks = [
  {
    name: "Banco de Crédito del Perú",
    shortName: "BCP",
    type: "Banco Principal",
    features: ["Cuentas empresariales", "Líneas de crédito", "API integration"],
  },
  {
    name: "BBVA Perú",
    shortName: "BBVA",
    type: "Banco Principal",
    features: ["Net Cash", "API bancaria", "Conciliación automática"],
  },
  {
    name: "Scotiabank Perú",
    shortName: "Scotiabank",
    type: "Banco Principal",
    features: ["Cash Management", "API integration", "Reporting avanzado"],
  },
  {
    name: "Interbank",
    shortName: "Interbank",
    type: "Banco Principal",
    features: ["Banca empresas", "API abierta", "Alertas en tiempo real"],
  },
  {
    name: "Yape",
    shortName: "Yape",
    type: "Billetera Digital",
    features: ["Pagos QR", "Transferencias instantáneas", "Masivo adoption"],
  },
  {
    name: "Plin",
    shortName: "Plin",
    type: "Billetera Digital",
    features: ["Interbancario gratuito", "Transferencias", "App mobile"],
  },
];

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export const paymentTypes = [
  {
    title: "Pagos a Proveedores",
    description: "Programa pagos a proveedores con fechas, condiciones, y aprobaciones automáticas.",
    icon: Building2,
    benefits: ["Programación temporal", "Aprobaciones workflow", "Confirmación automática"],
  },
  {
    title: "Cobros a Clientes",
    description: "Genera links de cobro, QR codes, y suscripciones con cobro automático.",
    icon: Wallet,
    benefits: ["Links de pago", "Cobro recurrente", "Suscripciones"],
  },
  {
    title: "Nómina Digital",
    description: "Pago de planillas directo a billeteras digitales de empleados. Sin costo.",
    icon: CreditCard,
    benefits: ["Depósito directo", "A cualquier billetera", "Comprobantes auto"],
  },
  {
    title: "Transferencias Masivas",
    description: "Ejecuta cientos de pagos en un solo lote. Ideal para devoluciones o reembolsos.",
    icon: Repeat,
    benefits: ["Batch processing", "Hasta 1000 pagos", "Tracking individual"],
  },
];

// ============================================================================
// SMART CONTRACTS
// ============================================================================

export const smartContractExamples = [
  {
    name: "Pago Condicional",
    description: "El pago se ejecuta automáticamente cuando se cumple una condición (entrega, aprobación, fecha).",
    example: "Pagar proveedor solo cuando el tracking confirme entrega",
  },
  {
    name: "Escrow Automático",
    description: "Fondos retenidos hasta que ambas partes confirmen cumplimiento.",
    example: "Retener pago hasta recepción de mercadería confirmada",
  },
  {
    name: "Pago Escalonado",
    description: "Liberación de fondos en etapas según hitos del proyecto.",
    example: "30% al inicio, 40% a mitad, 30% al finalizar",
  },
  {
    name: "Suscripción Recurrente",
    description: "Cobros automáticos periódicos con notificación previa.",
    example: "Cobrar mensualidad SaaS automáticamente",
  },
];

// ============================================================================
// SECURITY FEATURES
// ============================================================================

export const securityFeatures = [
  {
    title: "Autenticación Biométrica",
    description: "Confirmación de transacciones con huella digital o reconocimiento facial.",
    icon: Smartphone,
  },
  {
    title: "Multi-Firma",
    description: "Requiere aprobación de múltiples usuarios para montos mayores.",
    icon: Lock,
  },
  {
    title: "Límites Configurables",
    description: "Define límites diarios, por transacción, y por destinatario.",
    icon: Shield,
  },
  {
    title: "Auditoría Completa",
    description: "Registro inmutable de todas las operaciones con timestamps.",
    icon: Landmark,
  },
];

// ============================================================================
// BENEFITS COMPARISON
// ============================================================================

export const benefitsComparison = {
  headers: ["Característica", "CBDC", "Transferencia Bancaria", "Efectivo"],
  rows: [
    ["Velocidad", "Instantánea", "1-2 días hábiles", "Inmediata"],
    ["Costo", "S/ 0.00", "S/ 5-20+", "Transporte/riesgo"],
    ["Horario", "24/7/365", "Hora bancaria", "N/A"],
    ["Seguridad", "Criptográfica", "Alta", "Riesgo físico"],
    ["Trazabilidad", "Total", "Parcial", "Ninguna"],
    ["Programabilidad", "Sí (smart contracts)", "No", "No"],
  ],
};

// ============================================================================
// CTA
// ============================================================================

export const cbdcCta = {
  badge: {
    icon: TrendingUp,
    text: "Futuro Financiero",
  },
  title: "Prepárate para la CBDC",
  description:
    "Arkelythex es la primera plataforma lista para la Moneda Digital del Banco Central del Perú. Sé pionero en la nueva era financiera.",
  primaryAction: {
    text: "Unirse a Lista de Espera",
    href: "/waitlist",
  },
  secondaryAction: {
    text: "Ver Demo CBDC",
    href: "/demo/cbdc",
  },
};
