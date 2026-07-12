# X6: Supply Chain Security & SBOM

**Estado:** proposal
**Creado:** 2026-07-11
**Depende de:** B4 (Security & Deployment — proposal), P4 (CI/CD — proposal)
**PRs estimados:** 2
**Líneas estimadas:** ~350

---

## Problema

La seguridad actual cubre CSP, helmet, tenant scope y rate limiting (B3/B4), pero **no hay protección de la cadena de suministro**:

1. No se verifican vulnerabilidades en dependencias automáticamente
2. No hay SBOM (Software Bill of Materials) generado
3. Las dependencias pueden tener cambios maliciosos sin que nadie lo note
4. No hay `lockfile` congelado en CI para Go/Python
5. No hay política de actualización de dependencias

Para un producto que maneja datos fiscales de empresas peruanas, un ataque a la cadena de suministro es un riesgo **CRÍTICO**: un paquete comprometido podría exfiltrar RUCs, montos, o peor, alterar cálculos fiscales.

## Solución Propuesta

### PR1: Dependency Vulnerability Scanning

Integrar scanners automáticos:

```bash
# TypeScript (Bun)
bun run audit  # bun audit (built-in)
bun x -- trivy fs . --scanners vuln   # Trivy para análisis profundo

# Go
cd apps/cli && go vulncheck ./...

# Python
cd apps/data-engine && uv run pip-audit
```

**En CI:**

- Escaneo de vulnerabilidades en cada PR (solo dependencias nuevas/modificadas)
- Escaneo completo semanal (programado)
- Umbral: 0 vulnerabilidades CRITICAL, 0 HIGH en producción
- Dependencias con CVSS > 7.0 bloquean el merge

### PR2: SBOM Generation + Lockfile Policy

```yaml
# .github/workflows/sbom.yml
jobs:
  sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          # Generar SBOM en formato SPDX
          docker run -v $(pwd):/app anchore/syft /app -o spdx-json > sbom.spdx.json
      - run: |
          # Subir a GitHub Dependency Graph
          gh api -X POST /repos/${{ github.repository }}/dependency-graph/snapshots \
            -H "Accept: application/vnd.github+json" \
            -f snapshot=$(cat sbom.spdx.json)
```

**Política de lockfiles:**

- `bun.lock` (Bun) — debe estar en VCS, no regenerar en CI (frozen lockfile)
- `uv.lock` (Python) — debe estar en VCS
- `go.sum` (Go) — debe estar en VCS
- CI falla si lockfile no está actualizado contra `pyproject.toml`/`package.json`

**Dependabot config:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    open-pull-requests-limit: 5
  - package-ecosystem: 'gomod'
    directory: '/apps/cli'
    schedule:
      interval: 'weekly'
  - package-ecosystem: 'pip'
    directory: '/apps/data-engine'
    schedule:
      interval: 'weekly'
```

## Criterios de Aceptación

- [ ] `bun run audit` corre en CI por cada PR — 0 criticals
- [ ] SBOM en formato SPDX generado semanalmente
- [ ] Dependabot configurado para npm, Go y Python
- [ ] Lockfile frozen policy implementada y verificada en CI
- [ ] Reporte de vulnerabilidades accesible

## Riesgos

- **Bajo**: Dependabot puede generar PRs ruidosos al inicio
- **Medio**: Algunas dependencias pueden no tener fix para CVSS high
- **Bajo**: Trivy en CI agrega ~1 minuto

## Review Workload Forecast

| PR                          | Líneas | Review time | Reviewer |
| --------------------------- | ------ | ----------- | -------- |
| PR1: Vulnerability scanning | ~200   | 15 min      | Security |
| PR2: SBOM + lockfile policy | ~150   | 10 min      | DevOps   |
