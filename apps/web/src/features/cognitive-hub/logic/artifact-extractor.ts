/**
 * Artifact Extractor — parse <artifact> tags from AI responses
 *
 * Convention:
 *   <artifact type="TYPE">JSON_PAYLOAD</artifact>
 *
 * The `explanation` type is special: its body is plain text (not JSON).
 * All other types carry a JSON payload matching the HubArtifact discriminated union.
 *
 * @since Feb 2026
 */

import { trackEvent } from "@/lib/monitoring";
import type { ArtifactType, HubArtifact } from "@drenyra/shared/artifacts";

const ARTIFACT_REGEX = /<artifact\s+type="([^"]+)">([\s\S]*?)<\/artifact>/g;

/** Human-readable titles — exhaustive Record catches missing types at compile time */
const TITLES: Record<ArtifactType, string> = {
	explanation: "Explicación",
	chart: "Gráfico",
	table: "Tabla de Datos",
	action_card: "Acción Recomendada",
	simulation: "Simulación Financiera",
	comparison: "Análisis Comparativo",
	accounting_diff: "Diff Contable",
	sheet_diff: "Diff de Hoja",
	dashboard: "Panel de Control",
	search_result: "Resultados de Búsqueda",
	report: "Reporte",
	knowledge_graph: "Grafo de Conocimiento",
};

const VALID_TYPES = new Set<string>(Object.keys(TITLES));

/**
 * Extract structured artifacts from an AI response string.
 *
 * @param content - The full AI response (may contain artifact tags)
 * @returns Array of typed HubArtifact objects ready for rendering
 */
export function extractArtifacts(content: string): HubArtifact[] {
	const artifacts: HubArtifact[] = [];
	// Reset lastIndex — regex is module-level, must reset before each call
	const regex = new RegExp(ARTIFACT_REGEX.source, "g");

	let match: RegExpExecArray | null;
	while ((match = regex.exec(content)) !== null) {
		const [, rawType, rawBody] = match;
		const type = rawType.trim();
		const body = rawBody.trim();

		if (!VALID_TYPES.has(type)) {
			trackEvent("cognitive_hub.artifact_unknown_type", {
				type,
			});
			continue;
		}

		if (type === "explanation") {
			// explanation: body is plain text OR { "text": "..." } JSON
			let explanationContent = body;
			try {
				const parsed: unknown = JSON.parse(body);
				if (typeof parsed === "object" && parsed !== null && "text" in parsed) {
					const textValue = (parsed as { text: unknown }).text;
					if (typeof textValue === "string") explanationContent = textValue;
				}
			} catch {
				// body is plain prose — use as-is
			}

			artifacts.push({
				id: crypto.randomUUID(),
				type: "explanation",
				title: TITLES.explanation,
				content: explanationContent,
			});
			continue;
		}

		// All other types: body must be valid JSON
		try {
			const payload: unknown = JSON.parse(body);
			// Safe cast: VALID_TYPES guard + JSON parsing ensure runtime correctness.
			// TypeScript can't statically prove the payload shape matches the variant,
			// so we cast. The AI is prompted to generate correct shapes.
			artifacts.push({
				id: crypto.randomUUID(),
				type: type as Exclude<ArtifactType, "explanation">,
				title: TITLES[type as ArtifactType],
				payload,
			} as unknown as HubArtifact);
		} catch (err) {
			trackEvent("cognitive_hub.artifact_invalid_payload", {
				type,
				preview: body.slice(0, 200),
				hasError: Boolean(err),
			});
		}
	}

	return artifacts;
}

/**
 * Remove artifact XML tags from text, returning clean prose.
 *
 * Call this on `done` to display clean content in the chat bubble
 * while rendered artifacts appear as separate components below.
 */
export function stripArtifacts(content: string): string {
	return content
		.replace(/<artifact\s+type="[^"]+">[\s\S]*?<\/artifact>/g, "")
		.replace(/\n{3,}/g, "\n\n") // collapse triple+ newlines left after stripping
		.trim();
}
