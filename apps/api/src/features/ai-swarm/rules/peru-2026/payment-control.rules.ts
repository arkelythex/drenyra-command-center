import type { PeruRule2026 } from './types';
import { SOURCES_2026 } from './sources';

/**
 * PAYMENT_CONTROL_RULES_2026 const.
 *
 * @example
 * ```ts
 * console.log(PAYMENT_CONTROL_RULES_2026);
 * ```
 */
export const PAYMENT_CONTROL_RULES_2026: PeruRule2026[] = [
  {
    id: 'PAY-001',
    domain: 'bancarizacion',
    status: 'active',
    severity: 'high',
    summary: 'Operaciones sobre umbral de bancarización deben usar medio de pago trazable.',
    effectiveFrom: '2026-01-01',
    tags: ['bancarizacion', 'medio-pago'],
    sources: [SOURCES_2026.rentaGastosRuc],
  },
  {
    id: 'PAY-002',
    domain: 'bancarizacion',
    status: 'active',
    severity: 'medium',
    summary: 'El umbral de bancarización debe permanecer configurable por cambios normativos.',
    effectiveFrom: '2026-01-01',
    tags: ['configurable', 'umbral'],
    sources: [SOURCES_2026.rentaGastosRuc],
  },
  {
    id: 'PAY-003',
    domain: 'detraccion',
    status: 'active',
    severity: 'high',
    summary: 'Operaciones afectas a SPOT sobre el mínimo operativo deben marcar detracción obligatoria.',
    effectiveFrom: '2026-01-01',
    tags: ['spot', 'detraccion'],
    sources: [SOURCES_2026.sirePortal],
  },
  {
    id: 'PAY-004',
    domain: 'detraccion',
    status: 'active',
    severity: 'high',
    summary: 'Si el comprobante requiere detracción y no registra depósito, bloquear pase automático.',
    effectiveFrom: '2026-01-01',
    tags: ['deposito', 'bloqueo'],
    sources: [SOURCES_2026.sirePortal],
  },
  {
    id: 'PAY-005',
    domain: 'detraccion',
    status: 'active',
    severity: 'medium',
    summary: 'Diferencias entre monto sujeto a detracción y base declarada deben elevar score de riesgo.',
    effectiveFrom: '2026-01-01',
    tags: ['riesgo', 'consistencia'],
    sources: [SOURCES_2026.sirePortal],
  },
  {
    id: 'PAY-006',
    domain: 'igv',
    status: 'active',
    severity: 'medium',
    summary: 'IGV igual a cero en operaciones gravadas debe generar observación automática.',
    effectiveFrom: '2026-01-01',
    tags: ['igv', 'observacion'],
    sources: [SOURCES_2026.sirePortal],
  },
  {
    id: 'PAY-007',
    domain: 'bancarizacion',
    status: 'active',
    severity: 'medium',
    summary: 'Pagos fraccionados orientados a evadir umbral deben detectarse por ventana temporal.',
    effectiveFrom: '2026-01-01',
    tags: ['fraccionamiento', 'riesgo'],
    sources: [SOURCES_2026.rentaGastosRuc],
  },
  {
    id: 'PAY-008',
    domain: 'monitoring',
    status: 'monitoring',
    severity: 'low',
    summary: 'Proyecto RS 000002-2026 sobre boletos aéreos se monitorea como regla futura pendiente.',
    effectiveFrom: '2026-01-31',
    tags: ['boletos-aereos', 'proyecto', 'monitoring'],
    sources: [SOURCES_2026.projectBoletosAereos2026],
  },
];
