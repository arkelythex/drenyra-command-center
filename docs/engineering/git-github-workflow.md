# Drenyra — Git & GitHub Workflow

**Última actualización:** 2026-07-13

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

Archivo `.github/CODEOWNERS` con:

- `apps/api/src/shared/plugins/tenant-auth.ts` — @drenyra/security
- `apps/api/src/features/sire/` — @drenyra/fiscal
- `apps/api/src/features/electronic-invoicing/` — @drenyra/fiscal
- `packages/persistence/` — @drenyra/persistence
- `**/migrations/` — @drenyra/persistence
- `.github/` — @drenyra/platform

---

## Gates Obligatorios (CI)

- [x] Typecheck
- [x] Lint y formato
- [x] Unit tests
- [x] Integration tests contra PostgreSQL real
- [x] Tests negativos cross-tenant
- [x] Migration/schema checks
- [x] Dependency y secret scanning
- [x] Architecture/domain-boundary checks
- [x] Build reproducible
- [x] Branch actualizada con `main`

No usar `skip ci`, desactivar tests, convertir fallos en `it.skip` ni bajar thresholds.

---

## Merge

### Procedimiento

1. Preferir **squash merge** por PR (un cambio lógico por entrega).
2. No mergear PRs rojos, draft o con comentarios pendientes.
3. Después de cada merge:
   - Verificar `origin/main`
   - Confirmar CI post-merge
   - Rebasar el siguiente PR
   - Volver a ejecutar sus gates
   - Eliminar la rama ya integrada
4. Cada PR debe poder revertirse sin revertir toda la Wave.

### Protección de `main`

Configurar en GitHub:

- [x] Pull request obligatorio
- [x] Required status checks
- [x] Required approving review
- [x] CODEOWNERS
- [x] Conversación resuelta antes del merge
- [x] Prohibición de force push y eliminación
- [x] Prohibición de bypass administrativo rutinario
- [x] Historial lineal
- [x] Protección aplicable también a administradores

---

## Referencias

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Drenyra Engineering Rules](../AGENTS.md)
```
