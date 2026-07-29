# Incident Response Runbook — Drenyra

**Version:** 1.0.0
**Last Reviewed:** 2026-07-25
**Author:** Drenyra Security Team

---

## Purpose

Este runbook define los procedimientos de respuesta a incidentes de seguridad para la plataforma Drenyra. Cada playbook incluye: detección, contención inmediata, investigación, remediación, notificación y revisión post-incidente.

> **Idioma:** Los playbooks están en español porque el equipo de Drenyra es hispanohablante. Las plantillas de notificación a usuarios también están en español.

---

## Playbook 1: Compromiso de Credenciales

### Detección

- Alerta A4: Cambio de rol/permiso no autorizado
- Alerta A8: Sesión desde nueva ubicación geográfica
- Reporte de usuario: "No reconozco esta actividad en mi cuenta"
- Notificación externa: Have I Been Pwned, GitHub secret scanning

### Contención Inmediata (0–15 min)

1. **Revocar sesiones:** Invalidar todas las sesiones activas del usuario afectado
2. **Congelar cuenta:** Deshabilitar temporalmente la cuenta (`auth_users.locked_until`)
3. **Rotar credenciales:** Si es un API key o secret de sistema, rotar inmediatamente
4. **Verificar RBAC:** Confirmar que el rol del usuario no fue modificado

### Investigación (15 min – 1 hora)

1. **Auditar bitácora de acceso:** Revisar `auth_audit_logs` para el usuario afectado
2. **Identificar alcance:** ¿Qué datos fueron accedidos? ¿Qué endpoints?
3. **Verificar tenant isolation:** Confirmar que no hubo acceso cross-tenant
4. **Trazar origen:** IP, user-agent, timestamp del acceso no autorizado
5. **Verificar otros usuarios:** ¿Hay patrones similares en otras cuentas?

### Remediación (1–2 horas)

1. **Restaurar acceso:** Si el usuario legítimo confirma identidad, restaurar cuenta
2. **Forzar MFA:** Si no tenía MFA habilitado, requerir enrollment
3. **Rotar todas las credenciales del usuario:** Password reset forzado
4. **Notificar a afectados:** Ver plantilla abajo

### Notificación a Usuario Afectado

```
Asunto: Actividad inusual en tu cuenta de Drenyra

Hola {nombre},

Hemos detectado actividad inusual en tu cuenta de Drenyra el {fecha} a las {hora}.
Por precaución, hemos cerrado todas tus sesiones activas y restablecido tu acceso.

Para recuperar tu cuenta:
1. Restablece tu contraseña: {link}
2. Habilita la verificación en dos pasos (MFA)
3. Revisa tu actividad reciente

Si no reconoces esta actividad o tienes preguntas, responde a este correo.

— Equipo de Seguridad de Drenyra
```

### Revisión Post-Incidente (48 horas)

1. Documentar causa raíz
2. Actualizar threat model si se identificó un nuevo vector
3. Evaluar si el playbook fue efectivo (tiempos de respuesta)
4. Implementar mejoras preventivas

---

## Playbook 2: Ataque de Fuerza Bruta / Credential Stuffing

### Detección

- Alerta A1: >10 intentos fallidos en 5 minutos para una cuenta
- Alerta A1 amplificada: Múltiples cuentas con intentos fallidos simultáneos
- Monitoreo de rate limiting: Aumento de respuestas 429 en `/api/auth/login`

### Contención Inmediata (0–15 min)

1. **Verificar bloqueo automático:** El sistema bloquea después de 5 intentos (30 min). Confirmar que está funcionando.
2. **Ajustar rate limits:** Reducir temporalmente el límite AUTH de 10/min a 3/min
3. **Bloquear IPs:** Si el ataque viene de IPs específicas, agregar a blocklist
4. **Monitorear en tiempo real:** Observar logs de login para detectar nuevas IPs

### Investigación (15–30 min)

1. **Identificar cuentas objetivo:** ¿Ataque dirigido o indiscriminado?
2. **Analizar IPs:** ¿Son IPs de Tor, VPN, o datacenter?
3. **Verificar credenciales comprometidas:** ¿Las contraseñas probadas aparecen en breaches conocidos?
4. **Determinar si hubo éxito:** ¿Alguna cuenta fue comprometida? Revisar logins exitosos en la misma ventana.

### Remediación (30 min – 1 hora)

1. Para cuentas con login exitoso durante el ataque:
   - Forzar password reset
   - Revisar actividad post-login
   - Notificar al usuario
2. **Restaurar rate limits:** Una vez que el ataque cede, volver a configuración normal
3. **Remover bloqueos de IP:** Si se usaron bloqueos temporales

### Notificación

Si hubo compromiso confirmado, usar plantilla del Playbook 1.

### Revisión Post-Incidente

1. ¿El rate limiting actual es suficiente?
2. ¿Necesitamos CAPTCHA en el login?
3. ¿Deberíamos implementar detección de credential stuffing (password spray detection)?

---

## Playbook 3: Sospecha de Exfiltración de Datos

### Detección

- Alerta A7: Patrones inusuales de consultas SUNAT (>50/hora por tenant)
- Exportaciones masivas: Bulk exports detectados en logs
- Comportamiento anómalo: Usuario accediendo a datos fuera de su patrón normal
- Denuncia interna o externa

### Contención Inmediata (0–15 min)

1. **Revocar sesiones del usuario/tenant sospechoso**
2. **Congelar cuenta:** Deshabilitar acceso temporalmente
3. **Verificar tenant isolation:** Confirmar que los datos de otros tenants no fueron accedidos
4. **Preservar logs:** Asegurar que los logs del período sospechoso no se pierdan

### Investigación (15 min – 2 horas)

1. **Auditar bitácora de acceso completa:** Cada endpoint accedido, cada query
2. **Determinar alcance de datos:** ¿Qué datos específicos fueron accedidos/descargados?
   - Datos fiscales (asientos contables, declaraciones)
   - Datos de clientes (RUC, información de contacto)
   - Datos de configuración (company settings)
3. **Verificar volumen:** ¿Cuántos registros fueron accedidos?
4. **Trazar destinatario:** ¿A dónde fueron los datos? ¿API externa? ¿Descarga local?
5. **Verificar cumplimiento normativo:** Ley de Protección de Datos Personales (Perú)

### Remediación (1–4 horas)

1. **Notificar a DPO (Data Protection Officer):** Si hay datos personales involucrados
2. **Notificar a afectados:** Si se confirma exfiltración, notificar a usuarios/tenants afectados
3. **Notificar a autoridades:** Si aplica bajo ley peruana (notificación a ANPDP en 48 horas)
4. **Cerrar vector:** Si se identificó una vulnerabilidad, parchear inmediatamente

### Notificación Regulatoria (Perú)

Bajo la Ley de Protección de Datos Personales (Ley N° 29733):

- Notificar a la ANPDP dentro de las 48 horas de detectado el incidente
- Incluir: naturaleza del incidente, datos afectados, medidas tomadas, medidas recomendadas a titulares

### Revisión Post-Incidente

1. ¿Fue un insider threat o un ataque externo?
2. ¿Las políticas de acceso (least privilege) eran adecuadas?
3. ¿Necesitamos Data Loss Prevention (DLP) tools?
4. Actualizar threat model

---

## Playbook 4: Intento de Escalación de Privilegios

### Detección

- Alerta A4: Cambio de rol o permiso sin autorización
- Alerta A3: Spike de RBAC DENY (posible probing de endpoints)
- Logs de acceso: Intentos de acceder a endpoints restringidos con rol insuficiente
- Auditoría de RBAC: Rol modificado sin registro en audit trail

### Contención Inmediata (0–15 min)

1. **Revocar sesiones del usuario sospechoso**
2. **Revertir rol:** Restaurar el rol original del usuario
3. **Verificar otros usuarios:** ¿Hubo cambios de rol en otras cuentas?
4. **Auditar permisos:** Revisar role-permission assignments para todo el tenant

### Investigación (15 min – 1 hora)

1. **Reconstruir bitácora:** ¿Cómo se modificó el rol? ¿API call directa? ¿DB access?
2. **Identificar vector:**
   - ¿Fue a través de un endpoint legítimo con credenciales comprometidas?
   - ¿Fue acceso directo a la base de datos?
   - ¿Fue un bug en la lógica de RBAC?
3. **Verificar alcance:** ¿Qué acciones realizó el usuario con el rol elevado?

### Remediación (1–2 horas)

1. **Parchear vulnerabilidad:** Si es un bug de RBAC, fix + deploy inmediato
2. **Rotar credenciales:** Si fue acceso a DB, rotar DATABASE_URL
3. **Reforzar RBAC:** Revisar matriz de permisos; ¿hay permisos demasiado amplios?
4. **Auditar todos los roles:** Revisión completa de role-permission assignments

### Revisión Post-Incidente

1. ¿Necesitamos aprobación secundaria para cambios de rol?
2. ¿Deberíamos implementar break-glass para roles elevados?
3. ¿El unified RBAC (Phase 1) cierra este vector?
4. Programar auditoría RBAC completa

---

## Escalation Contacts

> **Placeholder** — completar con contactos reales antes de producción.

| Rol                   | Nombre | Email | Teléfono |
| --------------------- | ------ | ----- | -------- |
| Security Lead         | [TBD]  | [TBD] | [TBD]    |
| CTO                   | [TBD]  | [TBD] | [TBD]    |
| DPO (Data Protection) | [TBD]  | [TBD] | [TBD]    |
| Infrastructure Lead   | [TBD]  | [TBD] | [TBD]    |
| Legal Counsel         | [TBD]  | [TBD] | [TBD]    |

---

## Security Review Cadence

| Review                        | Frequency                              | Owner          | Output                                        |
| ----------------------------- | -------------------------------------- | -------------- | --------------------------------------------- |
| Threat Model Review           | Every 6 months or on major arch change | Security Lead  | Dated summary with findings + action items    |
| NIST CSF Re-Baseline          | Annually                               | Security Lead  | Updated `nist-csf-baseline.md`                |
| RBAC Permission Audit         | Quarterly                              | Security Lead  | Role-permission review; least-privilege check |
| Secret Rotation Audit         | Monthly                                | Infrastructure | Verify all secrets within rotation window     |
| Incident Response Drill       | Every 6 months (tabletop)              | Security Lead  | Drill report with lessons learned             |
| Dependency Vulnerability Scan | Weekly (CI automated)                  | CI/CD Pipeline | `bun audit` / Dependabot report               |

---

## References

- `docs/05-security/threat-model.md` — STRIDE threat model
- `docs/05-security/monitoring-strategy.md` — Alert trigger definitions
- `docs/05-security/nist-csf-baseline.md` — NIST CSF 2.0 baseline
- `packages/security/src/rbac/` — Unified RBAC implementation
