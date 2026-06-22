export interface RucInfo {
    ruc: string;
    razonSocial: string;
    nombreComercial?: string;
    estado: "ACTIVO" | "BAJA" | "SUSPENSION" | string;
    condicion: "HABIDO" | "NO HABIDO" | "NO HALLADO" | string;
    direccion?: string;
    ubigeo?: string;
    tipo: "PERSONA NATURAL" | "PERSONA JURIDICA" | string;
    fechaInscripcion?: string;
    fechaInicioActividades?: string;
    actividadEconomica?: string;
}
export interface InvoiceVerification {
    esValido: boolean;
    rucEmisor: string;
    tipoComprobante: string;
    serie: string;
    numero: string;
    fechaEmision?: string;
    estado: "ACEPTADO" | "RECHAZADO" | "PENDIENTE" | string;
    mensaje: string;
    montoTotal?: number;
}
export declare function consultarRucSunat(ruc: string): Promise<RucInfo>;
export declare function validarDigitoVerificadorRuc(ruc: string): boolean;
export declare function verificarComprobanteSunat(rucEmisor: string, tipo: "01" | "03" | "07" | "08", serie: string, numero: string): Promise<InvoiceVerification>;
export declare function validarDni(dni: string): boolean;
export declare function consultarDni(dni: string): Promise<{
    dni: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombreCompleto: string;
}>;
//# sourceMappingURL=sunat.service.d.ts.map