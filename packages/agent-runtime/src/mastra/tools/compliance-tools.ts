import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { redactSensitiveFields } from "../agents/compliance/compliance-redaction";
import {
	createFinding,
	riskScoreFromFindings,
} from "../agents/compliance/compliance-utils";

const severitySchema = z.enum(["info", "low", "medium", "high", "critical"]);

export const createFindingTool = createTool({
	id: "compliance-create-finding",
	description:
		"Create a deterministic compliance finding with auto-generated ID",
	inputSchema: z.object({
		severity: severitySchema,
		category: z.string().min(1),
		message: z.string().min(1),
		evidenceRefs: z.array(z.string()).optional(),
		recommendedAction: z.string().min(1),
		requiresApproval: z.boolean().optional(),
	}),
	outputSchema: z.object({
		id: z.string(),
		severity: severitySchema,
		category: z.string(),
		message: z.string(),
		evidenceRefs: z.array(z.string()),
		recommendedAction: z.string(),
		requiresApproval: z.boolean(),
	}),
	execute: async (input) => {
		const finding = createFinding(input);
		return { ...finding, evidenceRefs: [...finding.evidenceRefs] };
	},
});

export const riskScoreTool = createTool({
	id: "compliance-risk-score",
	description: "Calculate aggregate risk score from compliance findings",
	inputSchema: z.object({
		findings: z.array(
			z.object({
				id: z.string(),
				severity: severitySchema,
				category: z.string(),
				message: z.string(),
				evidenceRefs: z.array(z.string()),
				recommendedAction: z.string(),
				requiresApproval: z.boolean(),
			}),
		),
	}),
	outputSchema: z.object({
		riskScore: z.number().min(0).max(100),
	}),
	execute: async (input) => ({
		riskScore: riskScoreFromFindings(input.findings),
	}),
});

export const redactTool = createTool({
	id: "compliance-redact",
	description: "Redact sensitive fields from data",
	inputSchema: z.object({
		value: z.unknown(),
	}),
	outputSchema: z.object({
		redacted: z.unknown(),
	}),
	execute: async (input) => ({
		redacted: redactSensitiveFields(input.value),
	}),
});
