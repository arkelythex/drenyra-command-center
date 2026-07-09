import { google } from "@ai-sdk/google";
export const modelFlash = google("gemini-3-flash");
export const modelReasoning = google("gemini-3-pro");
export const modelOpus = google("gemini-3-pro");
export const MODEL_STRATEGY = {
	OCR: "flash",
	EXTRACTION: "flash",
	VALIDATION: "reasoning",
	CORRECTION: "reasoning",
	ANALYSIS: "opus",
};
export function getModelForTask(task) {
	const strategy = MODEL_STRATEGY[task];
	switch (strategy) {
		case "flash":
			return modelFlash;
		case "reasoning":
			return modelReasoning;
		case "opus":
			return modelOpus;
		default:
			return modelFlash;
	}
}
