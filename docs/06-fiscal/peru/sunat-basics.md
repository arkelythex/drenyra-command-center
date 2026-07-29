# SUNAT Basics — RUC, SOL, Regímenes y Operaciones

**Última actualización:** 2026-07-29
**Base legal:** D.S. 055-99-EF, R.S. 200-2014/SUNAT, Ley 32387

---

## RUC — Registro Único de Contribuyente

El RUC es el identificador tributario único en Perú. Toda persona natural o jurídica que realice actividades económicas debe registrarse.

**Estructura:** 11 dígitos numéricos con dígito verificador.

**Estados del RUC:**

| Estado | Significado |
|---|---|
| **Activo** | Habilitado para emitir comprobantes y declarar |
| **Activo – Suspensión temporal** | No puede emitir comprobantes |
| **De baja** | Cancelado por cese de actividades |
| **De baja – oficio** | Dado de baja por SUNAT |

**Estado del domicilio fiscal:**

| Estado | Significado |
|---|---|
| **Habido** | Domicilio verificado |
| **No habido** | Domicilio no verificado — restricciones operativas |

### Validación en Drenyra

```typescript
interface RucValidation {
  ruc: string           // 11 dígitos
  isValid: boolean       // Checksum verification
  status: 'active' | 'suspended' | 'cancelled'
  addressStatus: 'habido' | 'no-habido'
  name: string           // Razón social
  taxRegime: TaxRegime   // NRUS | RER | MYPE | REG
}
```

---

## SOL — Sistema de Operaciones en Línea

SOL es la plataforma web de SUNAT para realizar operaciones tributarias. El acceso requiere:

1. **Usuario SOL** — asignado por SUNAT al registrar el RUC
2. **Clave SOL** — contraseña del usuario
3. **Token (opcional)** — autenticación de dos factores

### Operaciones disponibles vía SOL

- Declaración mensual IGV-Renta
- Declaración anual
- Consulta de RUC
- Consulta de detracciones
- SIRE (RVIE, RCE)
- PLE (envío de libros)
- Consulta de CDR
- Solicitud de baja de RUC

### Drenyra y SOL

Drenyra automatiza las operaciones SOL mediante conectores autorizados. Las credenciales SOL se almacenan cifradas y aisladas por tenant. Nunca se exponen a agentes ni se envían por la red sin cifrado.

---

## Regímenes tributarios (2026)

### NRUS — Nuevo Régimen Único Simplificado

| Concepto | Detalle |
|---|---|
| Ingreso máximo | S/ 96,000 anuales |
| IGV | Exonerado |
| Renta | Cuota fija mensual (S/ 25 o S/ 50) |
| Comprobantes | Boleta de venta solamente |

### RER — Régimen Especial de Renta

| Concepto | Detalle |
|---|---|
| Ingreso máximo | S/ 525,000 anuales |
| IGV | 18% — crédito fiscal aplica |
| Renta | 1.5% sobre ingresos netos mensuales |
| Comprobantes | Factura, boleta y otros |

### MYPE Tributario

| Concepto | Detalle |
|---|---|
| Ingreso máximo | 1,700 UIT (S/ 9,095,000 en 2026) |
| IGV | 18% — crédito fiscal aplica |
| Renta | Escala progresiva (10% hasta 15 UIT, 29.5% exceso) |
| Comprobantes | Todos |

### Régimen General (REG)

| Concepto | Detalle |
|---|---|
| Ingreso máximo | Sin límite |
| IGV | 18% — crédito fiscal aplica |
| Renta | 29.5% sobre utilidad neta |
| Comprobantes | Todos |

---

## SEE — Sistema de Emisión Electrónica

SUNAT ofrece varios sistemas para emitir comprobantes electrónicos:

| Sistema | Descripción |
|---|---|
| **SEE – SUNAT** | Portal gratuito de SUNAT para emitir facturas y boletas |
| **SEE – SOL** | Emisión desde SOL para operaciones simples |
| **SEE – Contribuyente** | El contribuyente usa su propio sistema y envía a SUNAT vía API |
| **SEE – OSE** | Operador de Servicios Electrónicos autorizado |

### Plazos de envío

| Tipo | Plazo |
|---|---|
| Factura electrónica | 72 horas desde la emisión |
| Boleta de venta | 7 días calendario |
| Nota de crédito/débito | 72 horas |
| Retención/percepción | 5 días hábiles |

---

## Cronograma de obligaciones

El pago de impuestos sigue el **cronograma de vencimientos** basado en el último dígito del RUC:

| Dígito RUC | Fecha de vencimiento |
|---|---|
| 0 | 10 del mes siguiente |
| 1 | 11 del mes siguiente |
| 2 | 12 del mes siguiente |
| ... | ... |
| 9 | 19 del mes siguiente |
| Otros | 20 del mes siguiente |

> Bueno Contribuyente: los plazos se extienden 5 días hábiles adicionales.

---

## Do / Don't

### Hacer

- Validar el RUC contra SUNAT antes de cada operación material.
- Almacenar credenciales SOL cifradas y aisladas por tenant.
- Respetar los plazos de envío de CPE según el tipo de comprobante.

### No hacer

- No operar con un RUC en estado "no habido" sin verificar la causa.
- No almacenar claves SOL en texto plano, variables de entorno sin cifrar, o logs.
- No asumir que un RUC activo hoy lo seguirá estando mañana — verificar en cada operación material.

---

## Referencias

- [SUNAT — RUC](https://www.sunat.gob.pe/ruc/)
- [SUNAT — Regímenes tributarios](https://www.gob.pe/7910-impuesto-general-a-las-ventas-igv)
- [SUNAT — SEE Comprobantes](https://cpe.sunat.gob.pe/)
- [SUNAT — Cronograma de vencimientos](https://www.sunat.gob.pe/)
