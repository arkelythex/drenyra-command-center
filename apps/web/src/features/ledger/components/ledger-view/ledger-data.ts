export interface LedgerAccount {
	id: string;
	name: string;
	code: string;
	type: "ACCOUNT";
	activity: number;
}

export interface LedgerTransaction {
	id: string;
	date: string;
	voucher: string;
	glosa: string;
	cuenta: string;
	debe: number;
	haber: number;
	doc: string;
	bancarizado?: boolean;
}

export const PCGE_STRUCTURE: LedgerAccount[] = [
	{ id: "104", name: "CUENTAS CORRIENTES EN INST. FINANCIERAS", code: "104", type: "ACCOUNT", activity: 12 },
	{ id: "121", name: "FACTURAS, BOLETAS Y OTROS POR COBRAR", code: "121", type: "ACCOUNT", activity: 45 },
	{ id: "4011", name: "IGV - CUENTA PROPIA", code: "4011", type: "ACCOUNT", activity: 8 },
	{ id: "421", name: "FACTURAS, BOLETAS Y OTROS POR PAGAR", code: "421", type: "ACCOUNT", activity: 23 },
	{ id: "601", name: "MERCADERÍAS", code: "601", type: "ACCOUNT", activity: 15 },
	{ id: "701", name: "MERCADERÍAS - EXPORTACIÓN/LOCAL", code: "701", type: "ACCOUNT", activity: 38 },
];

export const MOCK_TX: LedgerTransaction[] = [
	{
		id: "1",
		date: "15/01",
		voucher: "V01-000452",
		glosa: "PROVISIÓN SERVICIO CLARO - ENERO",
		cuenta: "6311",
		debe: 0,
		haber: 450.5,
		doc: "FT F001-456",
	},
	{
		id: "2",
		date: "15/01",
		voucher: "V01-000453",
		glosa: "PAGO FACTURA CLARO - BCP MN",
		cuenta: "1041",
		debe: 450.5,
		haber: 0,
		doc: "OPE 998231",
		bancarizado: true,
	},
	{
		id: "3",
		date: "14/01",
		voucher: "V01-000451",
		glosa: "COMPRA DE SUMINISTROS DE OFICINA",
		cuenta: "6011",
		debe: 1250,
		haber: 0,
		doc: "FT E001-234",
	},
	{
		id: "4",
		date: "14/01",
		voucher: "V01-000451",
		glosa: "IGV - COMPRA SUMINISTROS",
		cuenta: "4011",
		debe: 225,
		haber: 0,
		doc: "FT E001-234",
	},
];
