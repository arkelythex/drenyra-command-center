export const EXPEDIENTE_STATUS_LABELS = {
    ABIERTO: "Abierto",
    EN_PROCESO: "En proceso",
    PENDIENTE_REVISION: "Pendiente revisión",
    PENDIENTE_APROBACION: "Pendiente aprobación",
    CERRADO: "Cerrado",
    ARCHIVADO: "Archivado",
};
export const EXPEDIENTE_KIND_LABELS = {
    CIERRE_MENSUAL: "Cierre Mensual",
    SIRE_COMPRAS: "SIRE Compras",
    SIRE_VENTAS: "SIRE Ventas",
    CONCILIACION_BANCARIA: "Conciliación Bancaria",
    AUDITORIA_FISCAL: "Auditoría Fiscal",
    DECLARACION_JURADA: "Declaración Jurada",
    DETRACCIONES: "Detracciones",
    PERCEPCIONES: "Percepciones",
    RETENCIONES: "Retenciones",
    GENERAL: "General",
};
export function buildDefaultCierreChecklist(expedienteId) {
    return [
        {
            id: `${expedienteId}-chk-01`,
            label: "Conciliación bancaria",
            descripcion: "Verificar que todos los movimientos bancarios coincidan con el ledger.",
            completado: false,
            requiereEvidencia: true,
            riesgo: "HIGH",
            orden: 1,
        },
        {
            id: `${expedienteId}-chk-02`,
            label: "Validación SIRE Compras",
            descripcion: "Cruzar comprobantes de compras con el registro SIRE de SUNAT.",
            completado: false,
            requiereEvidencia: true,
            riesgo: "HIGH",
            orden: 2,
        },
        {
            id: `${expedienteId}-chk-03`,
            label: "Validación SIRE Ventas",
            descripcion: "Cruzar comprobantes de ventas con el registro SIRE de SUNAT.",
            completado: false,
            requiereEvidencia: true,
            riesgo: "HIGH",
            orden: 3,
        },
        {
            id: `${expedienteId}-chk-04`,
            label: "Cálculo y verificación IGV",
            descripcion: "Validar que el IGV de compras y ventas sea correcto (18%).",
            completado: false,
            requiereEvidencia: false,
            riesgo: "HIGH",
            orden: 4,
        },
        {
            id: `${expedienteId}-chk-05`,
            label: "Detracciones y percepciones",
            descripcion: "Verificar detracciones SPOT y percepciones aplicables.",
            completado: false,
            requiereEvidencia: true,
            riesgo: "MEDIUM",
            orden: 5,
        },
        {
            id: `${expedienteId}-chk-06`,
            label: "Retenciones",
            descripcion: "Verificar retenciones de 4ta y 5ta categoría.",
            completado: false,
            requiereEvidencia: false,
            riesgo: "MEDIUM",
            orden: 6,
        },
        {
            id: `${expedienteId}-chk-07`,
            label: "Revisión de asientos contables",
            descripcion: "Revisar que todos los asientos del período estén cuadrados.",
            completado: false,
            requiereEvidencia: false,
            riesgo: "MEDIUM",
            orden: 7,
        },
        {
            id: `${expedienteId}-chk-08`,
            label: "Generación de paquete de evidencia",
            descripcion: "Generar ZIP con todos los documentos, CDRs, reportes y conciliaciones.",
            completado: false,
            requiereEvidencia: true,
            riesgo: "LOW",
            orden: 8,
        },
        {
            id: `${expedienteId}-chk-09`,
            label: "Firma del contador",
            descripcion: "Firma digital del contador general sobre el paquete de cierre.",
            completado: false,
            requiereEvidencia: true,
            riesgo: "HIGH",
            orden: 9,
        },
        {
            id: `${expedienteId}-chk-10`,
            label: "Firma del representante legal",
            descripcion: "Firma digital del representante legal sobre el cierre validado.",
            completado: false,
            requiereEvidencia: true,
            riesgo: "HIGH",
            orden: 10,
        },
    ];
}
export function calculateCierreProgress(checklist) {
    if (checklist.length === 0)
        return 0;
    const completed = checklist.filter((item) => item.completado).length;
    return completed / checklist.length;
}
export const EXPEDIENTE_STATUS_COLORS = {
    ABIERTO: "var(--color-info)",
    EN_PROCESO: "var(--color-info)",
    PENDIENTE_REVISION: "var(--color-warning)",
    PENDIENTE_APROBACION: "var(--color-warning)",
    CERRADO: "var(--color-success)",
    ARCHIVADO: "var(--color-text-disabled)",
};
//# sourceMappingURL=expediente-fiscal.js.map