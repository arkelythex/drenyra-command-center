# Drenyra — Git & GitHub Workflow

**Última actualización:** 2026-10-26

---

## Principios

```text
No merge without evidence.
No tenant authority from client input.
No migration without rollback.
No security fix without a regression test.
No force push to main.
```

Esta política es exigible mediante branch protection, CODEOWNERS, PR template y CI gates.

---

## Estrategia de Ramas

### Reglas

- Una rama por PR. No acumular fases completas en una sola rama.
- Las ramas dependientes parten del último commit del PR padre.
- Después de mergear el padre, **rebasar** la rama hija sobre `origin/main`.

### Nomenclatura

| Tipo         | Prefijo     | Ejemplo                               |
| ------------ | ----------- | ------------------------------------- |
| Security fix | `security/` | `security/w3a-2-sire-tenant-boundary` |
| Feature      | `feat/`     | `feat/new-dashboard`                  |
| Bug fix      | `fix/`      | `fix/tenant-scope-leak`               |
| Refactor     | `refactor/` | `refactor/domain-boundaries`          |
| Docs         | `docs/`     | `docs/adr-010-evidence-lineage`       |
| CI/CD        | `ci/`       | `ci/tenant-isolation-gate`            |
| Chore        | `chore/`    | `chore/dep-upgrade-drizzle`           |

### Restricciones

- `main` está protegido: PR obligatorio, required checks, CODEOWNERS, sin force push.
- `--force-with-lease` permitido solo en ramas propias no compartidas y después de avisar.
- Nunca force push sobre `main`. Excepción: recuperación de incidente aprobada y documentada.
- Eliminar ramas después de mergear.

---

## Commits

### Formato

Conventional Commits estrictos:

```
tipo(alcance): descripción imperativa en inglés

- Detalle opcional del cambio
- Razón técnica cuando no sea obvia
```

| Tipo       | Uso                                                             |
| ---------- | --------------------------------------------------------------- |
| `test`     | Tests, caracterización RED, fixtures                            |
| `fix`      | Corrección de bug                                               |
| `feat`     | Feature nueva                                                   |
| `refactor` | Refactor sin cambio funcional                                   |
| `docs`     | Documentación                                                   |
| `ci`       | CI/CD                                                           |
| `chore`    | Mantenimiento, dependencias                                     |
| `security` | Fix de seguridad (uso reservado para CVEs o hallazgos críticos) |

### Reglas

- Commits pequeños, atómicos y revisables.
- Cada commit debe compilar. Excepción: el commit explícito de caracterización RED.
- Salvo el commit RED, mantener gates verdes.
- No mezclar refactors, formato o dependencias sin relación.
- No usar mensajes como `fix`, `changes`, `WIP` o `final`.
- No incluir secretos, tokens, credenciales, dumps ni datos reales en commits, fixtures o logs.
- Firmar commits si el repositorio tiene verificación configurada.

---

## Pull Requests

### Template

Cada PR debe incluir esta estructura:

````markdown
## Problema

[Descripción del problema de seguridad/frontera afectada]

## Alcance

### Incluye

- [item 1]
- [item 2]

### Excluye explícitamente

- [item 1]
- [item 2]

## Flujo

### Anterior

```text
[diagrama del flujo anterior]
```
````

### Posterior

```text
[diagrama del flujo posterior]
```

## Tests

| Test                   | Estado |
| ---------------------- | ------ |
| [RED] Caracterización  | ✅     |
| [GREEN] Fix            | ✅     |
| Integración PostgreSQL | ✅     |

### Comandos de verificación

```bash
# Comandos ejecutados y resultados
```

## Schema / Migration

- [ ] Cambios de esquema
- [ ] Rollback: [descripción]

## Riesgos de compatibilidad

- [ ] Riesgo identificado: [descripción]

## Dependencias

- Bloqueado por: PR #
- Bloquea a: PR #

## Security Checklist

- [ ] No se confía en headers/body/query del cliente para autoridad tenant
- [ ] organizationId/companyId derivados de sesión + membership verificada
- [ ] Repositorio scope-first: reads/writes/deletes con company_id en WHERE
- [ ] Respuesta cross-tenant indistinguible de "no existe"
- [ ] Tests negativos cross-tenant contra PostgreSQL real
- [ ] Sin mocks ni bypasses permanentes introducidos
- [ ] No se incluyen secretos, tokens ni datos reales

```

### Restricciones

- PRs de ~400–500 líneas lógicas máximo. Si excede, justificar por qué no puede dividirse.
- No publicar PoC explotable, IDs reales ni detalles de credenciales en PR público. Usar Security Advisory privado.
- El autor no aprueba su propio PR.
- Resolver todas las conversaciones antes del merge.

---

## CODEOWNERS

`.github/CODEOWNERS` es un mapa de **responsabilidad arquitectónica**, no de equipos.
Hoy el repositorio es de mantenedor único: todas las rutas resuelven a `@dreamcoder08`,
con un fallback global `* @dreamcoder08`.

Las secciones existen para documentar fronteras de revisión (fiscal/SUNAT, web,
persistencia, AI, compliance, docs, CI) y para que, cuando exista un segundo
mantenedor, sólo haya que cambiar el handle sin reescribir el mapa.

> No hay equipos de organización (`@drenyra/*`) creados todavía. No los referencies
> en CODEOWNERS: GitHub rechaza el archivo si el equipo no existe.

---

## Gates Obligatorios (CI)

Lo que **realmente corre** hoy, y dónde:

| Gate | Workflow | PR | Push a `main` |
| ---- | -------- | -- | ------------- |
| Typecheck API | `ci.yml` | ✅ | ✅ |
| Typecheck web | `ci.yml` | ✅ | ✅ |
| Typecheck + test dominio | `ci.yml` | ✅ | ✅ |
| Lint data-engine (Python) | `ci.yml` | ✅ | ✅ |
| Documentación (lint + JSDoc delta) | `documentation-quality.yml` | ✅ | ✅ |
| Review IA | `ai-review.yml` | ✅ | ✅ |
| Lint (biome) | `quality-gates.yml` | ✅ sólo archivos tocados | ✅ árbol completo |
| Frontera fiscal | `quality-gates.yml` | ✅ | ✅ |
| Coverage thresholds | `quality-gates.yml` | ✅ | ✅ |
| Security audit (dependencias) | `quality-gates.yml` | ❌ sólo post-merge | ✅ |

Pendiente de existir (no marcar como cumplido hasta implementarlo):

- [ ] Integration tests contra PostgreSQL real en PR (hoy sólo en `ci.yml` con `services:`)
- [ ] Tests negativos cross-tenant automatizados en PR
- [ ] Migration/schema checks
- [ ] Secret scanning en CI (hoy sólo GitHub secret scanning, sin gitleaks/trufflehog)
- [ ] Build reproducible

### Regla de deuda heredada (ratchet)

Un gate nuevo que hoy falla por deuda histórica **no se puede exigir sin un baseline explícito**.
El patrón del repositorio es `.github/fiscal-gate-baseline.txt`:

- Cada entrada es `ruta :: línea` (contenido, no número de línea) para sobrevivir a los shifts.
- Las entradas **sólo se eliminan**. Nunca se agrega una entrada para código nuevo.
- Nunca se hace baseline de un archivo creado o modificado en el mismo PR.
- Al arreglar la violación, se borra la línea del baseline.

No usar `skip ci`, desactivar tests, convertir fallos en `it.skip` ni bajar thresholds.

---

## Merge

### Procedimiento

1. **Squash** por defecto. **Rebase** cuando cada commit del PR es atómico y vale la pena
   preservarlo. Ambos producen historial lineal; `merge commit` está prohibido por protección.
2. No mergear PRs rojos, draft o con comentarios pendientes.
3. Después de cada merge:
   - Verificar `origin/main`
   - Confirmar CI post-merge
   - Rebasar el siguiente PR
   - Volver a ejecutar sus gates
   - Eliminar la rama ya integrada (`delete_branch_on_merge` está activo)
4. Cada PR debe poder revertirse sin revertir toda la Wave.

### Protección de `main`

Estado real configurado en GitHub (verificable con
`gh api repos/arkelythex/drenyra-console/branches/main/protection`):

- [x] Pull request obligatorio (0 aprobaciones requeridas — ver nota)
- [x] Required status checks con `strict` (rama actualizada)
- [x] Conversación resuelta antes del merge
- [x] Prohibición de force push y de borrado
- [x] Historial lineal
- [x] `enforce_admins` activo: los administradores no saltean las reglas
- [x] `delete_branch_on_merge` activo
- [x] Secret scanning + push protection
- [ ] Required approving review — **pendiente**
- [ ] CODEOWNERS como required review — **pendiente**

Checks requeridos hoy:

```text
Node — api typecheck
Node — web typecheck
Python — data-engine lint
Domain — typecheck + test
Documentation Linting
Lint Check
Fiscal Boundary Check
review
```

> **Nota sobre aprobaciones:** con un solo mantenedor, exigir 1 aprobación bloquea el
> repositorio entero, porque GitHub no permite auto-aprobarse. Se deja en 0 hasta que
> exista un segundo mantenedor. En ese momento: subir a 1 y agregar CODEOWNERS como
> required review.

---

## Referencias

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Drenyra Engineering Rules](../../AGENTS.md)
```
