# H3: Multi-country Fiscal Abstraction — Escalar LATAM

## Propuesta

Arquitectura de plugins fiscales por país. Colombia (DIAN), Chile (SII), México (SAT), Argentina (AFIP). Cada país es un plugin que implementa `FiscalCountry` interface. El pipeline de compliance y el orchestrator son agnósticos del país.

## Scope

4 PRs por país (16 PRs total), ~800 líneas por país.

## Estrategia

No construir todo de una vez. Lanzar Colombia primero (Q4 2026), Chile después, México y Argentina en Q1 2027. Cada país es su propio SDD plan.

## PRs por país

Cada país sigue la misma estructura:

1. **Domain types**: FiscalCountry interface + tipos específicos del país (RUT/IVA/CFDI/etc.)
2. **Compliance chain**: Etapas de compliance específicas del país
3. **API routes**: Endpoints para el país
4. **Dashboard**: Componentes React para el país

## FiscalCountry Interface

```
FiscalCountry {
  id: string                          // "CO" | "CL" | "MX" | "AR"
  name: string                        // "Colombia" | "Chile" | ...
  currency: string                    // "COP" | "CLP" | "MXN" | "ARS"
  taxIdRegex: RegExp                  // RUT (CO/CL), RFC (MX), CUIT (AR)
  taxTypes: TaxType[]                 // IVA, Renta, etc.
  complianceChains: ComplianceChain[] // Chains específicas del país
  validators: FiscalValidator[]       // Validaciones determinísticas
}
```

## Dependencias

- H0: Orchestrator agnóstico del país
- H2: SUNAT Platform como template para otros países

## Riesgos

- Cada país tiene regulaciones diferentes → código específico inevitable
- Mantener 4+ países en paralelo es caro
- Partner local recomendado para cada país
