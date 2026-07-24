# Drenyra Services — Go

Infraestructura distribuida e integraciones. Cada servicio es un módulo Go independiente.

## Candidatos actuales

| Servicio             | Propósito                                                         | Prioridad |
| -------------------- | ----------------------------------------------------------------- | --------- |
| `connector-gateway/` | Gateway para SUNAT, bancos, DIAN, SAT, SII, ERP connectors        | Alta      |
| `ingestion/`         | Workers de ingesta de datos de alta concurrencia                  | Media     |
| `enterprise-bridge/` | Agente local instalable en clientes para conectar ERPs on-premise | Baja      |

## Criterio

Mucho networking e I/O → Go. Criptografía o parsing duro → Rust. Lógica de producto → TypeScript.

Ver [Canonical Stack](../docs/architecture/canonical-stack.md).
