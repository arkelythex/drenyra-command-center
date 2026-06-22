---
last-verified: 2026-06-20
source-of-truth: packages/shared/package.json
auto-generated: false
---

# @arkelythex/shared — Shared Utilities

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

**Versión**: 1.0.0 | **Dependencias**: @arkelythex/domain, clsx

---

## De un vistazo

El paquete **shared** provee utilidades transversales, helpers y lógica de validación usada por múltiples capas del monorepo Arkelythex. Evita duplicar patrones comunes entre paquetes.

Pensalo como la "caja de herramientas compartida" — cosas que necesitás en varios lados pero que no pertenecen al dominio ni a la infraestructura.

---

## 📦 Estructura

```text
packages/shared/src/
├── errors.ts              # Clases de error compartidas
├── utils.ts               # Funciones utilitarias generales
├── env.ts                 # Helpers de variables de entorno
├── action-helpers.ts      # Helpers de Action result / Either monad
├── feature-flags.ts       # Sistema de feature flags
├── secure-logger.ts       # Logging PII-safe (redacta datos sensibles)
├── security-utils.ts      # Funciones de seguridad
├── validation/            # Schemas y helpers de validación
│   └── ruc.ts             # Validación de RUC
├── security/              # Módulos de seguridad
│   ├── index.ts           # Helpers de seguridad
│   └── sanitizers/        # Sanitizadores de input
└── index.ts               # API pública
```

### Subpath Exports

| Ruta de Exportación | Descripción |
|---------------------|-------------|
| `@arkelythex/shared` | Barrel export principal |
| `@arkelythex/shared/errors` | Clases de error compartidas |
| `@arkelythex/shared/env` | Helpers de entorno |
| `@arkelythex/shared/utils` | Utilidades generales |
| `@arkelythex/shared/action-helpers` | Helpers Either/Result |
| `@arkelythex/shared/feature-flags` | Feature flags |
| `@arkelythex/shared/secure-logger` | Logging PII-safe |
| `@arkelythex/shared/security-utils` | Utilidades de seguridad |
| `@arkelythex/shared/validation` | Helpers de validación |
| `@arkelythex/shared/validation/ruc` | Validación de RUC |
| `@arkelythex/shared/security` | Módulos de seguridad |
| `@arkelythex/shared/security/sanitizers` | Sanitizadores de input |

---

## 🚀 Scripts

```bash
cd packages/shared
bun run typecheck    # TypeScript type check
bun run test         # Ejecutar tests (Vitest)
```

---

## 🔗 Dependencias

- **Runtime**: `@arkelythex/domain`, `clsx`
- **Dev**: TypeScript ^6.0.3, Vitest ^4.1.7

---

## 🔐 Seguridad

| Módulo | ¿Qué hace? |
|--------|------------|
| `secure-logger.ts` | Redacta RUC, DNI, cuentas bancarias, emails antes de loguear |
| `sanitizers/` | Eliminan vectores XSS de input de usuario |
| `security-utils.ts` | Comparación segura y utilidades de tokens |
