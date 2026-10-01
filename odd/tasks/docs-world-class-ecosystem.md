# Documentación de clase mundial y conectada al ecosistema Drenyra

**Última actualización**: 2026-10-01
**Nivel ODD**: sustancial (toca contratos documentales, `AGENTS.md`, CI de docs y la narrativa del ecosistema).
**Estado ODD**: `Needs your decision` — diagnóstico hecho; **no se implementa nada hasta que se resuelvan las decisiones de la sección 8**.

## 1. Objetivo

Que la documentación de `drenyra-command-center` sea (a) **verdadera** (cada afirmación coincide con el repo), (b) **navegable en minutos** por humanos y por agentes, y (c) **la puerta de entrada coherente al ecosistema**: `drenyra-ai`, `drenyra-shell` (antes `drenyra-pi`), `drenyra-engram`, `drenyra-skills` y `drenyra-guardian-angel`, bajo la filosofía de gentle-ai (poca carga cognitiva, enseñar con calidez, divulgación progresiva, ceremonia proporcional).

## 2. Diagnóstico medido (2026-10-01)

| # | Hallazgo | Evidencia |
|---|----------|-----------|
| D1 | **214 enlaces internos rotos** en el repo; el verificador solo mira 15 archivos «núcleo», por eso CI no lo ve. | `bun run docs:check-links --full` |
| D2 | `llms.txt` apunta a **~25 rutas que no existen** (`/docs/01-architecture/…`, `/docs/concepts/…`, `packages/drenyra-harness`, `apps/drenyra-cli`, `docs/meta/context/stack.yaml`). Los agentes reciben un índice roto. | recorrido de rutas de `llms.txt` |
| D3 | **40 de 94** documentos de `docs/` sin fecha de última actualización, pese a que `AGENTS.md` la exige. | `grep` de «Última actualización» |
| D4 | `docs/00-INDEX.md` tiene tabla mal formada (celdas truncadas a media frase, bloque con sangría) y no lista todo `docs/`. | lectura directa |
| D5 | **Idioma mixto**: 71 documentos con tildes/ñ (español) y 23 sin ellas. El estándar del ecosistema pide inglés para lo público. | `grep` por caracteres |
| D6 | **Contradicción de visibilidad**: `AGENTS.md` dice «privado, no hacer público»; el estándar del ecosistema y GitHub dicen que **los repos son públicos** (command-center incluido). | `AGENTS.md` vs `drenyra-ai/docs/documentation-standard.md` §3 vs `list_repos` |
| D7 | **Nombre desactualizado**: `drenyra-pi` es hoy `drenyra-shell` (mismo repo y commit `71a0097`, paquete `drenyra-shell` v0.1.0). Quedan menciones a `drenyra-pi` en `README.md`, `AGENTS.md`, `docs/14-design/product-topology.md`, `apps/cli`, `packages/pi`. El propio estándar del ecosistema aún dice «drenyra-pi». | `grep` en los 4 repos |
| D8 | **Versión de integración desfasada**: `packages/mission-protocol` y `packages/drenyra-orchestrator` consumen `vendored/drenyra-ai-0.2.0.tgz`; `drenyra-ai` está en **v0.5.0** con los seis contratos congelados. Ninguna doc explica cómo migrar. | `package.json` vs `drenyra-ai/README.md` |
| D9 | Hay referencias a `docs/meta/gentleman-philosophy.md` y `docs/meta/documentation-standards-2026.md` que **no existen** (`CONTRIBUTING.md`, `AGENTS.md`). | verificador de enlaces |
| D10 | Falta el «kit de repo» del estándar del ecosistema: `AI_POLICY.md`, `docs/intended-usage.md`, `docs/CODEBASE-GUIDE.md`, bloque «Position in the ecosystem» homogéneo. | checklist §2 del estándar |

## 3. Referencias de clase mundial y qué adoptamos

| Referencia | Qué tomamos | Dónde se aplica |
|------------|-------------|-----------------|
| [Diátaxis](https://diataxis.fr/) (Django, Canonical, Cloudflare, Gatsby) | Cuatro cuadrantes separados: tutorial, how-to, referencia, explicación. | Unidad U2 |
| Stripe / Vercel ([resumen](https://www.mintlify.com/library/developer-documentation-best-practices)) | Organizar por **lo que quieres lograr**, no por módulo; «primer éxito» en minutos; divulgación progresiva. | U3, U4 |
| [llms.txt de líderes del sector](https://www.mintlify.com/blog/real-llms-txt-examples) (Anthropic, Vercel, Stripe, Cloudflare) | Índice Markdown curado y verificable para agentes. | U5 |
| Docs-as-code ([2026](https://unmarkdown.com/blog/docs-as-code-2026)) | Docs en el mismo PR que el código; lint, links y ejemplos verificados en CI. | U1, U7 |
| [gentle-ai docs](https://github.com/Gentleman-Programming/gentle-ai/tree/main/docs) | Kit estándar: `quickstart`, `usage`, `intended-usage`, `CODEBASE-GUIDE`, `architecture`, guías por componente. | U3 |
| Estándar del ecosistema (`drenyra-ai/docs/documentation-standard.md`) | Positioning-first, hechos sobre aspiración, bloque de ecosistema, diagramas Archify. | U3, U4, U6 |
| Keep a Changelog | `CHANGELOG.md` con `[Unreleased]`. | U3 |

**Principio rector (Gentleman):** menos carga cognitiva (responder primero, tablas, `<details>`), enseñar el *por qué*, mencionar primero el riesgo fiscal y de seguridad, y revisar con empatía.

## 4. Mapa del ecosistema que la documentación debe explicar

Dirección de dependencia (del estándar): los satélites **consumen** los contratos publicados de `drenyra-ai`, nunca al revés.

| Repo | Rol | Estado declarado | Punto de integración en este repo |
|------|-----|------------------|-----------------------------------|
| `drenyra-ai` | Runtime y CLI verificables; contratos congelados (`mission-protocol`, `candidate`, `receipt`, `gate`, `ledger`…); recibos firmados Ed25519 | Alpha v0.5.0 | `packages/mission-protocol`, `mission-domain`, `mission-client`, `drenyra-orchestrator`, `contracts/receipt-schema` |
| `drenyra-shell` (ex `drenyra-pi`) | Harness para operar Drenyra AI desde Pi (skills, prompts FSD, contratos RED, fiscal-guard) | Pre-release v0.1.0 | `packages/pi` (extracción hecha), `apps/cli/src/commands/pi.ts` |
| `drenyra-engram` | Memoria institucional con alcance RUC/período; **informa, nunca autoriza** (Apache-2.0) | Alpha v0.2.x | `services/engram` (Go + SQLite), `packages/memory`, `docs/10-development/engram-guide.md` |
| `drenyra-skills` | Capa de contenido: conocimiento contable/tributario versionado (jurisdicción PE) | En desarrollo | `.agent/skills/` (consumo) |
| `drenyra-guardian-angel` | Verificación adversarial independiente (`.gga`) | En desarrollo | `.gga`, `scripts/ai/review.sh` |
| `drenyra-command-center` | Verdad transaccional (PostgreSQL con aislamiento por tenant), API Elysia, web React | En desarrollo | — |

Modelo de autoridad a documentar tal cual: **base de datos contable = verdad transaccional; Engram = contexto; recibos + ledger de `drenyra-ai` = prueba de ejecución.** Convenciones fiscales: dinero en centavos, alcance RUC/período obligatorio, todo acto material produce recibo.

> Cada fila debe llevar «verificado el AAAA-MM-DD contra repo@commit». Lo no verificado se marca como *planeado*, no como actual.

## 5. Alcance (unidades de trabajo, un PR cada una, ≤400 líneas salvo mecánicas)

- [ ] **U0 — Reconciliar la verdad** (bloquea al resto): decidir visibilidad (D6), nombre `drenyra-shell` (D7), versiones (D8); actualizar `AGENTS.md` y crear los `docs/meta/*` que se enlazan (D9).
- [ ] **U1 — Salud de enlaces y guardarraíles:** corregir los 214 enlaces; `docs:check-links` pasa a escanear **todo** `docs/` por defecto; nuevo chequeo de fecha de actualización y de front-matter; todo en `docs:verify` y en CI.
- [ ] **U2 — Arquitectura de información (Diátaxis):** `docs/` por intención (Tutoriales / How-to / Referencia / Explicación) manteniendo redirecciones; front-matter (`type`, `audience`, `status`, `updated`); `00-INDEX.md` **generado**, no escrito a mano (arregla D4).
- [ ] **U3 — Puerta de entrada:** `README` positioning-first con *Quick Start* de «cero a primer recibo»; `intended-usage.md`, `CODEBASE-GUIDE.md`, `AI_POLICY.md`, `CHANGELOG.md`; bloque «Position in the ecosystem» idéntico en todos los repos.
- [ ] **U4 — Integración con el ecosistema:** mapa del ecosistema; guía de consumo de contratos; **guía de actualización `drenyra-ai` 0.2 → 0.5**; setup de Engram y de Shell; página «¿está bien conectado?» (comprobaciones concretas).
- [ ] **U5 — Legible por agentes:** `llms.txt` (+ `llms-full.txt`) **generados** desde el índice y validados; `AGENTS.md` y `MAP.md` alineados.
- [ ] **U6 — Diagramas Archify** del ecosistema, flujo de recibo y modelo de autoridad, con la convención de vista en línea del estándar.
- [ ] **U7 — Automatización de calidad:** markdownlint, vocabulario/estilo, ejemplos de código ejecutados en CI, métrica de frescura, lente `review-readability` en PR de docs.
- [ ] **U8 — Política de idioma y glosario** fiscal es-PE ↔ inglés (según decisión D-idioma).

## 6. Métricas de éxito (verificables)

| Métrica | Hoy | Meta |
|---------|-----|------|
| Enlaces internos rotos (`--full`) | 214 | 0, y CI falla si vuelve a subir |
| Documentos con fecha y front-matter | 54/94 con fecha | 100 % |
| Rutas válidas en `llms.txt` | ~25 rotas | 100 % válidas, generado |
| Tiempo a primer recibo desde clon limpio | no medido | ≤ 15 min, medido en CI o guion |
| Menciones obsoletas (`drenyra-pi`, versiones) | varias | 0 salvo nota de renombre |
| Repos del ecosistema con bloque de posición idéntico | 0/6 | 6/6 |

## 7. Fuera de alcance

- Cambiar código de producción (renombrar `packages/pi` o `apps/cli/src/commands/pi.ts` es una tarea ODD aparte; aquí solo se documenta el nombre vigente).
- Editar los otros repos: cada cambio allí será una tarea ODD propia en ese repo (se proponen en U0/U3, no se aplican desde aquí).
- Borrar documentación histórica (`openspec/`, ADRs): se marca como histórica, no se elimina.
- No se inventa comportamiento: si algo no está implementado se etiqueta *Planned*.

## 8. Decisiones que necesito de ti (`Needs your decision`)

1. **Idioma:** ¿inglés para lo público (README, índice, guías, ecosistema) y español para contenido fiscal local con glosario bilingüe (recomendado, coherente con el estándar), o todo en español?
2. **Visibilidad (D6):** `AGENTS.md` dice «privado»; los repos son públicos. ¿La verdad actual es *público con intención open-core*? Corrijo `AGENTS.md` solo con tu confirmación.
3. **Orden:** ¿arrancamos por U0 → U1 (recomendado: sin esto lo demás se pudre de nuevo) o prefieres empezar por U3 (README) por impacto visible?
4. **Otros repos:** ¿autorizas abrir tareas/PR de documentación en `drenyra-ai` (corregir `drenyra-pi` → `drenyra-shell` en su estándar) y en los demás? Esta sesión solo tiene acceso de lectura a ellos.

## 9. Verificación por unidad

Cada PR: `bun run docs:verify` verde, `bun run docs:check-links --full` sin regresiones, nota de «qué toco y qué no», y evidencia de que cada afirmación sobre el ecosistema se verificó contra el repo hermano (URL + commit).

## Constraints

- Ningún secreto, credencial ni dato de cliente en ejemplos; dinero siempre en centavos; ejemplos con alcance RUC/período.
- Docs en el mismo PR que el código que describen (docs-as-code).
- Documentación fiscal/SUNAT: revisión de riesgo alto antes de publicar cambios de sustancia.
