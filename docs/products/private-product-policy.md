# Política de Producto Privado — Drenyra

> **Última actualización:** 2026-08-19.
>
> Regla fiscal: los valores monetarios en el ecosistema Drenyra son BigInt centavos; nunca floats.

## Declaración

Drenyra es un **producto comercial con fuente pública** bajo la intención de transición open-core: un sistema operativo financiero verificable para empresas, contadores y gobiernos de LATAM. El código fuente de los repos del ecosistema es **público** (decisión del propietario); los artefactos que genera (binarios, imágenes, SBOMs) se distribuyen **solo bajo contrato y NDA** — nunca como descargas públicas por defecto.

La política original (2026-08-03) fijó el ecosistema como privado: *"Drenyra su objetivo es ser privada y ganar dinero."* En 2026-08 la visibilidad cambió a **fuente pública (open-core transition intention)**, manteniendo el modelo comercial en los artefactos y servicios. Los agentes, docs y CIs deben respetar esta versión como restricción de seguridad de producto.

## Visibilidad de los repos

| Repo                          | Visibilidad | Rol                                        |
| ----------------------------- | ----------- | ------------------------------------------ |
| `arkelythex/drenyra-command-center`          | **public**  | Producto (Accounting Command Center)       |
| `arkelythex/drenyra-engram`   | **public**  | Memoria institucional (Apache-2.0)         |
| `arkelythex/drenyra-ai`       | **public**  | Núcleo verificable (contratos congelados)  |
| `arkelythex/drenyra-pi`       | **public**  | Harness Pi (pineado)                       |
| `arkelythex/drenyra-skills`   | **public**  | Conocimiento versionado (contenido)        |
| `arkelythex/drenyra-guardian-angel` | **public** | Verificación adversarial independiente    |

Reglas:

- No revertir un repo de fuente a **private** sin decisión explícita del propietario.
- El acceso de colaboradores y la apertura de issues/PRs externos se mantienen bajo control del propietario.
- No publicar artefactos (imágenes, paquetes, releases, docs compiladas) en registries públicos por defecto — la distribución de artefactos es contractual.

## Distribución de artefactos

- **Imágenes container** → GHCR privado (`ghcr.io/arkelythex/drenyra-engram:<tag>`). Pull requiere autenticación (`read:packages` PAT o `GITHUB_TOKEN` con `packages: read` en CI).
- **Binarios Go + SBOMs + checksums** → GitHub Releases privados (goreleaser, `release.yml`). Nunca cambiar la visibilidad del release a público.
- **Paquetes npm/TS** → registry privado de la org (cuando aplique). Nunca npm público.

## Superficie pública de confianza (lo que SÍ se publica)

Privado no significa opaco. Drenyra vende *verificabilidad*; la confianza se demuestra con superficie pública deliberada que NO compromete el moat:

| Artefacto                                      | Público    | Por qué                                                                 |
| ---------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| Docs de reglas fiscales (SUNAT, IGV, retenciones, detracciones) | Sí (en planes) | Prueba de dominio fiscal, sin exponer implementación               |
| Contract specs de API (schemas, endpoints)     | Sí (en planes) | Clientes e integradores diseñan contra la superficie pública        |
| SBOM por release                               | No (privado, evidencia bajo NDA) | Respuesta de supply chain para procurement                     |
| Checksums de binarios                          | No (privado) | Verificación de integridad para clientes bajo contrato                |
| Código fuente del motor                      | Sí (open-core) | Fuente pública; el valor comercial está en artefactos y servicios      |

## Escrow y auditoría para clientes gobierno

Ventas a gobiernos e instituciones financieras pueden exigir **acceso al código fuente** (anti vendor lock-in, FAR/DFARS en USA; prácticas similares en LATAM). Política:

1. **No entregar el código bajo ninguna circunstancia como descarga abierta.**
2. **Escrow bajo contrato**: si un contrato lo exige, entregar el fuente a un **agente de escrow independiente** (tercera parte neutral) con condiciones: acceso solo ante quiebra/abandono del proveedor o incumplimiento grave verificado; NDA obligatorio; sin derecho a uso comercial por el cliente.
3. **Auditoría de código**: si el cliente exige auditar, preferir (a) auditoría de tercera parte autorizada con NDA, (b) auditoría sobre binarios + SBOM + conformance tests, sobre el fuente cuando no quede alternativa — siempre con NDA y en entorno controlado.
4. **Evidencia sin código**: SBOMs, checksums, conformance vectors, docs de reglas fiscales y test suites de contrato son la primera línea de evidencia — la mayoría de los procesos de procurement se satisfacen con eso sin abrir el fuente.
5. **Solicitud de escrow**: toda solicitud se escala al propietario. Ningún agente la acepta ni la negocia solo.

## Modelo de monetización y decisiones futuras

- **Pendiente (decisión del propietario):** SaaS multi-tenant vs licencias/on-prem. El modelo determina la intensidad de escrow (SaaS → escrow casi innecesario; on-prem/gobierno → escrow probable).
- **SLSA attestations**: habilitar cuando la org pase a plan de pago de GitHub (hoy free plan no soporta attestations en repos privados). Los SBOMs cubren la evidencia mientras tanto.
- **GitHub Actions en repos privados**: consume minutos facturables del plan (los públicos eran ilimitados). Costo actual trivial; revisar si el CI crece.

## Referencias

- [Filosofía de producto](drenyra-product-philosophy.md)
- [Posicionamiento](drenyra-positioning.md)
- AGENTS.md → sección "Private commercial product"
- drenyra-engram: `RELEASING.md` (proceso de release + auditoría), `.github/workflows/release.yml`, `.github/workflows/docker.yml`
