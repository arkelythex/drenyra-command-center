import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateSirePleFilesMock = vi.fn();
const validateCpeMock = vi.fn();
const submitMock = vi.fn();

vi.mock('../../workflows/sire-ple-generation.service', () => ({
	generateSirePleFiles: generateSirePleFilesMock,
}));

vi.mock('../../../cpe-validator/application/commands/validate-cpe.command', () => ({
	validateCpe: validateCpeMock,
}));

vi.mock('../../../sire/sire-submission.service', () => ({
	SireSubmissionService: {
		submit: submitMock,
	},
}));

const BASE_INPUT = {
	companyId: 'cmp-001',
	period: '2026-07',
	ruc: '20123456789',
	declaredIgvPen: 180,
	salesTotalPen: 1000,
	rvieRecords: 12,
	rceRecords: 7,
	pleSalesRecords: 12,
	plePurchaseRecords: 7,
	dryRun: true,
};

const PLE_RESULT = {
	summary: {
		salesRecords: 12,
		purchaseRecords: 7,
		salesTotalPen: 1000,
		igvTotalPen: 180,
	},
	files: {
		ventas: {
			ledgerType: 'ventas' as const,
			filename: 'LE20123456789202607RV.txt',
			recordCount: 12,
			bytes: 1400,
			payloadBase64: 'dmVudGFzLXBsZS10eHQ=',
		},
		compras: {
			ledgerType: 'compras' as const,
			filename: 'LE20123456789202607RC.txt',
			recordCount: 7,
			bytes: 900,
			payloadBase64: 'Y29tcHJhcy1wbGUtdHh0',
		},
	},
};

describe('runSireAuditWorkflow', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		generateSirePleFilesMock.mockResolvedValue(PLE_RESULT);
		validateCpeMock.mockResolvedValue({
			isValid: true,
			status: 'VALID',
			errors: [],
			warnings: [],
			durationMs: 120,
			breachDetected: false,
			breachType: undefined,
			cacheHit: false,
			targetMs: 5000,
			withinTarget: true,
		});
		submitMock.mockResolvedValue({
			submissionId: 'sub-123',
			status: 'accepted',
		});
	});

	it('genera metadata PLE real y omite envio cuando dryRun=true', async () => {
		const { runSireAuditWorkflow } = await import(
			'../../workflows/sire-audit.workflow'
		);
		const events: Array<{ step: string; status: string }> = [];

		const result = await runSireAuditWorkflow(BASE_INPUT, (event) => {
			events.push({ step: event.step, status: event.status });
		});

		expect(generateSirePleFilesMock).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: BASE_INPUT.companyId,
				period: BASE_INPUT.period,
			}),
		);
		expect(result.pleFiles.ventas.filename).toBe('LE20123456789202607RV.txt');
		expect(result.pleFiles.compras.recordCount).toBe(7);
		expect(result.submission.attempted).toBe(false);
		expect(submitMock).not.toHaveBeenCalled();
		expect(
			events.some(
				(event) =>
					event.step === 'cpe-validation' && event.status === 'skipped',
			),
		).toBe(true);
	});

	it('bloquea el envio cuando CPE detecta breach', async () => {
		validateCpeMock.mockResolvedValue({
			isValid: false,
			status: 'BREACH_DETECTED',
			errors: [{ code: 'RUC_BREACH', message: 'RUC inconsistente' }],
			warnings: [],
			durationMs: 240,
			breachDetected: true,
			breachType: 'RUC_BREACH',
			cacheHit: false,
			targetMs: 5000,
			withinTarget: true,
		});

		const { runSireAuditWorkflow } = await import(
			'../../workflows/sire-audit.workflow'
		);

		const result = await runSireAuditWorkflow(
			{
				...BASE_INPUT,
				dryRun: false,
				cpeValidation: {
					cpeNumber: 'F001-00000001',
					xmlContent:
						'<Invoice><cac:AccountingSupplierParty><cbc:ID>20123456789</cbc:ID></cac:AccountingSupplierParty></Invoice>'.padEnd(
							160,
							' ',
						),
					issueDate: '2026-07-12',
					totalAmount: 1180,
				},
			},
			() => {},
		);

		expect(validateCpeMock).toHaveBeenCalled();
		expect(result.overallStatus).toBe('blocked');
		expect(result.anomalies.some((anomaly) => anomaly.type === 'cpe_breach')).toBe(
			true,
		);
		expect(result.submission.attempted).toBe(false);
		expect(submitMock).not.toHaveBeenCalled();
	});

	it('envia payload TXT de ventas cuando audit esta listo y live', async () => {
		const { runSireAuditWorkflow } = await import(
			'../../workflows/sire-audit.workflow'
		);

		await runSireAuditWorkflow(
			{
				...BASE_INPUT,
				dryRun: false,
			},
			() => {},
		);

		expect(submitMock).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: BASE_INPUT.companyId,
				ledgerType: 'ventas',
				payloadFormat: 'txt',
				payloadBase64: PLE_RESULT.files.ventas.payloadBase64,
			}),
		);
	});
});
