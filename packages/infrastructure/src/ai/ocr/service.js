import { generateObject } from "ai";
import { loggers } from "../../logger";
import { getOCRPrompt } from "../prompts";
import { aiRouter } from "../router";
import { OCRResultSchema } from "../schemas/invoice";
export async function extractInvoiceData(options) {
	const startTime = Date.now();
	try {
		if (!options.imageUrl && !options.pdfUrl && !options.base64Data) {
			return {
				success: false,
				error: "Debe proporcionar imageUrl, pdfUrl, o base64Data",
			};
		}
		const { model, recordMetrics } = await aiRouter.route("OCR");
		const content = prepareContent(options);
		const result = await generateObject({
			model,
			schema: OCRResultSchema,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: getOCRPrompt(options.pdfUrl ? "pdf" : "image"),
						},
						content,
					],
				},
			],
			temperature: 0.1,
			maxRetries: 2,
		});
		const duration = Date.now() - startTime;
		const inputTokens = result.usage?.totalTokens || 0;
		const outputTokens = result.usage?.totalTokens || 0;
		const cost = calculateCost(inputTokens, outputTokens);
		recordMetrics(inputTokens, outputTokens, true);
		const data = options.organizationId
			? { ...result.object, organizationId: options.organizationId }
			: result.object;
		return {
			success: true,
			data: data,
			cost,
			duration,
			tokensUsed: {
				input: inputTokens,
				output: outputTokens,
			},
		};
	} catch (error) {
		const duration = Date.now() - startTime;
		loggers.ai.error("OCR error", { error });
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Error desconocido en OCR",
			duration,
		};
	}
}
function prepareContent(options) {
	if (options.imageUrl) {
		return {
			type: "image",
			image: options.imageUrl,
		};
	}
	if (options.pdfUrl) {
		return {
			type: "image",
			image: options.pdfUrl,
		};
	}
	if (options.base64Data) {
		const mimeType = options.mimeType || "image/jpeg";
		const dataUrl = `data:${mimeType};base64,${options.base64Data}`;
		return {
			type: "image",
			image: dataUrl,
		};
	}
	throw new Error("No valid image/PDF source provided");
}
function calculateCost(inputTokens, outputTokens) {
	const INPUT_COST_PER_1K = 0.000075;
	const OUTPUT_COST_PER_1K = 0.0003;
	const inputCost = (inputTokens / 1000) * INPUT_COST_PER_1K;
	const outputCost = (outputTokens / 1000) * OUTPUT_COST_PER_1K;
	return inputCost + outputCost;
}
export async function batchExtractInvoices(documents) {
	loggers.ai.info("Processing documents in batch", { count: documents.length });
	const BATCH_SIZE = 5;
	const results = [];
	for (let i = 0; i < documents.length; i += BATCH_SIZE) {
		const batch = documents.slice(i, i + BATCH_SIZE);
		const batchResults = await Promise.all(
			batch.map((doc) => extractInvoiceData(doc)),
		);
		results.push(...batchResults);
		if (i + BATCH_SIZE < documents.length) {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}
	const successCount = results.filter((r) => r.success).length;
	const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
	loggers.ai.info("Batch OCR complete", {
		successCount,
		total: documents.length,
		totalCost,
	});
	return results;
}
export async function extractFromFile(file, organizationId) {
	try {
		const base64Data = await fileToBase64(file);
		return await extractInvoiceData({
			base64Data,
			mimeType: file.type,
			organizationId,
		});
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Error al procesar archivo",
		};
	}
}
function fileToBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			const base64Parts = result.split(",");
			const base64 = base64Parts[1] || "";
			resolve(base64);
		};
		reader.onerror = () => reject(new Error("Error al leer archivo"));
		reader.readAsDataURL(file);
	});
}

