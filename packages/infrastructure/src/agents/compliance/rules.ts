/**
 * Load normative context for compliance analysis
 * In production, this would use a RAG pipeline to load relevant SUNAT regulations
 */
export async function loadNormativeContext(_topics: string[]): Promise<string> {
	// TODO: Integrate with RAG system for dynamic regulation loading
	const staticContext = `
PERUVIAN TAX LAW CONTEXT:

1. GASTOS DE REPRESENTACIÓN (Art. 37 inciso 'r' LIR):
   - Límite: 0.5% de los ingresos netos acumulados del ejercicio
   - Tope máximo: 40 UIT (S/ 206,000 para 2025)
   - Requisitos: Demostrar causalidad con generación de renta
   - Documentación: Lista de asistentes, motivo comercial

2. BANCARIZACIÓN (Ley 28194):
   - Obligatoria para operaciones >= S/ 2,000 o $500
   - Medios válidos: Transferencia, cheque, tarjeta
   - Consecuencia: Gasto no deducible si incumple

3. DETRACCIONES (SPOT):
   - Aplica sobre monto > S/ 700
   - Tasas según tipo de servicio (4% - 15%)
   - Plazo de depósito: Hasta 5to día hábil

4. PROVEEDOR NO HABIDO:
   - Verificar estado en padrones SUNAT antes de operación
   - Facturas de proveedores "No Habido" no son deducibles
   - Consulta: https://e-consultaruc.sunat.gob.pe
`;
	return staticContext;
}
