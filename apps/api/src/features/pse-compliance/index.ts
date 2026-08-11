import { Elysia } from "elysia";
import { z } from "zod";
import { PseProactiveValidatorService } from "./pse-proactive-validator.service";

const service = new PseProactiveValidatorService();

const PseValidationSchema = z.object({
	companyId: z.string().min(1),
	period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
	ruc: z.string().length(11),
	ple: z.object({
		salesRecords: z.number().min(0),
		purchaseRecords: z.number().min(0),
		salesTotalPen: z.number().min(0),
		purchaseTotalPen: z.number().min(0),
	}),
	pdt: z.object({
		form: z.union([z.literal("621"), z.literal("626")]),
		declaredIgvPen: z.number().min(0),
		declaredNetSalesPen: z.number().min(0),
	}),
	sire: z
		.object({
			rvieRecords: z.number().min(0),
			rceRecords: z.number().min(0),
			accepted: z.boolean().optional(),
		})
		.optional(),
});

/**
 * pseComplianceRoutes const.
 *
 * @example
 * ```ts
 * console.log(pseComplianceRoutes);
 * ```
 */
export const pseComplianceRoutes = new Elysia({
	prefix: "/api/pse-compliance",
}).post(
	"/validate",
	async ({ body }) => {
		const result = await service.validate({
			companyId: body.companyId,
			period: body.period,
			ruc: body.ruc,
			ple: body.ple,
			pdt: body.pdt,
			...(body.sire !== undefined
				? {
						sire: {
							rvieRecords: body.sire.rvieRecords,
							rceRecords: body.sire.rceRecords,
							...(body.sire.accepted !== undefined
								? { accepted: body.sire.accepted }
								: {}),
						},
				  }
				: {}),
		});
		return {
			success: true,
			data: result,
		};
	},
	{
		body: PseValidationSchema,
		detail: {
			tags: ["PSE Compliance"],
			summary: "Validación proactiva PLE/PDT para envío por PSE",
			description:
				"Ejecuta subagentes en paralelo (IGV, RVIE/RCE, PDT) y devuelve alertas proactivas antes del envío.",
		},
	},
);
