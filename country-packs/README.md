# Drenyra Country Packs

Paquetes de configuración fiscal por país. Cada país contiene reglas, validaciones, formatos y calendarios específicos.

## Estructura

```
country-packs/
├── peru/           → SUNAT, SIRE, IGV, detracciones, retenciones, PLE
├── colombia/       → DIAN, factura electrónica (futuro)
├── chile/          → SII, factura electrónica (futuro)
└── mexico/         → SAT, CFDI (futuro)
```

## Contenido típico por país

- FSD (Fiscal Specification Documents) por obligación
- Reglas de validación fiscal
- Calendarios y vencimientos
- Formatos de declaración
- Mapeo de cuentas PCGE local
- Configuración de conectores

Ver [Program Taxonomy](../docs/architecture/program-taxonomy.md).
