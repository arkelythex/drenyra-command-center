# SDD-010 — Verified Fiscal Context Propagation

**Estado:** PROPOSED  
**Depende de:** SDD-000, SDD-001, Tenant Isolation/H02  
**Informa:** toda ruta tenant-owned

## Decisión

Toda operación fiscal se ejecutará con un `FiscalContext` verificado compuesto por `organizationId`, `companyId`, `fiscalPeriodId`, `membershipId`, `actorId` y capacidades efectivas. Identificadores recibidos en header, query, body, URL o estado frontend expresan intención de selección; nunca conceden autoridad.

## Contrato

```ts
type FiscalContext = {
  organizationId: string
  companyId: string
  fiscalPeriodId: string | null
  membershipId: string
  actorId: string
  roleBindings: string[]
  policyVersion: string
}
```

El middleware resuelve identidad y membresía, valida que la empresa pertenezca a la organización autorizada y, cuando corresponda, valida el periodo. Los application services reciben `FiscalContext`; los repositories tenant-owned reciben scope explícito y nunca consultan solo por ID de entidad.

## Reglas

1. Deny-by-default para rutas tenant-owned.
2. `organizationId` y `companyId` no se derivan de credenciales SUNAT, payload o selección visual.
3. El periodo debe pertenecer a la empresa efectiva.
4. Los jobs persisten una referencia al contexto, pero revalidan autoridad cuando una acción humana posterior lo requiera.
5. Deep links resuelven el contexto después de autenticación.
6. Search filtra por scope antes de devolver metadata.
7. Logs no exponen credenciales ni payload fiscal sensible.

## UX

La context bar presenta empresa, RUC, periodo y estado. Un cambio de contexto limpia selecciones incompatibles, invalida drafts no transferibles y solicita confirmación si existe trabajo sin guardar. Un error de autorización no revela si un ID extranjero existe.

## Casos adversariales

- `companyId` extranjero con membresía válida en otra empresa;
- misma organización, compañía distinta;
- periodo de otra empresa;
- membresía revocada entre load y apply;
- job iniciado antes de revocación;
- ID inexistente y extranjero indistinguibles;
- cache o reciente apuntando a scope perdido.

## Criterios de aceptación

- 100% de rutas tenant-owned rechaza contexto no verificado.
- Repositories scope-first cubren reads, updates y deletes.
- Tests PostgreSQL reales prueban aislamiento cross-company/cross-organization.
- Frontend no utiliza estado local como prueba de autoridad.
- SIRE nunca resuelve credenciales desde un `companyId` no autorizado.
