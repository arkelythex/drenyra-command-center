/**
 * XmlValidityGate — validates XML against SUNAT XSD schema.
 *
 * In the current implementation, this is a stub that checks basic XML
 * structure. Full XSD validation requires loading the SUNAT XSD schemas
 * and running actual schema validation.
 */

import type {
	GatekeeperCheck,
	GatekeeperContext,
	GatekeeperVerdict,
} from "../types";

export interface XmlValidityInput {
	generatedXML?: string;
	schemaVersion?: string;
	[key: string]: unknown;
}

/**
 * Gate that checks if generated XML has basic validity.
 * Checks: non-empty, has XML declaration, has root element.
 * Full XSD validation would need packages/infrastructure/src/sunat/.
 */
export const XML_VALIDITY_GATE: GatekeeperCheck<XmlValidityInput> = {
	name: "XmlValidityGate",
	description: "Validates generated XML has basic structural validity",

	check: (data, _ctx: GatekeeperContext): GatekeeperVerdict => {
		const xml = data.generatedXML ?? data.xmlContent;
		if (typeof xml !== "string" || xml.trim().length === 0) {
			return {
				passed: false,
				reasons: ["No XML content generated"],
				severity: "BLOCKING",
				details: { receivedType: typeof xml },
			};
		}

		const trimmed = xml.trim();
		const hasXmlDeclaration = trimmed.startsWith("<?xml");
		const hasRootElement = /<(\w+:)?\w+[>\s]/.test(trimmed);

		if (!hasXmlDeclaration) {
			return {
				passed: false,
				reasons: ["XML declaration missing"],
				severity: "BLOCKING",
				details: { preview: trimmed.slice(0, 200) },
			};
		}

		if (!hasRootElement) {
			return {
				passed: false,
				reasons: ["No root element found in XML"],
				severity: "BLOCKING",
				details: { preview: trimmed.slice(0, 200) },
			};
		}

		return {
			passed: true,
			reasons: ["XML has valid structure"],
			severity: "INFO",
			details: {
				length: trimmed.length,
				schemaVersion: data.schemaVersion ?? "UBL_2.1",
			},
		};
	},
};
