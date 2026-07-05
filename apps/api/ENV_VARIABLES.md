# Environment Variables - DRENYRA API

**Última actualización:** 2026-02-11
**Versión:** 2.0.0

> ⚠️ **IMPORTANTE:** No commitear archivos `.env` con credenciales reales. Usar este documento como referencia para crear tu `.env` local.

---

## 📋 Variables Requeridas (CRÍTICAS)

### Database (PostgreSQL)

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5436/drenyra"
```

**Setup rápido:**
```bash
docker compose up -d postgres
```

---

### Authentication (BetterAuth)

```bash
# Secret for session encryption (min 32 characters)
BETTER_AUTH_SECRET="your-secret-key-min-32-chars-recommended-64-chars-for-production"

# Base URL for callbacks (development)
BETTER_AUTH_URL="http://localhost:3000"

# Base URL for callbacks (production)
# BETTER_AUTH_URL="https://api.drenyrafounders.com"
```

**Generar secret:**
```bash
# Opción 1: OpenSSL
openssl rand -base64 64

# Opción 2: Node
bun -e "console.log(require('node:crypto').randomBytes(64).toString('base64'))"
```

---

## 🏦 Banking Providers (Prometeo API)

```bash
# Prometeo API Key (obtener de https://dashboard.prometeoapi.com/)
PROMETEO_API_KEY="your_prometeo_api_key_here"

# Environment (sandbox | production)
PROMETEO_ENV="sandbox"

# Base URL (opcional, se auto-configura según PROMETEO_ENV)
# PROMETEO_BASE_URL="https://banking.sandbox.prometeoapi.com"
```

**Cómo obtener API Key:**
1. Crear cuenta en [Prometeo Dashboard](https://dashboard.prometeoapi.com/)
2. Navegar a **API Keys** → **Create New Key**
3. Copiar key y pegar en `PROMETEO_API_KEY`

**URLs por ambiente:**
- **Sandbox:** `https://banking.sandbox.prometeoapi.com`
- **Production:** `https://banking.prometeoapi.com`

**Ver guía completa:** `docs/guides/prometeo-api-setup.md`

---

## 📜 OSE (Operador de Servicios Electrónicos) - SUNAT

### Modo Simulación (Development)

```bash
# Habilitar modo simulación (NO requiere credenciales reales)
OSE_SIMULATION_MODE="true"

# Provider (simulation | nubefact | bizlinks | otros)
OSE_PROVIDER="simulation"

# Webhook secret (para validar CDR callbacks)
OSE_WEBHOOK_SECRET="dev-webhook-secret-change-in-production"

# RUC de la empresa (11 dígitos)
COMPANY_RUC="20123456789"
```

**Modo simulación:**
- ✅ No requiere credenciales OSE reales
- ✅ Resultados determinísticos (ACEPTADO/OBSERVADO/RECHAZADO)
- ✅ Perfecto para testing local y CI/CD
- ⚠️ NO envía a SUNAT real

---

### Modo Producción (OSE Real)

```bash
# Deshabilitar simulación
OSE_SIMULATION_MODE="false"

# Provider real (nubefact | bizlinks)
OSE_PROVIDER="nubefact"

# URL del API del OSE
OSE_API_URL="https://api.nubefact.com/api/v1"

# Token de autenticación del OSE
OSE_API_TOKEN="your_ose_api_token_here"

# Username del OSE (si aplica)
OSE_USERNAME="your_ose_username"

# Environment (sandbox | production)
OSE_ENV="sandbox"

# Webhook secret (CAMBIAR en producción)
OSE_WEBHOOK_SECRET="production-webhook-secret-min-32-chars"

# RUC de la empresa
COMPANY_RUC="20123456789"
```

**Proveedores OSE soportados:**
- **Nubefact**: https://nubefact.com/ (recomendado para SMEs)
- **Bizlinks**: https://www.bizlinks.com.pe/ (enterprise)

**Ver guía completa:** `docs/guides/deployment/ose-onboarding-sandbox-2026.md`

---

## 🔧 Variables Opcionales

### Server

```bash
# Puerto del servidor (default: 3000)
PORT="3000"

# Node environment
NODE_ENV="development"  # development | production | test

# Lista allowlist de orígenes para CORS (separados por coma)
# Requerido en producción si el frontend está en otro dominio
# Ejemplo: "https://app.drenyrafounders.com,https://admin.drenyrafounders.com"
CORS_ALLOWED_ORIGINS="http://localhost:5173"

# Compatibilidad legacy (fallback si CORS_ALLOWED_ORIGINS no está definido)
# ALLOWED_ORIGINS="http://localhost:5173"
```

### Logging

```bash
# Log level (error | warn | info | debug)
LOG_LEVEL="info"
```

### AI Swarm Governance (Autonomía Controlada)

```bash
# Habilita/deshabilita la capa de políticas de autonomía
AUTONOMY_ENABLED="true"

# Kill switch global (bloquea ejecución autónoma cuando está en true)
AUTONOMY_GLOBAL_KILL_SWITCH="false"

# Monto máximo (PEN) permitido para auto-ejecución sin aprobación humana
AUTONOMY_MAX_AUTO_EXECUTION_PEN="10000"

# Riesgo máximo permitido para auto-ejecución (0.00 - 1.00)
AUTONOMY_MAX_RISK_SCORE="0.25"

# Requerir aprobación humana para tareas prioridad "critical"
AUTONOMY_REQUIRE_APPROVAL_FOR_CRITICAL="true"
```

**Comportamiento:**
- Si `AUTONOMY_GLOBAL_KILL_SWITCH="true"`: endpoints críticos (`/api/ai-swarm/*`, `/sire/submit`, `/electronic-invoicing/send`) quedan bloqueados (503)
- Si monto o riesgo exceden umbral: requiere `approval` explícito en payload
- Todas las decisiones devuelven `governance.trace` con hash verificable y se persisten en trazas de auditoría por feature

### Governance Audit Access

```bash
# Roles permitidos para consultar endpoints /governance-audit/*
# (headers requeridos: X-User-Id, X-User-Role; X-Company-Id en /decisions)
GOVERNANCE_AUDIT_ALLOWED_ROLES="owner,senior,admin,superadmin"

# Fallback opcional para entornos sin cookie/session BetterAuth
# (NO recomendado en producción)
GOVERNANCE_AUDIT_ALLOW_HEADER_AUTH_FALLBACK="false"
```

---

## 📝 Ejemplo Completo `.env` (Development)

```bash
# ============================================
# DRENYRA API - Development Environment
# ============================================

# Database
DATABASE_URL="postgresql://user:password@localhost:5436/drenyra"

# Auth (BetterAuth)
BETTER_AUTH_SECRET="dev-secret-key-change-in-production-min-32-chars-recommended-64"
BETTER_AUTH_URL="http://localhost:3000"

# Banking Providers (Prometeo API)
PROMETEO_API_KEY="your_prometeo_sandbox_api_key"
PROMETEO_ENV="sandbox"

# OSE (Simulación para development)
OSE_SIMULATION_MODE="true"
OSE_PROVIDER="simulation"
OSE_WEBHOOK_SECRET="dev-webhook-secret"
COMPANY_RUC="20123456789"

# Server
PORT="3000"
NODE_ENV="development"
LOG_LEVEL="info"
CORS_ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
```

---

## 📝 Ejemplo Completo `.env` (Production)

```bash
# ============================================
# DRENYRA API - Production Environment
# ============================================

# Database
DATABASE_URL="postgresql://user:password@production-db.aws.com:5432/drenyra_prod"

# Auth (BetterAuth)
BETTER_AUTH_SECRET="<CAMBIAR-CON-SECRET-REAL-64-CHARS>"
BETTER_AUTH_URL="https://api.drenyrafounders.com"

# Banking Providers (Prometeo API)
PROMETEO_API_KEY="<CAMBIAR-CON-KEY-REAL>"
PROMETEO_ENV="production"

# OSE (Nubefact Production)
OSE_SIMULATION_MODE="false"
OSE_PROVIDER="nubefact"
OSE_API_URL="https://api.nubefact.com/api/v1"
OSE_API_TOKEN="<CAMBIAR-CON-TOKEN-REAL>"
OSE_USERNAME="<CAMBIAR-CON-USERNAME-REAL>"
OSE_ENV="production"
OSE_WEBHOOK_SECRET="<CAMBIAR-CON-SECRET-REAL-64-CHARS>"
COMPANY_RUC="20123456789"

# Server
PORT="3000"
NODE_ENV="production"
LOG_LEVEL="warn"
CORS_ALLOWED_ORIGINS="https://app.drenyrafounders.com"
```

---

## ✅ Checklist de Setup

### Development

- [ ] PostgreSQL corriendo (`docker compose up -d postgres`)
- [ ] `DATABASE_URL` configurado
- [ ] `BETTER_AUTH_SECRET` generado (min 32 chars)
- [ ] `BETTER_AUTH_URL` apuntando a localhost
- [ ] `OSE_SIMULATION_MODE="true"` para testing sin OSE real
- [ ] `PROMETEO_API_KEY` (opcional, solo si vas a probar banking-providers)

### Production

- [ ] Database URL apuntando a producción
- [ ] `BETTER_AUTH_SECRET` único y seguro (64+ chars)
- [ ] `BETTER_AUTH_URL` apuntando a dominio real
- [ ] `OSE_SIMULATION_MODE="false"`
- [ ] Credenciales OSE reales configuradas
- [ ] `OSE_WEBHOOK_SECRET` único y seguro (64+ chars)
- [ ] `PROMETEO_API_KEY` de producción (si se usa)
- [ ] `NODE_ENV="production"`

---

## 🆘 Troubleshooting

### Error: "DATABASE_URL not configured"

```bash
# Verificar que PostgreSQL está corriendo
docker compose up -d postgres

# Verificar DATABASE_URL en .env
cat .env | grep DATABASE_URL
```

### Error: "BETTER_AUTH_SECRET must be at least 32 characters"

```bash
# Generar nuevo secret
openssl rand -base64 64

# Copiar output a .env
BETTER_AUTH_SECRET="<output del comando>"
```

### Error: "OSE_API_TOKEN required when simulation mode disabled"

```bash
# Opción 1: Habilitar modo simulación (dev)
OSE_SIMULATION_MODE="true"

# Opción 2: Configurar credenciales OSE reales (prod)
OSE_API_TOKEN="your_real_ose_token"
```

### Error: "PROMETEO_API_KEY not configured"

```bash
# Obtener API key de Prometeo Dashboard
# https://dashboard.prometeoapi.com/

# Agregar a .env
PROMETEO_API_KEY="pmt_api_xxx..."
```

---

## 🔐 Seguridad

**⚠️ NUNCA commitear credenciales reales:**

1. Agregar `.env` a `.gitignore`
2. Usar `.env.example` como template (sin credenciales)
3. Rotar secrets periódicamente (90 días)
4. Usar diferentes secrets para dev/staging/prod
5. Auditar access logs de credenciales

**Gestión de Secrets en Producción:**

- **Recomendado:** AWS Secrets Manager, HashiCorp Vault, Doppler
- **Alternativa:** Variables de entorno en plataforma de deploy (Fly.io, Railway, etc.)

---

## 📚 Referencias

- **BetterAuth Docs**: https://www.better-auth.com/docs
- **Prometeo API Docs**: https://docs.prometeoapi.com/
- **SUNAT OSE**: https://cpe.sunat.gob.pe/informacion_general/operador_servicios_electronicos
- **Nubefact Docs**: https://nubefact.com/soporte
- **Bizlinks Docs**: https://www.bizlinks.com.pe/documentacion

---

**© 2026 DRENYRA - Neural-Symbolic Financial Governance**
