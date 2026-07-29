# 12 — Security

**Última actualización:** 2026-07-27
**Propósito:** Seguridad, threat models, secret management, incident response
**Audiencia:** Equipo de seguridad, infraestructura, desarrolladores

---

## Filosofía

Drenyra maneja datos financieros sensibles, credenciales SUNAT y transacciones fiscales. La seguridad no es una capa separada — es parte del diseño de cada plano FEOS.

### Principios

1. **Defense in depth** — identidad → sesión → org → company → capability → resource → period → risk
2. **Row-Level Security** como defensa adicional, no principal
3. **Authorization en capa de aplicación** (no confiar solo en DB)
4. **Step-up authentication** para operaciones R3
5. **Credenciales nunca en código** — siempre en Vault/KMS
6. **Logs append-only** — audit trail inmutable
7. **Tool authorization** — matrix de capabilities por agente

---

## Documentos

| Documento                                       | Descripción                                 |
| ----------------------------------------------- | ------------------------------------------- |
| [Security Baseline](./security-baseline.md)     | Postura de seguridad, principios, checklist |
| [Threat Model](./threat-model.md)               | Amenazas por plano FEOS                     |
| [Secret Management](./secret-management.md)     | Vault, KMS, credenciales SUNAT              |
| [Incident Response](./incident-response.md)     | Runbook de respuesta a incidentes           |
| [Monitoring Strategy](./monitoring-strategy.md) | Detección, alertas, monitoreo               |
| [NIST CSF Baseline](./nist-csf-baseline.md)     | Alineación con NIST Cybersecurity Framework |

### Threat models por área

| Área                        | Prioridad | Estado |
| --------------------------- | --------- | ------ |
| Autenticación multi-tenancy | Alta      | ◌      |
| SUNAT credentials           | Alta      | ◌      |
| Banking connectors          | Alta      | ◌      |
| Agent execution             | Alta      | ◌      |
| Document evidence           | Media     | ◌      |
| Marketplace / plugins       | Media     | ◌      |
| Payment execution           | Alta      | ◌      |
| Country packs               | Media     | ◌      |

---

## Relación con otros planos

| Plano                                                   | Relación                       |
| ------------------------------------------------------- | ------------------------------ |
| [03 — Workspace](../03-workspace-plane/README.md)       | Tenant isolation               |
| [04 — Intelligence](../04-intelligence-plane/README.md) | Agent tool authorization       |
| [05 — Trust](../05-trust-plane/README.md)               | Evidence y receipts inmutables |
| [07 — Financial](../07-financial-plane/README.md)       | Datos financieros sensibles    |

---

## Documentos migrados

| Anterior                                        | Nueva ubicación               |
| ----------------------------------------------- | ----------------------------- |
| `docs/05-security/README.md`                    | `./README.md`                 |
| `docs/05-security/secret-management.md`         | `./secret-management.md`      |
| `docs/05-security/threat-model.md`              | `./threat-model.md`           |
| `docs/05-security/incident-response-runbook.md` | `./incident-response.md`      |
| `docs/05-security/monitoring-strategy.md`       | `./monitoring-strategy.md`    |
| `docs/05-security/nist-csf-baseline.md`         | `./nist-csf-baseline.md`      |
| `docs/architecture/security-baseline-f0.md`     | `./security-baseline.md`      |
| `docs/architecture/tenant-guard.md`             | Integrado en tenant isolation |
| `docs/architecture/tenant-access-matrix.md`     | Integrado en multi-tenancy    |
