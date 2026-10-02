# Accepted dependency advisories

**Última actualización**: 2026-10-02
**Audiencia**: quien mantiene el gate `bun run security:audit` (CI: `Security Audit`).

El gate bloquea severidad **alta o crítica**. Un aviso solo se acepta aquí si (1) no existe versión corregida, (2) se demuestra que la ruta vulnerable no es alcanzable y (3) tiene condición de salida. Cada aceptación se refleja en `package.json` (`security:audit --ignore=…`).

## GHSA-86w9-cpqp-85rv — `node-forge` (alta)

| Campo | Valor |
|-------|-------|
| Aviso | RSA PKCS#1 v1.5: la **verificación de firmas** acepta elementos `DigestAlgorithm` anidados extra |
| Versiones afectadas | `<= 1.4.0` (la 1.4.0 es la última publicada: **no hay parche**) |
| Quién lo usa | `apps/api` — `features/sunat/signature/certificate.handler.ts` (lectura de PFX/PEM de certificados SUNAT); el resto son tests que generan certificados |
| Alcanzable | **No**: el código de producción solo parsea (`pkcs12FromAsn1`, `certificateFromPem`, `*ToPem`); no llama a `verify` de firmas RSA con `node-forge` |
| Aceptado | 2026-10-02 |
| Condición de salida | Se publique una versión corregida de `node-forge`, o se migre el parseo de PFX a `node:crypto`. Revisar en cada actualización de dependencias |
| Riesgo si cambia el uso | Cualquier verificación de firma RSA con `node-forge` **invalida** esta aceptación; retirar el `--ignore` y migrar antes de añadirla |

## Avisos bajos (no bloquean)

`@ai-sdk/provider-utils` (consumo no controlado de recursos): alias interno `@ai-sdk/provider-utils-v7` dentro de `ai`; no se puede subir con `overrides`. Se resolverá al actualizar `ai`.
