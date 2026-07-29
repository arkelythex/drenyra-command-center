# 13 — Operations

**Última actualización:** 2026-07-27
**Propósito:** Runbooks, sincronización entre repos, deploy, monitoreo
**Audiencia:** DevOps, SRE, infraestructura

---

## Documentos existentes

| Documento                                         | Descripción                            |
| ------------------------------------------------- | -------------------------------------- |
| [Drenyra Repo Sync](./drenyra-repo-sync.md)       | Sincronización entre worktrees y repos |
| [Platform Connection](./platform-connection.md)   | Conexión cross-repo                    |

## Documentos planificados

Los siguientes documentos están identificados pero aún no han sido creados:

- `deploy-pipeline.md` — CI/CD, environments, rollbacks
- `monitoring-alerting.md` — Dashboards, alertas, SLOs
- `backup-recovery.md` — Estrategia de backup, RPO/RTO
- `disaster-recovery.md` — DR plan, failover, regions
- `capacity-planning.md` — Scaling, tenant growth
- `runbook-index.md` — Todos los runbooks operacionales

---

## Runbooks requeridos

| Área        | Runbook                     | Prioridad |
| ----------- | --------------------------- | --------- |
| Infra       | DB failover                 | Alta      |
| Infra       | NATS cluster recovery       | Alta      |
| Infra       | Temporal namespace recovery | Alta      |
| Security    | Credential rotation         | Alta      |
| Security    | Incident containment        | Alta      |
| Data        | Data integrity verification | Media     |
| Data        | Backup restoration test     | Media     |
| Network     | Connectivity failure        | Media     |
| Application | Workflow stuck resolution   | Alta      |
| Application | SUNAT connector failure     | Alta      |
| Application | Banking connector failure   | Alta      |

---

## Documentos migrados

| Anterior                                   | Nueva ubicación            |
| ------------------------------------------ | -------------------------- |
| `docs/05-development/drenyra-repo-sync.md` | `./drenyra-repo-sync.md`   |
| `docs/cross-repo/platform-connection.md`   | `./platform-connection.md` |
