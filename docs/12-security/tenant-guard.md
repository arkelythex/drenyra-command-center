# CI Guardrail — H02 Tenant Isolation Hardening

Este guardrail impide que aparezcan NUEVOS usos de métodos repository sin scope
durante la migración H02. Solo los callers en la allowlist temporal están permitidos.

## Uso

```bash
# Verificar que no hay nuevos callers sin scope (CI)
bun run security:tenant-guard

# Verificar contra allowlist
bun run security:tenant-guard --strict
```

## Reglas

### 1. Repository `findById(id)` sin scope

Busca llamadas a `repository.findById(` o `.findById(` que no pasen scope.

Patrón peligroso:

```typescript
await repo.findById(someId) // INSEGURO
await this.accountRepository.findById(id) // INSEGURO
```

Patrón seguro:

```typescript
await repo.findById(scope, someId) // SEGURO
await this.accountRepository.findById(orgScope, id) // SEGURO
```

### 2. Repository `delete(id)` sin scope

```typescript
await repo.delete(someId) // INSEGURO
await repo.delete(scope, someId) // SEGURO
```

### 3. Repository `update(id, data)` sin scope

```typescript
await repo.update(someId, data) // INSEGURO (en SireSubmission)
await repo.update(scope, id, data) // SEGURO
```

### 4. Repository `findByHash(hash)` sin scope

```typescript
await repo.findByHash(hash) // INSEGURO
await repo.findByHash(scope, hash) // SEGURO
```

### 5. Repository `findByIdempotencyKey(key)` sin scope

```typescript
await repo.findByIdempotencyKey(key) // INSEGURO
await repo.findByIdempotencyKey(scope, key) // SEGURO
```

## Allowlist temporal

Los siguientes archivos están autorizados a usar métodos legacy DURANTE la migración.
Cualquier archivo FUERA de esta lista que use métodos sin scope debe fallar.

```
packages/application/src/use-cases/account/toggle-account-status.use-case.ts
packages/application/src/use-cases/account/create-account.use-case.ts
packages/application/src/use-cases/account/get-accounts.use-case.ts
packages/application/src/use-cases/account/delete-account.use-case.ts
packages/application/src/use-cases/account/update-account.use-case.ts
packages/application/src/use-cases/journal/delete-journal-entry.use-case.ts
packages/application/src/use-cases/journal/update-journal-entry-status.use-case.ts
packages/application/src/use-cases/journal/update-journal-entry.use-case.ts
packages/application/src/services/detraction.service.ts
packages/application/src/services/cpe-tracking.service.ts
packages/application/src/services/accounting-period.service.ts
packages/application/src/use-cases/transaction/get-transaction.use-case.ts
packages/application/src/use-cases/transaction/delete-transaction.use-case.ts
```

## Implementación en CI

Agregar a `.github/workflows/ci.yml`:

```yaml
- name: Tenant isolation guardrail
  run: |
    # Buscar métodos repository sin scope que NO estén en la allowlist
    # Esta regla se vuelve más estricta con cada wave
    bash scripts/ci/tenant-guard.sh
```

## Script de verificación

Ver `scripts/ci/tenant-guard.sh` para la implementación exacta.
