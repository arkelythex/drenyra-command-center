/**
 * XML Exporter
 * Generates UBL-like XML for SUNAT compliance
 */

import type { GetTrailResult } from "../application/queries/get-trail.query";

/**
 * XmlExportOptions interface.
 *
 * @example
 * ```ts
 * const value: XmlExportOptions = {} as XmlExportOptions;
 * console.log(value);
 * ```
 */
export interface XmlExportOptions {
	companyRuc: string;
	companyName: string;
}

/**
 * exportToXml operation.
 *
 * @param trail - Input for trail.
 * @param options - Input for options.
 * @returns Result of exportToXml.
 * @example
 * ```ts
 * const result = await exportToXml({} as GetTrailResult, {} as XmlExportOptions);
 * console.log(result);
 * ```
 */
export async function exportToXml(
	trail: GetTrailResult,
	options: XmlExportOptions,
): Promise<string> {
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AuditTrail xmlns="urn:drenyra:audit:1.0" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <Header>
    <cbc:CompanyRUC>${escapeXml(options.companyRuc)}</cbc:CompanyRUC>
    <cbc:CompanyName>${escapeXml(options.companyName)}</cbc:CompanyName>
    <cbc:GeneratedAt>${new Date().toISOString()}</cbc:GeneratedAt>
    <cbc:TotalEntries>${trail.total}</cbc:TotalEntries>
  </Header>
  <Entries>
${trail.logs
	.map(
		(log) => `    <Entry>
      <cbc:ID>${escapeXml(log.id)}</cbc:ID>
      <cbc:Timestamp>${log.createdAt.toISOString()}</cbc:Timestamp>
      <Agent>
        <cbc:Name>${escapeXml(log.agentName)}</cbc:Name>
      </Agent>
      <Decision>
        <cbc:Type>${escapeXml(log.decisionType)}</cbc:Type>
        <cbc:Reasoning>${log.reasoning ? escapeXml(log.reasoning) : ""}</cbc:Reasoning>
      </Decision>
      <Inputs><![CDATA[${toSafeCdata(JSON.stringify(log.inputs))}]]></Inputs>
      <Outputs><![CDATA[${toSafeCdata(JSON.stringify(log.outputs))}]]></Outputs>
      <Hash>${escapeXml(log.hash)}</Hash>
      <PrevHash>${escapeXml(log.prevHash ?? "GENESIS")}</PrevHash>
    </Entry>`,
	)
	.join("\n")}
  </Entries>
</AuditTrail>`;

	return xml.trim();
}

function toSafeCdata(raw: string): string {
	return raw.replaceAll("]]>", "]]]]><![CDATA[>");
}

function escapeXml(unsafe: string): string {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}
