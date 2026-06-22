/** Smart Inbox UI constants — aligned with design spec 2026-05-23 */

export const INBOX_ACCEPT =
	".pdf,.xml,application/pdf,text/xml,image/jpeg,image/png";

export const INBOX_EXAMPLE_FILES = [
	{ label: "FAC-001.pdf", hint: "Factura PDF" },
	{ label: "BOL-002.xml", hint: "Boleta UBL" },
	{ label: "factura-foto.jpg", hint: "Foto escaneada" },
] as const;

export const INBOX_AGENT_ORDER = [
	"Reader",
	"Classifier",
	"Validator",
	"Accounting",
	"Reporter",
] as const;

export const INBOX_PROCESS_ENDPOINT = "/api/inbox/process";
