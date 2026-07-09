# G1: Go CLI Quality & Testing Infrastructure

**Fecha:** 2026-07-09
**Autor:** el Gentleman
**PRs estimados:** 2
**Líneas estimadas:** ~600
**Depende de:** S5 (Go CLI Pattern Alignment, working-draft)
**Tags:** go, cli, testing, quality

---

## Problema

`apps/cli` tiene **254 archivos Go y 0 tests**. Para herramientas fiscales que manejan consultas, aprobaciones, y hooks de SUNAT, la falta de tests es un riesgo operativo.

Además:

- No hay linting configurado (`golangci-lint` v2.12.2, `staticcheck`)
- No hay coverage gates en CI
- No hay patrones de testing documentados
- Bubbletea TUI components no tienen tests
- No hay integración con el harness de calidad del monorepo

## Cambios Propuestos

### PR 1: Testing Foundation (350 líneas)

**Qué:** Configurar infraestructura de testing y escribir tests para componentes críticos.

**Acciones:**

1. **Configuración**:
   - `go.mod` / `go.sum` actualizados
   - `golangci-lint@v2.12.2` config en `apps/cli/.golangci.yml`
   - `Makefile` targets: `test`, `test:cover`, `lint`, `lint:fix`
   - GitHub Actions workflow: `apps/cli/.github/workflows/go-test.yml` (o integrar en workflow existente)

2. **Test patterns**:
   - Tests unitarios con `testing` estándar + `stretchr/testify` para assertions
   - TUI tests con `bubbletea`'s `tea-test` para comandos y modelos
   - Golden files para output de TUI (capturar output esperado)

3. **Tests prioritarios**:

   | Área            | Archivos                   | Prioridad                     |
   | --------------- | -------------------------- | ----------------------------- |
   | Fiscal commands | `internal/fiscal/`         | CRÍTICA — consultas, cálculos |
   | Config loading  | `internal/config/`         | ALTA — RUC, credenciales      |
   | Approval flow   | `internal/approval/`       | ALTA — aprobar/rechazar       |
   | TUI screens     | `internal/tui/`            | MEDIA — layout, navegación    |
   | TUI components  | `internal/tui/components/` | MEDIA — sidebar, status bar   |
   | SUNAT adapters  | `internal/sunat/`          | ALTA — API calls              |

### PR 2: Code Quality Pipeline (250 líneas)

**Qué:** Configurar linting, type safety, y quality gates.

**Acciones:**

1. **golangci-lint**: Configurar linters activos:

   ```yaml
   # apps/cli/.golangci.yml
   linters:
     enable:
       - errcheck
       - govet
       - staticcheck
       - gosimple
       - ineffassign
       - misspell
       - revive
       - prealloc
   ```

2. **Coverage targets**:

   | Package              | Target | Notas                  |
   | -------------------- | ------ | ---------------------- |
   | `internal/fiscal/`   | ≥70%   | Reglas fiscales        |
   | `internal/config/`   | ≥80%   | Config, RUC validation |
   | `internal/approval/` | ≥60%   | Flujos de aprobación   |
   | `internal/tui/`      | ≥40%   | Layout (golden files)  |
   | `internal/sunat/`    | ≥50%   | API adapters           |

3. **Integración CI**:
   - Lint corre en PR a `apps/cli/`
   - Tests corren y verifican cobertura
   - `go vet` y `staticcheck` bloquean si hay issues

## Criterios de Aceptación

1. `go test ./...` pasa con coverage reporting
2. `golangci-lint run` pasa sin issues
3. Coverage targets alcanzados para packages prioritarios
4. TUI tests con golden files para al menos 3 screens principales
5. Tests integrados en CI (corren en PRs que tocan `apps/cli/`)
6. `go vet ./...` y `staticcheck` pasan
