# X5: Performance Benchmarking & Regression Detection in CI

**Estado:** proposal
**Creado:** 2026-07-11
**Depende de:** P2 (Performance — proposal), P4 (CI/CD — proposal)
**PRs estimados:** 2
**Líneas estimadas:** ~500

---

## Problema

Hoy no hay **métricas objetivas de rendimiento** en el pipeline:

1. No sabemos si un PR degrada performance porque no hay benchmarks automáticos
2. No hay baseline contra el cual comparar
3. Los problemas de rendimiento se detectan en producción (o no se detectan)
4. No hay umbrales claros (budgets de bundle, tiempo de respuesta, queries N+1)

## Solución Propuesta

### PR1: Benchmark Harness + Baseline

Crear un sistema de benchmarks automáticos que corran en CI:

```
benchmarks/
  api/
    igv-calculation.bench.ts    ← Timepo de cálculo de IGV
    ruc-validation.bench.ts     ← Timepo de validación SUNAT
    db-query.bench.ts           ← Timepo de queries típicas
  web/
    first-paint.bench.ts        ← TTFB, FCP (via Playwright)
    bundle-size.bench.ts        ← Tamaño de chunks críticos
    route-load.bench.ts         ← Timepo de carga lazy de rutas
  domain/
    money-operations.bench.ts   ← 10k sumas/restas/multiplicaciones
    fiscal-rules.bench.ts       ← 1000 validaciones fiscales
```

```typescript
// benchmarks/api/igv-calculation.bench.ts
import { bench, run } from 'mitata'

const base = Money.fromAmount(15000.5, 'PEN')
const transactions = Array.from({ length: 1000 }, () =>
  Money.fromAmount(Math.random() * 100000, 'PEN')
)

bench('IGV single calculation', () => {
  calculateIGV(base)
})

bench('IGV batch 1000 transactions', () => {
  transactions.forEach((t) => calculateIGV(t))
})

await run()
```

**Baseline**: correr benchmarks en `main` y almacenar resultados como JSON.
**Regresión**: un PR que degrada >10% en cualquier benchmark → warning en CI.

### PR2: Lighthouse CI + Bundle Budget

Para la web:

- Lighthouse CI en cada PR (solo categorías Performance + Best Practices)
- Bundle budget: main JS < 300KB gzip, vendor chunks < 200KB
- Métricas objetivo: FCP < 1.5s, LCP < 2.5s, TBT < 200ms
- Query performance: detectar N+1 en CI (via logging analysis)

```yaml
# lighthouserc.yml
ci:
  collect:
    url: ['http://localhost:5174/']
    numberOfRuns: 3
  assert:
    assertions:
      'categories:performance': ['warn', { minScore: 0.8 }]
      'categories:best-practices': ['error', { minScore: 0.9 }]
      'offscreen-images': 'off'
```

## Criterios de Aceptación

- [ ] 5+ benchmarks implementados (API + web + domain)
- [ ] Baseline almacenado y accesible en CI
- [ ] Lighthouse CI corriendo en cada PR con umbrales
- [ ] Bundle budget definido y verificado en CI
- [ ] Regresión de >10% genera warning automático
- [ ] Dashboard con históricos de benchmarks

## Riesgos

- **Medio**: Benchmarks pueden ser ruidosos en CI (variabilidad de CPU)
- **Bajo**: Lighthouse CI agrega ~2 minutos a cada PR
- **Medio**: Bundle budget puede ser muy agresivo inicialmente

## Review Workload Forecast

| PR                       | Líneas | Review time | Reviewer          |
| ------------------------ | ------ | ----------- | ----------------- |
| PR1: Benchmark harness   | ~300   | 25 min      | Backend + DevOps  |
| PR2: Lighthouse + budget | ~200   | 15 min      | Frontend + DevOps |
