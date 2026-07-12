# ADR-008: Property-Based Testing para Invariantes Fiscales

**Estado:** Propuesto
**Fecha:** 2026-07-11
**Decisores:** el Gentleman

## Contexto

Las reglas fiscales (IGV, detracciones, RUC checksum, operaciones Money) tienen invariantes que deben cumplirse para TODAS las entradas posibles. Los tests example-based cubren casos específicos pero no garantizan invariantes universales.

## Opciones Consideradas

1. **Property-based testing (fast-check)** — invariantes + generación automática de casos
2. **Example-based testing solo** — lo que ya existe, cubre escenarios conocidos
3. **Fuzzing** — más agresivo, pero menos integrado con el stack de tests

## Decisión

Property-based testing con fast-check para invariantes fiscales.

**Razones:**

- Los bugs encontrados por PBT en sistemas financieros son los que cuestan plata real (41 bugs en 4 años según NordVarg 2024)
- Las invariantes fiscales son ideales para PBT: conmutatividad, conservación, bounds
- fast-check se integra con Vitest (mismo runner existente)
- Los seeds de falla se guardan como regression tests

## Consecuencias

**Positivas:**

- Cobertura de invariantes > 90% en dominio fiscal
- Bugs de borde detectados antes de producción
- Regression tests automáticos desde seeds

**Negativas:**

- Tests 10-100x más lentos que unit tests (solo en CI)
- Curva de aprendizaje para el equipo
- Falsos positivos si los arbitraries no son representativos

## Impacto Fiscal

Alto — previene errores de cálculo fiscal que costarían plata real.

## Supersedes

N/A — es una adición, no un reemplazo.
