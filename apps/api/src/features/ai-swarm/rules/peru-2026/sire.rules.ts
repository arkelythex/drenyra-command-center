import type { PeruRule2026 } from './types';
import { SOURCES_2026 } from './sources';

/**
 * SIRE_RULES_2026 const.
 *
 * @example
 * ```ts
 * console.log(SIRE_RULES_2026);
 * ```
 */
export const SIRE_RULES_2026: PeruRule2026[] = [
  {
    id: 'SIRE-001',
    domain: 'sire',
    status: 'active',
    severity: 'high',
    summary: 'SIRE opera con periodicidad mensual para RVIE y RCE.',
    effectiveFrom: '2026-01-01',
    tags: ['rvie', 'rce', 'periodicidad'],
    sources: [SOURCES_2026.sirePortal],
  },
  {
    id: 'SIRE-002',
    domain: 'sire',
    status: 'active',
    severity: 'high',
    summary: 'Los PRICOS no exceptuados con ingresos >= 2,300 UIT inician SIRE obligatorio en periodo junio 2026.',
    effectiveFrom: '2026-06-01',
    tags: ['prico', '2300-uit', 'obligatoriedad'],
    sources: [SOURCES_2026.sireRs3922025],
  },
  {
    id: 'SIRE-003',
    domain: 'sire',
    status: 'active',
    severity: 'high',
    summary: 'La clasificación PRICO aplicable se valida al 31 de enero de 2026 para determinar obligación.',
    effectiveFrom: '2026-01-31',
    tags: ['prico', 'clasificacion'],
    sources: [SOURCES_2026.sireRs3922025],
  },
  {
    id: 'SIRE-004',
    domain: 'sire',
    status: 'active',
    severity: 'medium',
    summary: 'La propuesta RVIE/RCE debe aceptarse, reemplazarse o complementarse antes del cierre mensual.',
    effectiveFrom: '2026-01-01',
    tags: ['propuesta', 'cierre', 'control-mensual'],
    sources: [SOURCES_2026.sirePortal],
  },
  {
    id: 'SIRE-005',
    domain: 'sire',
    status: 'active',
    severity: 'high',
    summary: 'Toda inconsistencia entre CPE y registro mensual debe generar alerta preventiva de cierre.',
    effectiveFrom: '2026-01-01',
    tags: ['inconsistencia', 'cpe', 'alerta'],
    sources: [SOURCES_2026.sirePortal],
  },
  {
    id: 'SIRE-006',
    domain: 'sire',
    status: 'active',
    severity: 'medium',
    summary: 'El motor debe conservar trazabilidad de cambios sobre la propuesta para auditoría.',
    effectiveFrom: '2026-01-01',
    tags: ['auditoria', 'trazabilidad'],
    sources: [SOURCES_2026.sirePortal],
  },
  {
    id: 'SIRE-007',
    domain: 'sire',
    status: 'active',
    severity: 'medium',
    summary: 'Toda factura aceptada debe mapearse a periodo tributario único para evitar duplicidad de registro.',
    effectiveFrom: '2026-01-01',
    tags: ['periodo', 'duplicidad'],
    sources: [SOURCES_2026.sirePortal],
  },
  {
    id: 'SIRE-008',
    domain: 'sire',
    status: 'active',
    severity: 'high',
    summary: 'Al aproximarse junio 2026, contribuyentes cercanos al umbral 2,300 UIT deben marcarse como riesgo de transición.',
    effectiveFrom: '2026-02-01',
    tags: ['transicion', 'umbral', 'riesgo'],
    sources: [SOURCES_2026.sireRs3922025],
  },
  {
    id: 'SIRE-009',
    domain: 'sire',
    status: 'active',
    severity: 'medium',
    summary:
      'RSNATI 000005-2026 amplía la facultad discrecional para infracciones de RVIE/RCE en el periodo de adaptación 2026.',
    effectiveFrom: '2026-01-01',
    tags: ['discrecionalidad', 'adaptacion', 'sanciones'],
    sources: [SOURCES_2026.sireRsnati0000052026],
  },
];
