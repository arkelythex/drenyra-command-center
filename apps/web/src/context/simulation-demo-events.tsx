import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  DollarSign,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface SimulationDemoEvent {
  duration: number;
  icon: ReactNode;
  message: string;
  title: string;
  type: string;
}

export const DEMO_EVENTS: ReadonlyArray<SimulationDemoEvent> = [
  {
    type: 'invoice_received',
    title: 'Nueva Factura Recibida',
    message: 'AWS Cloud Services - $450.00',
    icon: <FileText className="text-info" />,
    duration: 5000,
  },
  {
    type: 'payment_match',
    title: 'Conciliacion Exitosa',
    message: 'Pago de cliente "Minera Las Bambas" detectado (S/ 45,000).',
    icon: <CheckCircle2 className="text-success" />,
    duration: 6000,
  },
  {
    type: 'sunat_alert',
    title: 'Alerta SUNAT',
    message: 'Buzon electronico: notificacion de embargo preventivo (simulacro).',
    icon: <ShieldAlert className="text-danger" />,
    duration: 8000,
  },
  {
    type: 'cashflow_warning',
    title: 'Riesgo de Liquidez',
    message: 'Proyeccion: saldo negativo en 3 dias si no se cobran facturas pendientes.',
    icon: <AlertTriangle className="text-warning" />,
    duration: 7000,
  },
  {
    type: 'bank_sync',
    title: 'Banco BCP Sincronizado',
    message: '14 nuevos movimientos procesados correctamente.',
    icon: <Building2 className="text-success" />,
    duration: 4000,
  },
  {
    type: 'tax_payment',
    title: 'Pago de Impuestos',
    message: 'Recordatorio: vencimiento de IGV - periodo enero 2026 manana.',
    icon: <DollarSign className="text-warning" />,
    duration: 6000,
  },
] as const;
