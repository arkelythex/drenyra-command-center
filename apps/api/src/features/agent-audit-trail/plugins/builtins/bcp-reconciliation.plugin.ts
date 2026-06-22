import { registerAuditPlugin } from "../plugin-registry";

registerAuditPlugin({
	id: "bcp-reconciliation-v1",
	name: "BCP Reconciliation Guard",
	version: "1.0.0",
	description:
		"Detecta diferencias de conciliacion entre el monto esperado y el reconciliado para operaciones BCP.",
	capabilities: [
		"audit:read-inputs",
		"audit:read-outputs",
		"audit:emit-finding",
	],
	allowedPaths: [
		"inputs.bankCode",
		"inputs.expectedAmountPen",
		"outputs.reconciledAmountPen",
		"outputs.status",
	],
	scope: {
		agentNames: ["bank-reconciliation-agent"],
		decisionTypes: ["RECONCILIATION_REVIEW", "ALLOW", "BLOCK"],
	},
	conditions: [
		{
			kind: "path",
			path: "inputs.bankCode",
			operator: "eq",
			value: "BCP",
		},
		{
			kind: "path",
			path: "outputs.status",
			operator: "neq",
			value: "MATCHED",
		},
		{
			kind: "delta",
			leftPath: "inputs.expectedAmountPen",
			rightPath: "outputs.reconciledAmountPen",
			operator: "gt",
			value: 1,
		},
	],
	finding: {
		code: "BCP_CONCILIATION_DRIFT",
		message: "Diferencia de conciliacion BCP por encima de S/ 1.00.",
		severity: "high",
		recommendedAction:
			"Validar voucher, estado de cuenta y asiento antes de aprobar.",
	},
});

