import type { PeruRule2026 } from './types';
import { SOURCES_2026 } from './sources';

/**
 * RUC_RULES_2026 const.
 *
 * @example
 * ```ts
 * console.log(RUC_RULES_2026);
 * ```
 */
export const RUC_RULES_2026: PeruRule2026[] = [
  {
    id: 'RUC-001',
    domain: 'ruc',
    status: 'active',
    severity: 'high',
    summary: 'RUC debe tener 11 dígitos y checksum válido (módulo 11).',
    effectiveFrom: '2026-01-01',
    tags: ['checksum', 'identidad'],
    sources: [SOURCES_2026.rucNoHallado],
  },
  {
    id: 'RUC-002',
    domain: 'ruc',
    status: 'active',
    severity: 'high',
    summary: 'Comprobantes para deducción tributaria exigen proveedor con RUC activo.',
    effectiveFrom: '2026-01-01',
    tags: ['deduccion', 'activo'],
    sources: [SOURCES_2026.rentaGastosRuc],
  },
  {
    id: 'RUC-003',
    domain: 'ruc',
    status: 'active',
    severity: 'high',
    summary: 'Estado NO HABIDO debe bloquear aprobación automática y escalar a revisión manual.',
    effectiveFrom: '2026-01-01',
    tags: ['no-habido', 'manual-review'],
    sources: [SOURCES_2026.rucNoHallado, SOURCES_2026.rentaGastosRuc],
  },
  {
    id: 'RUC-004',
    domain: 'ruc',
    status: 'active',
    severity: 'high',
    summary: 'Estado NO HALLADO debe marcarse como alerta crítica para validación documental adicional.',
    effectiveFrom: '2026-01-01',
    tags: ['no-hallado', 'alerta-critica'],
    sources: [SOURCES_2026.rucNoHallado],
  },
  {
    id: 'RUC-005',
    domain: 'ruc',
    status: 'active',
    severity: 'medium',
    summary: 'Cambios recientes de estado RUC en ventana de 30 días incrementan score de riesgo.',
    effectiveFrom: '2026-01-01',
    tags: ['riesgo', 'temporalidad'],
    sources: [SOURCES_2026.rucNoHallado],
  },
  {
    id: 'RUC-006',
    domain: 'ruc',
    status: 'active',
    severity: 'high',
    summary: 'RUC emisor en CPE debe coincidir con emisor registrado en payload y PDF.',
    effectiveFrom: '2026-01-01',
    tags: ['consistencia', 'cpe'],
    sources: [SOURCES_2026.cpeNotaDebito],
  },
  {
    id: 'RUC-007',
    domain: 'ruc',
    status: 'active',
    severity: 'medium',
    summary: 'Diferencias entre RUC emisor y RUC receptor en notas referenciadas deben explicitar motivo.',
    effectiveFrom: '2026-01-01',
    tags: ['nota-debito', 'referencia'],
    sources: [SOURCES_2026.cpeNotaDebito],
  },
  {
    id: 'RUC-008',
    domain: 'ruc',
    status: 'active',
    severity: 'medium',
    summary: 'Contribuyentes con estado no válido no pueden pasar a flujo de consenso sin intervención humana.',
    effectiveFrom: '2026-01-01',
    tags: ['consenso', 'human-in-loop'],
    sources: [SOURCES_2026.rentaGastosRuc],
  },
];
