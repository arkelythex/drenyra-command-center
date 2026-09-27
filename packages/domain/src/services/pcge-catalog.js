export const PCGE_CATALOG = [
    {
        code: "1011.11",
        name: "Caja",
        type: "ASSET",
        category: "Efectivo",
        keywords: ["caja", "efectivo", "billete"],
    },
    {
        code: "1041.11",
        name: "Cuentas Corrientes",
        type: "ASSET",
        category: "Bancos",
        keywords: [
            "banco",
            "bcp",
            "interbank",
            "bbva",
            "scotiabank",
            "transferencia",
            "depósito",
        ],
    },
    {
        code: "1211.11",
        name: "Facturas por Cobrar",
        type: "ASSET",
        category: "Cuentas por Cobrar",
        keywords: ["factura", "cobrar", "cliente", "pendiente"],
    },
    {
        code: "1411.11",
        name: "Mercaderías",
        type: "ASSET",
        category: "Existencias",
        keywords: ["mercadería", "inventario", "stock", "producto"],
    },
    {
        code: "4011.11",
        name: "IGV por Pagar",
        type: "LIABILITY",
        category: "Tributos",
        keywords: ["igv", "iva", "impuesto", "tributo", "sunat"],
    },
    {
        code: "4111.11",
        name: "Facturas por Pagar",
        type: "LIABILITY",
        category: "Cuentas por Pagar",
        keywords: ["proveedor", "factura", "pagar", "compra"],
    },
    {
        code: "7011.11",
        name: "Venta de Mercaderías",
        type: "INCOME",
        category: "Ventas",
        keywords: [
            "venta",
            "facturación",
            "ingreso",
            "cliente",
            "servicio",
            "consultoría",
            "honorario",
        ],
    },
    {
        code: "7021.11",
        name: "Venta de Productos",
        type: "INCOME",
        category: "Ventas",
        keywords: ["producto", "venta", "artículo"],
    },
    {
        code: "6011.11",
        name: "Compras de Mercaderías",
        type: "COST",
        category: "Compras",
        keywords: [
            "compra",
            "adquisición",
            "útil",
            "oficina",
            "material",
            "insumo",
            "repuesto",
        ],
    },
    {
        code: "6021.11",
        name: "Compras de Materias Primas",
        type: "COST",
        category: "Compras",
        keywords: ["materia prima", "insumo", "producción"],
    },
    {
        code: "6211.11",
        name: "Sueldos y Salarios",
        type: "EXPENSE",
        category: "Personal",
        keywords: [
            "sueldo",
            "salario",
            "planilla",
            "remuneración",
            "personal",
            "trabajador",
        ],
    },
    {
        code: "6311.11",
        name: "Servicios Públicos",
        type: "EXPENSE",
        category: "Servicios",
        keywords: ["luz", "agua", "teléfono", "internet", "electricidad", "gas"],
    },
    {
        code: "6321.11",
        name: "Alquileres",
        type: "EXPENSE",
        category: "Servicios",
        keywords: ["alquiler", "renta", "local", "oficina", "leasing"],
    },
    {
        code: "6331.11",
        name: "Servicios de Terceros",
        type: "EXPENSE",
        category: "Servicios",
        keywords: [
            "servicio",
            "tercero",
            "outsourcing",
            "mantenimiento",
            "limpieza",
            "vigilancia",
        ],
    },
    {
        code: "6341.11",
        name: "Asesoría y Consultoría",
        type: "EXPENSE",
        category: "Servicios",
        keywords: [
            "asesoría",
            "consultoría",
            "legal",
            "contable",
            "auditoría",
            "abogado",
        ],
    },
    {
        code: "6351.11",
        name: "Gastos de Representación",
        type: "EXPENSE",
        category: "Gastos",
        keywords: ["representación", "viático", "movilidad", "pasaje", "hotel"],
    },
    {
        code: "6391.11",
        name: "Otros Gastos",
        type: "EXPENSE",
        category: "Gastos",
        keywords: ["gasto", "varios", "diverso", "otro"],
    },
    {
        code: "6811.11",
        name: "Depreciación",
        type: "EXPENSE",
        category: "Depreciación",
        keywords: ["depreciación", "activo fijo", "equipo", "maquinaria"],
    },
];
export function findBestAccount(description, vendorName) {
    const desc = description
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const vendor = (vendorName ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    let bestScore = 0;
    let bestAccount = PCGE_CATALOG.find((a) => a.code === "6391.11");
    for (const account of PCGE_CATALOG) {
        let score = 0;
        for (const keyword of account.keywords) {
            if (desc.includes(keyword))
                score += 20;
            if (vendor.includes(keyword))
                score += 10;
        }
        if (score > 0 && desc.includes(account.category.toLowerCase())) {
            score += 15;
        }
        if (score > bestScore) {
            bestScore = score;
            bestAccount = account;
        }
    }
    const confidence = Math.min(100, Math.max(10, bestScore));
    return { account: bestAccount, confidence };
}
//# sourceMappingURL=pcge-catalog.js.map