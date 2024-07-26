# 04 — Intelligence Plane

**Última actualización:** 2026-07-27
**FEOS Plano:** 3 de 8 — Inteligencia
**Propósito:** convertir modelos y automatizaciones en especialistas financieros gobernados por contratos.

---

## Qué es

El Intelligence Plane es el runtime que organiza agentes, skills, modelos, memoria y herramientas para asistir operaciones financieras. Usa Pi como base de runtime: sesiones, streaming, proveedores y herramientas; Drenyra añade roles de dominio, límites de capacidad, routing por riesgo y proyección profesional de eventos.

Drenyra no construye un “superagente contador”. Construye una **organización digital de especialistas**. El Conductor interpreta un objetivo de workspace y compone trabajo; especialistas de ingestión, clasificación, ledger, conciliación, impuestos, tesorería, cierre, reporting, riesgo y auditoría producen resultados delimitados. Un agente no obtiene autoridad porque sea capaz de proponer una respuesta.

## Qué no es

No es la fuente de verdad financiera ni el motor de aprobación. Los modelos pueden extraer, clasificar, explicar y proponer; el [Financial Plane](../07-financial-plane/README.md) valida el dominio, el [Trust Plane](../05-trust-plane/README.md) controla la autoridad y [Execution](../06-execution-plane/README.md) realiza el trabajo durable. La IA nunca llama un sistema externo con texto libre.

## Agentes, skills y routing

Cada agente declara rol, input permitido, tools, límites de contexto, output esperado, presupuesto y políticas de escalamiento. Las **skills** son procedimientos fiscales ejecutables y versionados —por ejemplo, `reconcile-bank`, `classify-cpe` o `review-sire`— con contratos, permisos y pruebas. Una skill puede evolucionar; una ejecución siempre referencia la versión que utilizó.

El model routing selecciona proveedor y capacidad según tarea, riesgo, costo y contrato requerido. Un modelo económico puede resumir una excepción R0; una clasificación que alimenta un asiento requiere R2 y un modelo con structured output verificable; una operación R3 exige controles adicionales y posiblemente revisión independiente. La detección de capacidades ocurre antes de asignar trabajo: soporte de tool calling restringido, JSON Schema, streaming, contexto, proveedor disponible y política de datos. Si el modelo no satisface el contrato, se enruta a otro o se degrada a una ruta humana; no se relaja el contrato.

## Contratos de herramientas R0–R3

| Nivel | Contrato |
| --- | --- |
| R0 | salida flexible para ayuda no material |
| R1 | estructura preferida, revisión por excepción |
| R2 | JSON Schema obligatorio y validación determinista |
| R3 | schema estricto, validación determinista, autoridad reforzada y control dual cuando aplique |

Una tool R2 para proponer clasificación recibe IDs, importe, moneda y evidencia; devuelve un schema validado, no una instrucción narrativa. Las tools R3 exigen además candidate y approval token emitidos por Trust. El runtime aplica deny-by-default a herramientas no declaradas.

## Memoria y eventos

La memoria se separa por propósito: normativa (reglas vigentes), organizacional (políticas y aprobadores), operacional (incidencias) y episódica (intentos y resultados). El aislamiento por tenant, compañía, período y retención es obligatorio. La memoria ayuda a recuperar contexto, pero nunca reemplaza evidencia versionada ni autoriza una acción.

Pi transmite eventos en streaming; Drenyra los proyecta a objetos profesionales correlacionados con workspace y workflow: `tool_started` se vuelve actividad, `tool_progress` progreso, una anomalía un Finding y una propuesta un Proposed Entry. La UI no debe exponer una cascada de tokens como si fuese una auditoría. [Experience](../02-experience-plane/README.md) muestra la proyección y [Trust](../05-trust-plane/README.md) conserva el lineage relevante.

## Ejemplo operativo

Al cargar una factura, Ingestion normaliza el archivo y Document Intelligence extrae campos. Classification propone cuenta, impuesto y confianza bajo R2. Si el monto supera materialidad, el agente crea un Change Set en [Workspace](../03-workspace-plane/README.md), no un asiento final. Ledger valida invariantes; Trust congela el candidato y solicita aprobación. El Conductor puede explicar el progreso, pero no salta ninguna puerta.

## Relación con los demás planos

- [Workspace](../03-workspace-plane/README.md) entrega scope, estado y objetivos a los especialistas.
- [Trust](../05-trust-plane/README.md) gobierna candidate, aprobación, policy y receipts.
- [Execution](../06-execution-plane/README.md) da retries, señales, recuperación y correlación durable.
- [Integration](../08-integration-plane/README.md) expone conectores sólo mediante tools tipadas.
- [Country](../09-country-plane/README.md) aporta reglas y vocabulario que los agentes deben tratar como contexto versionado.

La inteligencia útil en Drenyra es capacidad acotada, observable y verificable; no autonomía ilimitada.
