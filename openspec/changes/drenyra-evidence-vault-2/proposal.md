# SDD Proposal: Evidence Vault 2.0 — Full Evidence Lineage

**Última actualización:** 2026-07-02
**Estado:** Propuesta
**Plan SDD:** 6 de 6
**Paralelo:** Plan 1 (necesita sidebar + routing)
**Refina:** Evidence Vault existente (feature/evidence + branches)

---

## Executive Summary

Transformar el Evidence Vault existente en un sistema de **linaje probatorio completo**. Cada asiento contable, cada cambio propuesto, cada diff debe tener su **cadena de evidencia** rastreable: qué documento lo originó, quién lo procesó, qué regla fiscal aplicó, y cómo se validó contra SUNAT.

Drenyra debe poder responder: **"¿Por qué existe este asiento? Muéstrame la evidencia."**

---

## Problem

El Evidence Vault actual existe como un feature independiente (apps/web/src/features/evidence/), pero no está integrado con el flujo de trabajo. La evidencia se guarda pero no hay trazabilidad entre un asiento y sus documentos soporte. Para una app fiscal auditada, cada asiento debe tener su linaje probatorio completo. Sin esto, Drenyra no puede ser usado en procesos contables reales donde SUNAT o una auditoría exijan sustento.

---

## Solution

### Linaje probatorio

Cada asiento contable debe tener:

```txt
Asiento #3492 — Débito 60 Compras S/ 1,000
                                                          ⬆
┌─ Evidencia ──────────────────────────────────────────┐
│                                                        │
│  Documentos:                                           │
│  ├─ F001-2841.xml     XML    Email     Válido         │
│  ├─ R-2841.cdr        CDR    SUNAT     Válido         │
│  └─ Factura.pdf       PDF    Upload    Verificado     │
│                                                        │
│  Procesamiento:                                        │
│  ├─ Extraído por: OCR Agent                           │
│  ├─ Validado por: SIRE Skill                          │
│  ├─ Cotejado con: SUNAT (RUC+serie+numero+monto)     │
│  └─ Asiento generado por: Close Agent                 │
│                                                        │
│  Reglas aplicadas:                                     │
│  ├─ NIC 2 — Inventarios                               │
│  ├─ IGV — Crédito fiscal (Art. 18° LIGV)             │
│  └─ SUNAT — SIRE validación cruzada                   │
│                                                        │
│  [Ver XML] [Ver CDR] [Ver PDF] [Abrir en thread]     │
└────────────────────────────────────────────────────────┘
```

### Pantalla: Evidence Vault

```txt
Evidence Vault — Andrés Capital SAC · Jun 2026

╔═══════════════════════════════════════════════════════════╗
║ Search documents...    [XML] [CDR] [PDF] [Banco] [Todos] ║
╠═══════════════════════════════════════════════════════════╣
║ Documento        Tipo  Fuente   Estado     Usado en     ║
║─────────────────────────────────────────────────────────║
║ F001-2841.xml    XML   Email    Válido    Asiento #3492 ║
║ R-2841.cdr       CDR   SUNAT    Válido    IGV Jun 2026  ║
║ BCP-Jun.xlsx     XLSX  Upload   Revisado  Conciliación  ║
║ Contrato.pdf     PDF   Drive    Pendiente Provisión     ║
║ SUNAT-2841.xml   XML   SUNAT    Válido    SIRE Diff #12 ║
╚═══════════════════════════════════════════════════════════╝

[ Upload Document ] [ Link to Entry ] [ Batch Validate ]
```

### Pantalla: Document Detail

```txt
F001-2841.xml
────────────────────────────────────────────
Tipo: Comprobante Electrónico (Factura)
Emisor: Proveedores ABC SAC · RUC: 20123456789
Monto: S/ 1,180.00
IGV: S/ 180.00

Validaciones:
✅ Firma digital válida
✅ RUC activo y habido
✅ Serie/numero existente en SUNAT
✅ Monto coincide con CDR
✅ No duplicado

Documentos relacionados:
┌─ CDR: R-2841.cdr (Descarga automática SUNAT)
└─ PDF: Factura.pdf (Upload por contador)

Linaje:
Thread #2840 → SIRE Agent → Validación cruzada → Asiento #3492

[Ver XML] [Ver CDR] [Descargar] [Desvincular]
```

### Componentes nuevos

1. **EvidenceVaultPage** — Página principal del vault con tabla de documentos.
2. **EvidenceLineagePanel** — Panel de linaje completo de un asiento/documento (componente reutilizable en diff/inspector).
3. **DocumentDetailPanel** — Vista detallada de documento con validaciones y linaje.
4. **EvidenceUploadZone** — Zona de upload drag-and-drop con validación automática.
5. **EvidenceValidator** — Componente que valida XML/CDR contra SUNAT.
6. **BatchValidateButton** — Botón de validación batch de documentos pendientes.
7. **EvidenceLinkDialog** — Diálogo para vincular documento a asiento/thread/diff.
8. **EvidenceSearchBar** — Búsqueda con filtros por tipo, fuente, estado, cliente, periodo.
9. **EvidenceTimeline** — Timeline del documento (quién lo subió, cuándo, qué procesó).

### API endpoints nuevos / a refinar

| Endpoint                                      | Método | Propósito                                                  |
| --------------------------------------------- | ------ | ---------------------------------------------------------- |
| `/api/evidence`                               | GET    | Listar documentos (filtro: cliente, periodo, tipo, estado) |
| `/api/evidence`                               | POST   | Subir documento                                            |
| `/api/evidence/:id`                           | GET    | Detalle con linaje                                         |
| `/api/evidence/:id`                           | DELETE | Eliminar documento (soft delete)                           |
| `/api/evidence/:id/validate`                  | POST   | Validar contra SUNAT                                       |
| `/api/evidence/:id/link`                      | POST   | Vincular a asiento/thread/diff                             |
| `/api/evidence/:id/unlink`                    | POST   | Desvincular                                                |
| `/api/evidence/batch-validate`                | POST   | Validación batch                                           |
| `/api/evidence/lineage/:entityType/:entityId` | GET    | Obtener linaje completo de un asiento/thread               |

### Refinamiento de esquema existente

El Evidence Vault actual tiene estructura en `packages/persistence/` y `packages/domain/`. Se debe:

1. Agregar campos: `source` (email, upload, SUNAT, drive), `lineage` (JSON de trazabilidad), `validations` (array de resultados de validación).
2. Agregar entidad: `EvidenceLink` — tabla polimórfica que vincula evidencia a asientos, threads, diffs.
3. Agregar API de linaje completo que recorre la cadena documental.
4. Integrar con el sistema de diffs (Plan 4) y threads (Plan 2).

### Dominio nuevo / refinado

```
packages/domain/src/
  evidence/
    evidence.ts            → Evidence entity (refinado)
    evidence-id.ts         → EvidenceId (branded)
    evidence-type.ts       → EvidenceType enum (XML, CDR, PDF, XLSX, IMG)
    evidence-source.ts     → EvidenceSource value object
    evidence-validation.ts → EvidenceValidation value object
    evidence-link.ts       → EvidenceLink entity (nuevo — polimórfico)
    evidence-link-type.ts  → EvidenceLinkType enum (journal, thread, diff)
```

---

## Architecture

```tsx
// Evidence Vault
<AgenticLayout>
  <AgenticSidebar />
  <main>
    <EvidenceVaultPage>
      <EvidenceSearchBar />
      <EvidenceTable />
      <UploadZone />                          {/* Drag-drop area */}
    </EvidenceVaultPage>
  </main>
  <RightInspector>                            {/* Document detail cuando se selecciona */}
    <DocumentDetailPanel />
    <EvidenceLineagePanel />
  </RightInspector>
</AgenticLayout>

// Lineage Panel (reutilizable en otros planes)
<EvidenceLineagePanel entityType="journal" entityId={3492}>
  {/* Tree/mermaid de linaje */}
</EvidenceLineagePanel>
```

---

## Integración con otros planes

| Plan             | Integración                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Plan 2 (Threads) | Los threads pueden tener evidencia vinculada; el lineage panel se muestra en thread detail |
| Plan 4 (Diff)    | Cada diff muestra evidencia asociada; el lineage panel se muestra en el inspector          |
| Plan 3 (Agents)  | Los agentes reportan evidencia recolectada; se muestra en AgentCard                        |
| Plan 5 (Skills)  | Skills pueden subir/validar evidencia automáticamente                                      |

---

## Delivery

**Estrategia:** auto-chain — 4 PRs

| PR  | Scope                                                                        | Archivos | Líneas |
| --- | ---------------------------------------------------------------------------- | -------- | ------ |
| PR1 | Domain refinements + nuevos schemas (EvidenceLink, validations)              | 8-10     | ~350   |
| PR2 | Evidence API (CRUD + validate + link + lineage + batch)                      | 10-12    | ~400   |
| PR3 | EvidenceVaultPage + DocumentDetailPanel + EvidenceTable + UploadZone         | 10-12    | ~400   |
| PR4 | EvidenceLineagePanel + integración con threads/diffs/agents + batch validate | 8-10     | ~350   |

**Riesgos:**

- Validación contra SUNAT requiere conectividad con API SUNAT — manejar offline.
- El linaje polimórfico (journal, thread, diff) puede ser complejo en la DB — considerar tabla de asociaciones.
- Documentos duplicados: implementar deduplicación por hash SHA256 del contenido.

---

## Non-goals

- No se implementa la integración con SUNAT en vivo (ya existe en packages/infrastructure)
- No se implementa OCR de documentos (puede ser skill futuro)
- No se implementa la UI de skills ni automations (Plan 5)
- No se implementa el diff contable (Plan 4) — solo se referencia
