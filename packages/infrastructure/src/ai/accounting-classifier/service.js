import { generateObject } from "ai";
import { modelFlash } from "../models";
import { ClassificationSchema } from "./types";
const PCGE_CONTEXT = `
Plan Contable General Empresarial (PCGE) - Perú:

CLASE 6 - GASTOS POR NATURALEZA:
- 60 Compras
  - 6011 Mercaderías
  - 6021 Materias primas
- 61 Variación de existencias
- 62 Gastos de personal
  - 6211 Sueldos y salarios
- 63 Gastos de servicios prestados por terceros
  - 6311 Transporte
  - 6313 Alojamiento
  - 6314 Alimentación
  - 6321 Asesoría administrativa
  - 6322 Asesoría legal y tributaria
  - 6323 Auditoría y contable
  - 6341 Mantenimiento de inmuebles
  - 6351 Alquileres
  - 6361 Energía eléctrica
  - 6363 Agua
  - 6364 Teléfono
  - 6365 Internet
- 64 Gastos por tributos
- 65 Otros gastos de gestión
  - 6511 Seguros
  - 6521 Suscripciones
- 66 Pérdida por medición de activos
- 67 Gastos financieros
  - 6711 Préstamos de instituciones financieras
  - 6712 Contratos de arrendamiento financiero

CLASE 3 - ACTIVOS:
- 33 Inmuebles, maquinaria y equipo
  - 3311 Terrenos
  - 3321 Edificaciones
  - 3341 Vehículos motorizados
  - 3351 Muebles
  - 3361 Equipos de cómputo

CLASE 4 - PASIVOS:
- 40 Tributos por pagar
  - 4011 IGV
- 42 Cuentas por pagar comerciales
  - 4212 Emitidas
`;
export async function classifyExpense(input) {
    try {
        const systemPrompt = `Eres un contador peruano experto en el Plan Contable General Empresarial (PCGE).

${PCGE_CONTEXT}

Tu tarea es clasificar gastos y sugerir la cuenta contable correcta.
El negocio es del rubro: ${input.businessType || "general"}.

Reglas importantes:
1. Para compras de mercadería para reventa, usa 6011
2. Para servicios de terceros (transporte, alimentación, etc), usa 63xx
3. Para compras de activos fijos, usa 33xx
4. El IGV siempre va a la cuenta 4011
5. Las cuentas por pagar van a 4212

Responde siempre en JSON estructurado.`;
        const userPrompt = `Clasifica este gasto:
- Descripción: ${input.itemDescription}
- Monto: S/ ${input.amount.toFixed(2)}
${input.providerName ? `- Proveedor: ${input.providerName}` : ""}
${input.category ? `- Categoría sugerida: ${input.category}` : ""}

¿Cuál es la cuenta contable correcta según el PCGE?`;
        const result = await generateObject({
            model: modelFlash,
            schema: ClassificationSchema,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.1,
        });
        return result.object;
    }
    catch (error) {
        console.error("[AccountingClassifier] Error:", error);
        return null;
    }
}
export async function suggestPurchaseEntry(invoice) {
    try {
        const mainItem = invoice.items[0];
        const classification = await classifyExpense({
            itemDescription: mainItem?.description || invoice.providerName,
            amount: invoice.subtotal,
            providerName: invoice.providerName,
        });
        if (!classification) {
            return null;
        }
        return {
            debit: [
                {
                    accountCode: classification.accountCode,
                    accountName: classification.accountName,
                    amount: invoice.subtotal,
                },
                {
                    accountCode: "4011",
                    accountName: "IGV - Cuenta propia",
                    amount: invoice.igv,
                },
            ],
            credit: [
                {
                    accountCode: "4212",
                    accountName: "Cuentas por pagar comerciales - Emitidas",
                    amount: invoice.total,
                },
            ],
        };
    }
    catch (error) {
        console.error("[AccountingClassifier] Error suggesting entry:", error);
        return null;
    }
}
export function quickClassify(description) {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("taxi") ||
        lowerDesc.includes("uber") ||
        lowerDesc.includes("transporte")) {
        return { accountCode: "6311", accountName: "Transporte de carga" };
    }
    if (lowerDesc.includes("restaurante") ||
        lowerDesc.includes("almuerzo") ||
        lowerDesc.includes("comida")) {
        return { accountCode: "6314", accountName: "Alimentación" };
    }
    if (lowerDesc.includes("hotel") || lowerDesc.includes("hospedaje")) {
        return { accountCode: "6313", accountName: "Alojamiento" };
    }
    if (lowerDesc.includes("luz") || lowerDesc.includes("electricidad")) {
        return { accountCode: "6361", accountName: "Energía eléctrica" };
    }
    if (lowerDesc.includes("agua")) {
        return { accountCode: "6363", accountName: "Agua" };
    }
    if (lowerDesc.includes("teléfono") ||
        lowerDesc.includes("telefono") ||
        lowerDesc.includes("celular")) {
        return { accountCode: "6364", accountName: "Teléfono" };
    }
    if (lowerDesc.includes("internet")) {
        return { accountCode: "6365", accountName: "Internet" };
    }
    if (lowerDesc.includes("útiles") ||
        lowerDesc.includes("oficina") ||
        lowerDesc.includes("papelería")) {
        return { accountCode: "6561", accountName: "Suministros" };
    }
    if (lowerDesc.includes("contab") || lowerDesc.includes("auditor")) {
        return { accountCode: "6323", accountName: "Auditoría y contable" };
    }
    if (lowerDesc.includes("legal") || lowerDesc.includes("abogado")) {
        return { accountCode: "6322", accountName: "Legal y tributaria" };
    }
    return { accountCode: "6599", accountName: "Otros gastos de gestión" };
}
//# sourceMappingURL=service.js.map