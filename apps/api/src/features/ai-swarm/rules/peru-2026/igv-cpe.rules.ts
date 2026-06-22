import type { PeruRule2026 } from './types';
import { SOURCES_2026 } from './sources';

/**
 * IGV_CPE_RULES_2026 const.
 *
 * @example
 * ```ts
 * console.log(IGV_CPE_RULES_2026);
 * ```
 */
export const IGV_CPE_RULES_2026: PeruRule2026[] = [
  {
    id: 'IGV-001',
    domain: 'igv',
    status: 'active',
    severity: 'high',
    summary: 'IGV estándar se valida en 18% sobre base imponible gravada.',
    effectiveFrom: '2026-01-01',
    tags: ['igv', 'calculo'],
    sources: [SOURCES_2026.sirePortal],
  },
  {
    id: 'IGV-002',
    domain: 'igv',
    status: 'active',
    severity: 'high',
    summary: 'Total debe cumplir subtotal + IGV con tolerancia operativa <= S/ 0.02.',
    effectiveFrom: '2026-01-01',
    tags: ['consistencia', 'monto'],
    sources: [SOURCES_2026.sirePortal],
  },
  {
    id: 'CPE-001',
    domain: 'cpe',
    status: 'active',
    severity: 'high',
    summary: 'No se puede modificar factura con boleta ni boleta con factura vía nota de débito.',
    effectiveFrom: '2026-01-01',
    tags: ['cpe', 'nota-debito', 'tipo-comprobante'],
    sources: [SOURCES_2026.cpeNotaDebito],
  },
  {
    id: 'CPE-002',
    domain: 'cpe',
    status: 'active',
    severity: 'high',
    summary: 'Nota de débito electrónica requiere documento original de referencia válido.',
    effectiveFrom: '2026-01-01',
    tags: ['cpe', 'referencia'],
    sources: [SOURCES_2026.cpeNotaDebito],
  },
  {
    id: 'CPE-003',
    domain: 'cpe',
    status: 'active',
    severity: 'high',
    summary: 'Receptor no puede estar en estado NO HABIDO / NO HALLADO para emisión válida.',
    effectiveFrom: '2026-01-01',
    tags: ['cpe', 'receptor', 'ruc'],
    sources: [SOURCES_2026.cpeNotaDebito, SOURCES_2026.rucNoHallado],
  },
  {
    id: 'CPE-004',
    domain: 'cpe',
    status: 'active',
    severity: 'medium',
    summary: 'Serie y numeración deben respetar formato SUNAT y continuidad documental.',
    effectiveFrom: '2026-01-01',
    tags: ['serie', 'numeracion'],
    sources: [SOURCES_2026.cpeNotaDebito],
  },
  {
    id: 'CPE-005',
    domain: 'cpe',
    status: 'active',
    severity: 'medium',
    summary: 'Si la moneda difiere de PEN debe existir tipo de cambio explícito y consistente.',
    effectiveFrom: '2026-01-01',
    tags: ['moneda', 'tipo-cambio'],
    sources: [SOURCES_2026.sirePortal],
  },
  {
    id: 'CPE-006',
    domain: 'cpe',
    status: 'active',
    severity: 'medium',
    summary: 'Inconsistencias entre XML/PDF/registro contable deben gatillar evidencia para auditoría.',
    effectiveFrom: '2026-01-01',
    tags: ['xml', 'pdf', 'auditoria'],
    sources: [SOURCES_2026.sirePortal],
  },
];
