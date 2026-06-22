/**
 * SirePleGenerationInput interface.
 *
 * @example
 * ```ts
 * const value: SirePleGenerationInput = {} as SirePleGenerationInput;
 * console.log(value);
 * ```
 */
export interface SirePleGenerationInput {
	companyId: string;
	period: string; // YYYY-MM
	ruc: string;
	declaredIgvPen: number;
	salesTotalPen: number;
	rvieRecords: number;
	rceRecords: number;
}

/**
 * SirePleFileSummary interface.
 *
 * @example
 * ```ts
 * const value: SirePleFileSummary = {} as SirePleFileSummary;
 * console.log(value);
 * ```
 */
export interface SirePleFileSummary {
	ledgerType: 'ventas' | 'compras';
	filename: string;
	recordCount: number;
	bytes: number;
	payloadBase64: string;
}

/**
 * SirePleGenerationResult interface.
 *
 * @example
 * ```ts
 * const value: SirePleGenerationResult = {} as SirePleGenerationResult;
 * console.log(value);
 * ```
 */
export interface SirePleGenerationResult {
	summary: {
		salesRecords: number;
		purchaseRecords: number;
		salesTotalPen: number;
		igvTotalPen: number;
	};
	files: {
		ventas: SirePleFileSummary;
		compras: SirePleFileSummary;
	};
}

const SALES_FIELD_COUNT = 30;
const PURCHASE_FIELD_COUNT = 35;

function parsePeriod(period: string): { year: number; month: number; yyyymm00: string } {
	const [yearText, monthText] = period.split('-');
	const year = Number(yearText);
	const month = Number(monthText);
	if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
		throw new Error(`Periodo invalido para PLE: ${period}`);
	}

	const yyyymm00 = `${year}${month.toString().padStart(2, '0')}00`;
	return { year, month, yyyymm00 };
}

function formatDate(year: number, month: number): string {
	return `01/${month.toString().padStart(2, '0')}/${year}`;
}

function formatAmount(value: number): string {
	return value.toFixed(2);
}

function buildFilename(
	ruc: string,
	year: number,
	month: number,
	ledgerType: 'ventas' | 'compras',
): string {
	const yyyymm = `${year}${month.toString().padStart(2, '0')}`;
	const suffix = ledgerType === 'ventas' ? 'RV' : 'RC';
	return `LE${ruc}${yyyymm}${suffix}.txt`;
}

function countRecords(txt: string): number {
	const trimmed = txt.trim();
	return trimmed ? trimmed.split('\n').length : 0;
}

function buildSalesRow(
	periodo: string,
	date: string,
	correlativo: number,
	ruc: string,
	basePen: number,
	igvPen: number,
	totalPen: number,
): string {
	const fields = [
		periodo,
		String(correlativo),
		date,
		'01',
		'F001',
		String(correlativo).padStart(8, '0'),
		String(correlativo).padStart(8, '0'),
		'6',
		ruc,
		'CONSUMIDOR FINAL',
		'0.00',
		formatAmount(basePen),
		'0.00',
		formatAmount(igvPen),
		'0.00',
		'0.00',
		'0.00',
		'0.00',
		'0.00',
		'0.00',
		'0.00',
		'0.00',
		formatAmount(totalPen),
		'PEN',
		'1.000',
		'',
		'',
		'',
		'',
		'1',
	];
	if (fields.length !== SALES_FIELD_COUNT) {
		throw new Error(`Formato RV invalido: ${fields.length} campos (esperado ${SALES_FIELD_COUNT})`);
	}
	return fields.join('|');
}

function buildPurchaseRow(
	periodo: string,
	date: string,
	correlativo: number,
	ruc: string,
	basePen: number,
	igvPen: number,
	totalPen: number,
): string {
	const fields = [
		periodo,
		String(correlativo),
		date,
		date,
		'01',
		'F001',
		'',
		String(correlativo).padStart(8, '0'),
		String(correlativo).padStart(8, '0'),
		'6',
		ruc,
		'PROVEEDOR REFERENCIAL',
		formatAmount(basePen),
		formatAmount(igvPen),
		'0.00',
		'0.00',
		'0.00',
		'0.00',
		'0.00',
		'0.00',
		'0.00',
		'0.00',
		formatAmount(totalPen),
		'PEN',
		'1.000',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'1',
		'',
	];
	if (fields.length !== PURCHASE_FIELD_COUNT) {
		throw new Error(
			`Formato RC invalido: ${fields.length} campos (esperado ${PURCHASE_FIELD_COUNT})`,
		);
	}
	return fields.join('|');
}

function buildRows(
	recordCount: number,
	rowFactory: (correlativo: number, base: number, igv: number, total: number) => string,
	totals: { base: number; igv: number; total: number },
): string {
	if (recordCount <= 0) return '';
	const rows: string[] = [];
	for (let index = 1; index <= recordCount; index += 1) {
		if (index === 1) {
			rows.push(rowFactory(index, totals.base, totals.igv, totals.total));
		} else {
			rows.push(rowFactory(index, 0, 0, 0));
		}
	}
	return rows.join('\n');
}

function buildFileSummary(
	ledgerType: 'ventas' | 'compras',
	filename: string,
	txtContent: string,
): SirePleFileSummary {
	return {
		ledgerType,
		filename,
		recordCount: countRecords(txtContent),
		bytes: Buffer.byteLength(txtContent, 'utf-8'),
		payloadBase64: Buffer.from(txtContent, 'utf-8').toString('base64'),
	};
}

/**
 * generateSirePleFiles operation.
 *
 * @param input - Input for input.
 * @returns Result of generateSirePleFiles.
 * @example
 * ```ts
 * const result = await generateSirePleFiles({} as SirePleGenerationInput);
 * console.log(result);
 * ```
 */
export async function generateSirePleFiles(
	input: SirePleGenerationInput,
): Promise<SirePleGenerationResult> {
	const { year, month, yyyymm00 } = parsePeriod(input.period);
	const firstDay = formatDate(year, month);

	const salesBase = Number((input.salesTotalPen - input.declaredIgvPen).toFixed(2));
	const salesTxt = buildRows(
		input.rvieRecords,
		(correlativo, base, igv, total) =>
			buildSalesRow(yyyymm00, firstDay, correlativo, input.ruc, base, igv, total),
		{
			base: salesBase,
			igv: input.declaredIgvPen,
			total: input.salesTotalPen,
		},
	);

	const purchaseTxt = buildRows(
		input.rceRecords,
		(correlativo, base, igv, total) =>
			buildPurchaseRow(yyyymm00, firstDay, correlativo, input.ruc, base, igv, total),
		{
			base: salesBase,
			igv: input.declaredIgvPen,
			total: input.salesTotalPen,
		},
	);

	return {
		summary: {
			salesRecords: input.rvieRecords,
			purchaseRecords: input.rceRecords,
			salesTotalPen: input.salesTotalPen,
			igvTotalPen: input.declaredIgvPen,
		},
		files: {
			ventas: buildFileSummary(
				'ventas',
				buildFilename(input.ruc, year, month, 'ventas'),
				salesTxt,
			),
			compras: buildFileSummary(
				'compras',
				buildFilename(input.ruc, year, month, 'compras'),
				purchaseTxt,
			),
		},
	};
}
