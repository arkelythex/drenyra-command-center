import { Elysia } from "elysia";
import { z } from "zod";
import { fail, getErrorMessage } from "../../shared/api-response";
import { resolveYearMonth } from "../../sire/routes/helpers";
import { SireRegisterExportService as SIREService } from "../../sire/services/sire-register-export.service";

const SireDemoExportQuerySchema = z.object({
	companyId: z.string().min(1),
	ledgerType: z.union([z.literal("ventas"), z.literal("compras")]),
	format: z.union([z.literal("TXT"), z.literal("EXCEL")]),
	period: z
		.string()
		.regex(/^\d{4}-(0[1-9]|1[0-2])$/)
		.optional(),
});

function buildDownloadFileName(input: {
	ledgerType: "ventas" | "compras";
	format: "TXT" | "EXCEL";
	period: string;
}) {
	const ledgerSuffix = input.ledgerType === "ventas" ? "RVIE" : "RCE";
	const extension = input.format === "TXT" ? "txt" : "xlsx";
	return `sire-${ledgerSuffix}-${input.period}.${extension}`;
}

function buildContentType(format: "TXT" | "EXCEL") {
	return format === "TXT"
		? "text/plain; charset=utf-8"
		: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

function toResponseBody(content: string | Buffer): BodyInit {
	if (typeof content === "string") {
		return content;
	}

	return content.buffer.slice(
		content.byteOffset,
		content.byteOffset + content.byteLength,
	) as ArrayBuffer;
}

/**
 * sireDemoExportRoute const.
 *
 * @example
 * ```ts
 * console.log(sireDemoExportRoute);
 * ```
 */
export const sireDemoExportRoute = new Elysia().get(
	"/sire-demo-export",
	async ({ query, set }) => {
		try {
			const { year, month, period } = resolveYearMonth(query.period);
			const generator =
				query.ledgerType === "ventas"
					? SIREService.generateSalesRegister.bind(SIREService)
					: SIREService.generatePurchasesRegister.bind(SIREService);

			const content = await generator({
				year,
				month,
				companyId: query.companyId,
				format: query.format,
			});

			const fileName = buildDownloadFileName({
				ledgerType: query.ledgerType,
				format: query.format,
				period,
			});

			return new Response(toResponseBody(content), {
				headers: {
					"content-type": buildContentType(query.format),
					"content-disposition": `attachment; filename="${fileName}"`,
					"cache-control": "no-store",
					"x-sire-period": period,
					"x-sire-ledger-type": query.ledgerType,
				},
			});
		} catch (error: unknown) {
			set.status = 500;
			return fail(getErrorMessage(error), "SIRE_DEMO_EXPORT_ERROR");
		}
	},
	{
		query: SireDemoExportQuerySchema,
		detail: {
			tags: ["Compliance", "SIRE"],
			summary: "Download SIRE demo export",
			description:
				"Descarga un archivo SIRE (TXT o Excel) desde los datos demo sembrados para el periodo indicado.",
		},
	},
);
