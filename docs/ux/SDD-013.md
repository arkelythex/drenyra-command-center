# SDD-013 — Fiscal Artifact Identity and Versioning

**Estado:** PROPOSED  
**Depende de:** SDD-010, SDD-011  
**Informa:** evidencia, diff, approval, reversión y auditoría

## Decisión

Todo objeto fiscal material tendrá identidad estable y versiones inmutables. La identidad responde “qué objeto es”; la versión responde “qué estado exacto fue revisado o aplicado”.

## Contrato conceptual

```ts
type ArtifactRef = {
  artifactType: string
  artifactId: string
  version: number
  companyId: string
  fiscalPeriodId: string | null
  contentHash: string
}
```

Tipos iniciales: source document, CPE, journal entry, reconciliation, tax determination, filing package, close package, evidence bundle y proposal.

## Reglas

1. IDs son opacos y no conceden scope.
2. Una versión publicada no se edita en sitio.
3. Cambios crean versión nueva con parent y motivo.
4. Approval referencia versión y hash exactos.
5. Archivos conservan hash criptográfico y metadata de origen.
6. Deduplicación documental no colapsa revisiones legales distintas.
7. Soft delete no elimina evidencia requerida; aplica estado y política de retención.

## Concurrencia

Updates usan optimistic concurrency. Un cliente stale recibe conflicto con metadata segura y debe comparar o recargar. Las mutaciones idempotentes pueden devolver la versión ya creada cuando payload y scope coinciden.

## UX

El usuario ve “versión actual”, “revisada”, “aprobada” y “aplicada” cuando difieren. La UI evita términos técnicos de hash salvo en auditoría. Abrir un enlace histórico nunca reemplaza silenciosamente por latest.

## Criterios de aceptación

- Artefactos materiales tienen ID estable, versión y hash.
- Approval stale se detecta mediante versión/hash.
- Historial puede reconstruir parentage.
- Tests cubren edición concurrente, duplicate import y cross-period.
- Export de auditoría identifica exactamente las versiones incluidas.
