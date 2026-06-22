import { z } from "zod";
export declare const CrearAsientoSchema: z.ZodObject<{
    fecha: z.ZodString;
    glosa: z.ZodString;
    lineas: z.ZodArray<z.ZodObject<{
        cuenta: z.ZodString;
        debe: z.ZodNumber;
        haber: z.ZodNumber;
        glosa_linea: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ConsultarRucSchema: z.ZodObject<{
    ruc: z.ZodString;
}, z.core.$strip>;
export declare const CalcularDetraccionSchema: z.ZodObject<{
    monto_total: z.ZodNumber;
    tipo_servicio: z.ZodEnum<{
        transporte_carga: "transporte_carga";
        transporte_pasajeros: "transporte_pasajeros";
        intermediacion_laboral: "intermediacion_laboral";
        arrendamiento_bienes: "arrendamiento_bienes";
        mantenimiento_reparacion: "mantenimiento_reparacion";
        otros_servicios: "otros_servicios";
        construccion: "construccion";
    }>;
}, z.core.$strip>;
export declare const VerificarComprobanteSchema: z.ZodObject<{
    ruc_emisor: z.ZodString;
    tipo: z.ZodEnum<{
        "01": "01";
        "03": "03";
        "07": "07";
        "08": "08";
    }>;
    serie: z.ZodString;
    numero: z.ZodString;
}, z.core.$strip>;
export declare const ObtenerTipoCambioSchema: z.ZodObject<{
    fecha: z.ZodString;
    moneda: z.ZodDefault<z.ZodEnum<{
        USD: "USD";
        EUR: "EUR";
    }>>;
}, z.core.$strip>;
export declare const RegistrarGastoVozSchema: z.ZodObject<{
    descripcion: z.ZodString;
    monto: z.ZodNumber;
    cuenta_sugerida: z.ZodOptional<z.ZodString>;
    medio_pago: z.ZodEnum<{
        efectivo: "efectivo";
        tarjeta: "tarjeta";
        transferencia: "transferencia";
        yape: "yape";
        plin: "plin";
    }>;
}, z.core.$strip>;
export type CrearAsientoInput = z.infer<typeof CrearAsientoSchema>;
export type ConsultarRucInput = z.infer<typeof ConsultarRucSchema>;
export type CalcularDetraccionInput = z.infer<typeof CalcularDetraccionSchema>;
export type VerificarComprobanteInput = z.infer<typeof VerificarComprobanteSchema>;
export type ObtenerTipoCambioInput = z.infer<typeof ObtenerTipoCambioSchema>;
export type RegistrarGastoVozInput = z.infer<typeof RegistrarGastoVozSchema>;
export declare function crearAsiento(input: CrearAsientoInput): Promise<{
    success: false;
    error: string;
    asiento_id?: undefined;
    mensaje?: undefined;
    total?: undefined;
} | {
    success: true;
    asiento_id: string;
    mensaje: string;
    total: number;
    error?: undefined;
}>;
export declare function consultarRucSunat(input: ConsultarRucInput): Promise<{
    success: true;
    ruc: string;
    razon_social: string;
    estado: string;
    condicion: string;
    direccion: string;
    tipo: string;
    error?: undefined;
} | {
    success: false;
    error: string;
    ruc?: undefined;
    razon_social?: undefined;
    estado?: undefined;
    condicion?: undefined;
    direccion?: undefined;
    tipo?: undefined;
}>;
export declare function calcularDetraccion(input: CalcularDetraccionInput): Promise<{
    success: true;
    aplica_detraccion: boolean;
    razon: string;
    monto_a_pagar: number;
    porcentaje?: undefined;
    monto_detraccion?: undefined;
    monto_neto?: undefined;
    depositar_en?: undefined;
} | {
    success: true;
    aplica_detraccion: boolean;
    porcentaje: number;
    monto_detraccion: number;
    monto_neto: number;
    depositar_en: string;
    razon?: undefined;
    monto_a_pagar?: undefined;
}>;
export declare function verificarComprobante(input: VerificarComprobanteInput): Promise<{
    success: true;
    es_valido: boolean;
    tipo_descripcion: string;
    ruc_emisor: string;
    serie: string;
    numero: string;
    estado: string;
    mensaje: string;
}>;
export declare function obtenerTipoCambio(input: ObtenerTipoCambioInput): Promise<{
    success: true;
    fecha: string;
    moneda: "USD" | "EUR";
    compra: number;
    venta: number;
    fuente: string;
}>;
export declare function registrarGastoVoz(input: RegistrarGastoVozInput): Promise<{
    success: true;
    asiento_id: string;
    cuenta_usada: string;
    medio_pago: "efectivo" | "tarjeta" | "transferencia" | "yape" | "plin";
    monto: number;
    confirmacion: string;
    asiento: {
        fecha: string;
        glosa: string;
        lineas: {
            cuenta: string;
            debe: number;
            haber: number;
            glosa_linea: string;
        }[];
    };
}>;
export declare const geminiToolDefinitions: readonly [{
    readonly name: "crear_asiento";
    readonly description: "Crear un asiento contable en el libro diario de Arkelythex";
    readonly parameters: z.ZodObject<{
        fecha: z.ZodString;
        glosa: z.ZodString;
        lineas: z.ZodArray<z.ZodObject<{
            cuenta: z.ZodString;
            debe: z.ZodNumber;
            haber: z.ZodNumber;
            glosa_linea: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, {
    readonly name: "consultar_ruc_sunat";
    readonly description: "Validar un RUC con SUNAT y obtener información del contribuyente";
    readonly parameters: z.ZodObject<{
        ruc: z.ZodString;
    }, z.core.$strip>;
}, {
    readonly name: "calcular_detraccion";
    readonly description: "Calcular el monto de detracción según el tipo de servicio y umbral de S/ 700";
    readonly parameters: z.ZodObject<{
        monto_total: z.ZodNumber;
        tipo_servicio: z.ZodEnum<{
            transporte_carga: "transporte_carga";
            transporte_pasajeros: "transporte_pasajeros";
            intermediacion_laboral: "intermediacion_laboral";
            arrendamiento_bienes: "arrendamiento_bienes";
            mantenimiento_reparacion: "mantenimiento_reparacion";
            otros_servicios: "otros_servicios";
            construccion: "construccion";
        }>;
    }, z.core.$strip>;
}, {
    readonly name: "verificar_comprobante";
    readonly description: "Verificar si un comprobante de pago es válido en SUNAT";
    readonly parameters: z.ZodObject<{
        ruc_emisor: z.ZodString;
        tipo: z.ZodEnum<{
            "01": "01";
            "03": "03";
            "07": "07";
            "08": "08";
        }>;
        serie: z.ZodString;
        numero: z.ZodString;
    }, z.core.$strip>;
}, {
    readonly name: "obtener_tipo_cambio";
    readonly description: "Obtener el tipo de cambio oficial de la SBS para una fecha específica";
    readonly parameters: z.ZodObject<{
        fecha: z.ZodString;
        moneda: z.ZodDefault<z.ZodEnum<{
            USD: "USD";
            EUR: "EUR";
        }>>;
    }, z.core.$strip>;
}, {
    readonly name: "registrar_gasto_voz";
    readonly description: "Registrar un gasto a partir de un comando de voz. Crea el asiento contable correspondiente.";
    readonly parameters: z.ZodObject<{
        descripcion: z.ZodString;
        monto: z.ZodNumber;
        cuenta_sugerida: z.ZodOptional<z.ZodString>;
        medio_pago: z.ZodEnum<{
            efectivo: "efectivo";
            tarjeta: "tarjeta";
            transferencia: "transferencia";
            yape: "yape";
            plin: "plin";
        }>;
    }, z.core.$strip>;
}];
export declare function executeGeminiTool(toolName: string, args: unknown): Promise<{
    success: false;
    error: string;
    asiento_id?: undefined;
    mensaje?: undefined;
    total?: undefined;
} | {
    success: true;
    asiento_id: string;
    mensaje: string;
    total: number;
    error?: undefined;
} | {
    success: true;
    ruc: string;
    razon_social: string;
    estado: string;
    condicion: string;
    direccion: string;
    tipo: string;
    error?: undefined;
} | {
    success: false;
    error: string;
    ruc?: undefined;
    razon_social?: undefined;
    estado?: undefined;
    condicion?: undefined;
    direccion?: undefined;
    tipo?: undefined;
} | {
    success: true;
    aplica_detraccion: boolean;
    razon: string;
    monto_a_pagar: number;
    porcentaje?: undefined;
    monto_detraccion?: undefined;
    monto_neto?: undefined;
    depositar_en?: undefined;
} | {
    success: true;
    aplica_detraccion: boolean;
    porcentaje: number;
    monto_detraccion: number;
    monto_neto: number;
    depositar_en: string;
    razon?: undefined;
    monto_a_pagar?: undefined;
} | {
    success: true;
    es_valido: boolean;
    tipo_descripcion: string;
    ruc_emisor: string;
    serie: string;
    numero: string;
    estado: string;
    mensaje: string;
} | {
    success: true;
    fecha: string;
    moneda: "USD" | "EUR";
    compra: number;
    venta: number;
    fuente: string;
} | {
    success: true;
    asiento_id: string;
    cuenta_usada: string;
    medio_pago: "efectivo" | "tarjeta" | "transferencia" | "yape" | "plin";
    monto: number;
    confirmacion: string;
    asiento: {
        fecha: string;
        glosa: string;
        lineas: {
            cuenta: string;
            debe: number;
            haber: number;
            glosa_linea: string;
        }[];
    };
}>;
export type GeminiToolName = (typeof geminiToolDefinitions)[number]["name"];
//# sourceMappingURL=gemini-tools.d.ts.map